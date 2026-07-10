def register_user(client, email="user@example.com", password="senha123", name="Test User"):
    response = client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_user_and_returns_token(client):
    data = register_user(client)
    assert data["user"]["email"] == "user@example.com"
    assert data["user"]["name"] == "Test User"
    assert "id" in data["user"]
    assert data["access_token"]
    assert data["token_type"] == "bearer"


def test_register_duplicate_email_returns_400(client):
    register_user(client)
    response = client.post(
        "/auth/register",
        json={"name": "Other", "email": "user@example.com", "password": "outrasenha"},
    )
    assert response.status_code == 400


def test_login_with_correct_credentials_succeeds(client):
    register_user(client)
    response = client.post("/auth/login", json={"email": "user@example.com", "password": "senha123"})
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "user@example.com"


def test_login_with_wrong_password_returns_401(client):
    register_user(client)
    response = client.post("/auth/login", json={"email": "user@example.com", "password": "errada"})
    assert response.status_code == 401


def test_login_with_unknown_email_returns_401(client):
    response = client.post("/auth/login", json={"email": "ghost@example.com", "password": "qualquer"})
    assert response.status_code == 401


def test_me_with_valid_token_returns_user(client):
    data = register_user(client)
    response = client.get("/auth/me", headers=auth_headers(data["access_token"]))
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_me_without_token_returns_401(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token_returns_401(client):
    response = client.get("/auth/me", headers=auth_headers("token-invalido"))
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# /cart/me — regressão do bug de ordenação de rotas
#
# "/cart/me" só funciona corretamente se for registrada ANTES de
# "/cart/{session_id}" no main.py. Caso contrário, o FastAPI trata "me"
# como um session_id literal e a autenticação é ignorada por completo.
# ---------------------------------------------------------------------------

def test_cart_me_requires_authentication(client):
    response = client.get("/cart/me")
    assert response.status_code == 401


def test_cart_me_with_invalid_token_is_rejected_not_treated_as_guest_session(client):
    """Sem essa proteção, '/cart/me' com token inválido cai na rota
    '/cart/{session_id}' (session_id='me') e retorna 200 com um carrinho
    de convidado vazio, em vez de barrar o acesso."""
    response = client.get("/cart/me", headers=auth_headers("token-invalido"))
    assert response.status_code == 401


def test_cart_me_is_isolated_per_user(client, seeded_product):
    user_a = register_user(client, email="a@example.com")
    user_b = register_user(client, email="b@example.com")

    client.post(
        "/cart/me/add",
        json={"product_id": "red-suit", "quantity": 2},
        headers=auth_headers(user_a["access_token"]),
    )

    cart_a = client.get("/cart/me", headers=auth_headers(user_a["access_token"])).json()
    cart_b = client.get("/cart/me", headers=auth_headers(user_b["access_token"])).json()

    assert len(cart_a) == 1
    assert cart_a[0]["quantity"] == 2
    assert cart_b == []


def test_cart_me_update_item_from_another_user_is_blocked(client, seeded_product):
    user_a = register_user(client, email="a@example.com")
    user_b = register_user(client, email="b@example.com")

    client.post(
        "/cart/me/add",
        json={"product_id": "red-suit", "quantity": 1},
        headers=auth_headers(user_a["access_token"]),
    )
    item_id = client.get("/cart/me", headers=auth_headers(user_a["access_token"])).json()[0]["item_id"]

    response = client.put(
        f"/cart/me/item/{item_id}",
        json={"quantity": 99},
        headers=auth_headers(user_b["access_token"]),
    )
    assert response.status_code == 404

    cart_a = client.get("/cart/me", headers=auth_headers(user_a["access_token"])).json()
    assert cart_a[0]["quantity"] == 1


# ---------------------------------------------------------------------------
# Merge do carrinho de convidado ao logar
# ---------------------------------------------------------------------------

def test_login_merges_guest_cart_into_user_cart(client, seeded_product):
    client.post("/cart/guest-session/add", json={"product_id": "red-suit", "quantity": 2})

    login_response = client.post(
        "/auth/login",
        json={"email": "merge@example.com", "password": "senha123", "session_id": "guest-session"},
    )
    # usuário ainda não existe -> 401; registra e tenta de novo
    assert login_response.status_code == 401
    register_user(client, email="merge@example.com", password="senha123")

    login_response = client.post(
        "/auth/login",
        json={"email": "merge@example.com", "password": "senha123", "session_id": "guest-session"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    user_cart = client.get("/cart/me", headers=auth_headers(token)).json()
    assert len(user_cart) == 1
    assert user_cart[0]["quantity"] == 2

    guest_cart = client.get("/cart/guest-session").json()
    assert guest_cart == []


def test_login_merge_increments_quantity_for_overlapping_product(client, seeded_product):
    data = register_user(client, email="merge2@example.com", password="senha123")
    client.post(
        "/cart/me/add",
        json={"product_id": "red-suit", "quantity": 1},
        headers=auth_headers(data["access_token"]),
    )

    client.post("/cart/guest-session-2/add", json={"product_id": "red-suit", "quantity": 3})

    login_response = client.post(
        "/auth/login",
        json={"email": "merge2@example.com", "password": "senha123", "session_id": "guest-session-2"},
    )
    token = login_response.json()["access_token"]

    user_cart = client.get("/cart/me", headers=auth_headers(token)).json()
    assert len(user_cart) == 1
    assert user_cart[0]["quantity"] == 4


def test_login_without_session_id_does_not_touch_other_guest_carts(client, seeded_product):
    register_user(client, email="nomerge@example.com", password="senha123")
    client.post("/cart/untouched-session/add", json={"product_id": "red-suit", "quantity": 5})

    client.post("/auth/login", json={"email": "nomerge@example.com", "password": "senha123"})

    guest_cart = client.get("/cart/untouched-session").json()
    assert len(guest_cart) == 1
    assert guest_cart[0]["quantity"] == 5