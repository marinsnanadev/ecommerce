def register_user(client, email="user@example.com", password="senha123", name="Test User"):
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


def test_place_order_requires_authentication(client):
    response = client.post("/orders", json=CHECKOUT_PAYLOAD)
    assert response.status_code == 401


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
    assert order["subtotal"] == 440.0  # 220 * 2, calculado no servidor
    assert order["tax"] == round(440.0 * 0.08, 2)
    assert order["shipping"] == 12.0
    assert order["total"] == order["subtotal"] + order["tax"] + order["shipping"]


def test_place_order_ignores_client_submitted_prices(client, seeded_product):
    """Regressão de segurança: o total do pedido nunca deve confiar em
    valores enviados pelo cliente, só no que está salvo no carrinho do
    servidor. O schema CheckoutInfo nem aceita itens/preços no payload."""
    data = register_user(client)
    headers = auth_headers(data["access_token"])
    client.post("/cart/me/add", json={"product_id": "red-suit", "quantity": 1}, headers=headers)

    tampered_payload = dict(CHECKOUT_PAYLOAD)
    tampered_payload["total"] = 0.01
    tampered_payload["items"] = [{"product_id": "red-suit", "price": 0.01, "quantity": 1}]

    response = client.post("/orders", json=tampered_payload, headers=headers)
    assert response.status_code == 200
    order = response.json()
    assert order["subtotal"] == 220.0  # preço real do produto, não o forjado


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
    assert body["name"] == "Test User"  # não enviado, deve permanecer igual
    assert body["email"] == "user@example.com"