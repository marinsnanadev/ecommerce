def test_get_cart_creates_empty_cart_for_new_session(client):
    response = client.get("/cart/new-session")
    assert response.status_code == 200
    assert response.json() == []


def test_add_to_cart_creates_item(client, seeded_product):
    response = client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 2})
    assert response.status_code == 200

    cart = client.get("/cart/session-A").json()
    assert len(cart) == 1
    assert cart[0]["quantity"] == 2
    assert cart[0]["product"]["id"] == "red-suit"
    assert cart[0]["product"]["price"] == 220.0


def test_add_existing_product_increments_quantity_instead_of_duplicating(client, seeded_product):
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 3})

    cart = client.get("/cart/session-A").json()
    assert len(cart) == 1
    assert cart[0]["quantity"] == 4


def test_update_cart_item_in_own_session_succeeds(client, seeded_product):
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})
    item_id = client.get("/cart/session-A").json()[0]["item_id"]

    response = client.put(f"/cart/session-A/item/{item_id}", json={"quantity": 5})
    assert response.status_code == 200

    cart = client.get("/cart/session-A").json()
    assert cart[0]["quantity"] == 5


def test_update_nonexistent_item_returns_404(client):
    response = client.put("/cart/session-A/item/99999", json={"quantity": 5})
    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found"}


def test_update_cart_item_from_another_session_is_blocked(client, seeded_product):
    """Regressão do fix de segurança: session-B não pode alterar item da session-A."""
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})
    item_id = client.get("/cart/session-A").json()[0]["item_id"]

    response = client.put(f"/cart/session-B/item/{item_id}", json={"quantity": 99})
    assert response.status_code == 404

    # item da session-A precisa continuar intacto
    cart = client.get("/cart/session-A").json()
    assert cart[0]["quantity"] == 1


def test_remove_cart_item_in_own_session_succeeds(client, seeded_product):
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})
    item_id = client.get("/cart/session-A").json()[0]["item_id"]

    response = client.delete(f"/cart/session-A/item/{item_id}")
    assert response.status_code == 200
    assert client.get("/cart/session-A").json() == []


def test_remove_cart_item_from_another_session_is_blocked(client, seeded_product):
    """Regressão do fix de segurança: session-B não pode remover item da session-A."""
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})
    item_id = client.get("/cart/session-A").json()[0]["item_id"]

    response = client.delete(f"/cart/session-B/item/{item_id}")
    assert response.status_code == 200  # delete é idempotente, não vaza existência

    # item da session-A precisa continuar lá
    cart = client.get("/cart/session-A").json()
    assert len(cart) == 1


def test_clear_cart_removes_all_items(client, seeded_product):
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})

    response = client.delete("/cart/session-A")
    assert response.status_code == 200
    assert client.get("/cart/session-A").json() == []


def test_clear_cart_does_not_affect_other_sessions(client, seeded_product):
    client.post("/cart/session-A/add", json={"product_id": "red-suit", "quantity": 1})
    client.post("/cart/session-B/add", json={"product_id": "red-suit", "quantity": 1})

    client.delete("/cart/session-A")

    assert client.get("/cart/session-A").json() == []
    assert len(client.get("/cart/session-B").json()) == 1