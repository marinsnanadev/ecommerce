import pytest
from sqlalchemy.exc import IntegrityError


def register_user(client, email="user@example.com", password="password123", name="Test User"):
    response = client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


CHECKOUT_PAYLOAD = {
    "name": "Test User",
    "email": "user@example.com",
    "phone": "+55 13 99999-0000",
    "address_street": "Rua das Flores, 123",
    "address_city_state": "Santos, SP",
    "address_zip": "11000-000",
    "payment_method": "paypal",
}


def test_place_order_without_auth_or_session_returns_400(client):
    """Neither an auth token nor a session_id was provided, so there's no
    cart to check out — guest checkout requires session_id in the payload."""
    response = client.post("/orders", json=CHECKOUT_PAYLOAD)
    assert response.status_code == 400


def test_place_order_with_empty_cart_returns_400(client):
    data = register_user(client)
    response = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=auth_headers(data["access_token"]))
    assert response.status_code == 400


def test_place_order_computes_totals_from_server_side_cart(client, seeded_product):
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 2}, headers=headers)

    response = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert response.status_code == 200, response.text
    order = response.json()

    assert len(order["items"]) == 1
    assert order["items"][0]["quantity"] == 2
    assert order["subtotal"] == 440.0  # 220 * 2, calculated on the server
    assert order["tax"] == round(440.0 * 0.08, 2)
    assert order["shipping"] == 12.0
    assert order["total"] == order["subtotal"] + order["tax"] + order["shipping"]


def test_place_order_ignores_client_submitted_prices(client, seeded_product):
    """Security regression test: the order total must never trust
    values sent by the client, only what's saved in the server's
    cart. The CheckoutInfo schema doesn't even accept items/prices in the payload."""
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    tampered_payload = dict(CHECKOUT_PAYLOAD)
    tampered_payload["total"] = 0.01
    tampered_payload["items"] = [{"product_id": "red-suit", "price": 0.01, "quantity": 1}]

    response = client.post("/orders", json=tampered_payload, headers=headers)
    assert response.status_code == 200
    order = response.json()
    assert order["subtotal"] == 220.0  # real product price, not the forged one


def test_place_order_clears_the_cart(client, seeded_product):
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)

    cart = client.get("/cart/me", headers=headers).json()
    assert cart == []


def test_place_order_saves_data_as_account_defaults(client, seeded_product):
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)

    account = client.get("/account", headers=headers).json()
    assert account["default_address_street"] == "Rua das Flores, 123"
    assert account["default_address_city_state"] == "Santos, SP"
    assert account["default_payment_method"] == "paypal"
    assert account["default_phone"] == "+55 13 99999-0000"


def test_account_requires_authentication(client):
    response = client.get("/account")
    assert response.status_code == 401


def test_account_lists_orders_most_recent_first(client, seeded_product):
    data = register_user(client)
    headers = auth_headers(data["access_token"])

    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)
    first_order = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers).json()

    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 3}, headers=headers)
    second_order = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers).json()

    account = client.get("/account", headers=headers).json()
    assert len(account["orders"]) == 2
    assert account["orders"][0]["id"] == second_order["id"]
    assert account["orders"][1]["id"] == first_order["id"]


def test_account_is_isolated_per_user(client, seeded_product):
    user_a = register_user(client, email="a@example.com")
    user_b = register_user(client, email="b@example.com")

    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=auth_headers(user_a["access_token"]))
    client.post("/orders", json=CHECKOUT_PAYLOAD, headers=auth_headers(user_a["access_token"]))

    account_a = client.get("/account", headers=auth_headers(user_a["access_token"])).json()
    account_b = client.get("/account", headers=auth_headers(user_b["access_token"])).json()

    assert len(account_a["orders"]) == 1
    assert len(account_b["orders"]) == 0
    assert account_b["default_address_street"] is None


def test_update_account_requires_authentication(client):
    response = client.put("/account", json={"name": "Novo Nome"})
    assert response.status_code == 401


def test_update_account_only_changes_provided_fields(client):
    data = register_user(client)
    headers = auth_headers(data["access_token"])

    response = client.put("/account", json={"default_address_zip": "22000-000"}, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["default_address_zip"] == "22000-000"
    assert body["name"] == "Test User"  # not submitted, must remain unchanged
    assert body["email"] == "user@example.com"


# ---------------------------------------------------------------------------
# Edge cases: idempotency, removed product, price drift
# ---------------------------------------------------------------------------

def test_repeated_idempotency_key_returns_the_same_order(client, seeded_product):
    """A retried request (double click, client timeout + retry) with the
    same Idempotency-Key must not create a second order."""
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    headers["Idempotency-Key"] = "checkout-abc-123"
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    first = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert first.status_code == 200, first.text

    # Cart is already empty on the retry, but the same key must still short-circuit
    # to the original order instead of failing with "Cart is empty".
    second = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert second.status_code == 200, second.text
    assert second.json()["id"] == first.json()["id"]

    account = client.get("/account", headers=headers).json()
    assert len(account["orders"]) == 1


def test_different_idempotency_keys_create_separate_orders(client, seeded_product):
    data = register_user(client)
    headers = auth_headers(data["access_token"])

    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)
    headers["Idempotency-Key"] = "checkout-key-1"
    client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)

    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)
    headers["Idempotency-Key"] = "checkout-key-2"
    client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)

    account = client.get("/account", headers=headers).json()
    assert len(account["orders"]) == 2


def test_place_order_rejects_removed_product(client, seeded_product, db_session):
    """If a product was deleted from the catalog after being added to the
    cart, checkout must fail with a clear, actionable error instead of a
    500 crash on a None product."""
    from app import models

    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    product = db_session.query(models.Product).filter(models.Product.id == "red-suit").first()
    db_session.delete(product)
    db_session.commit()

    response = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert response.status_code == 409
    body = response.json()["detail"]
    assert body["code"] == "PRODUCT_REMOVED"
    assert "red-suit" in body["product_ids"]


def test_place_order_flags_price_change_before_charging(client, seeded_product, db_session):
    """If the price changed after the item was added to the cart, the first
    checkout attempt must be blocked with the details of the change, not
    silently charge the new price."""
    from app import models

    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    product = db_session.query(models.Product).filter(models.Product.id == "red-suit").first()
    product.price = 275.0
    db_session.commit()

    blocked = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert blocked.status_code == 409
    body = blocked.json()["detail"]
    assert body["code"] == "PRICE_CHANGED"
    assert body["changes"][0] == {"product_id": "red-suit", "old_price": 220.0, "new_price": 275.0}

    # Customer reviews the new price and confirms: the same request, with
    # confirm_price_changes=True, now goes through at the current price.
    confirmed_payload = dict(CHECKOUT_PAYLOAD, confirm_price_changes=True)
    confirmed = client.post("/orders", json=confirmed_payload, headers=headers)
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["subtotal"] == 275.0


# ---------------------------------------------------------------------------
# Guest checkout (no account, cart tracked by session_id)
# ---------------------------------------------------------------------------

def test_guest_checkout_creates_order_and_clears_cart(client, seeded_product):
    session_id = "guest-session-1"
    client.post("/cart/guest-session-1/add", json={"product_id": "red-suit", "quantity": 2})

    payload = dict(CHECKOUT_PAYLOAD, session_id=session_id)
    response = client.post("/orders", json=payload)
    assert response.status_code == 200, response.text
    order = response.json()
    assert order["subtotal"] == 440.0  # 220 * 2, from the server-side cart

    cart = client.get(f"/cart/{session_id}").json()
    assert cart == []


def test_guest_checkout_without_session_id_returns_400(client, seeded_product):
    response = client.post("/orders", json=CHECKOUT_PAYLOAD)
    assert response.status_code == 400


def test_guest_checkout_repeated_idempotency_key_returns_same_order(client, seeded_product):
    session_id = "guest-session-2"
    client.post("/cart/guest-session-2/add", json={"product_id": "red-suit", "quantity": 1})

    payload = dict(CHECKOUT_PAYLOAD, session_id=session_id)
    headers = {"Idempotency-Key": "guest-checkout-key-1"}

    first = client.post("/orders", json=payload, headers=headers)
    assert first.status_code == 200, first.text

    second = client.post("/orders", json=payload, headers=headers)
    assert second.status_code == 200, second.text
    assert second.json()["id"] == first.json()["id"]


def test_guest_and_authenticated_orders_are_independent(client, seeded_product):
    """A guest and a logged-in user checking out around the same time must
    never be able to see or affect each other's order."""
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)
    client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)

    session_id = "guest-session-3"
    client.post("/cart/guest-session-3/add", json={"product_id": "red-suit", "quantity": 1})
    guest_payload = dict(CHECKOUT_PAYLOAD, session_id=session_id)
    guest_response = client.post("/orders", json=guest_payload)
    assert guest_response.status_code == 200, guest_response.text

    account = client.get("/account", headers=headers).json()
    assert len(account["orders"]) == 1  # guest order not attributed to this user


def test_unrelated_commit_failure_without_idempotency_key_is_not_swallowed(client, seeded_product, db_session):
    """The IntegrityError fallback exists to resolve idempotency-key races.
    Without a key, a commit failure can't be that race — it must propagate
    instead of being mistaken for one and silently returning some unrelated
    earlier order as if it were this request's result."""
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    # An earlier order (no idempotency key) already exists for this user —
    # this is the order that must NOT be returned below.
    earlier = client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert earlier.status_code == 200, earlier.text

    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    original_commit = db_session.commit
    call_count = {"n": 0}

    def failing_commit():
        call_count["n"] += 1
        if call_count["n"] == 1:
            raise IntegrityError("simulated", {}, Exception("unrelated constraint violation"))
        return original_commit()

    db_session.commit = failing_commit
    try:
        with pytest.raises(IntegrityError):
            client.post("/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    finally:
        db_session.commit = original_commit