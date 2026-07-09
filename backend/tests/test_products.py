def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "backend running"}


def test_get_categories_empty(client):
    response = client.get("/categories")
    assert response.status_code == 200
    assert response.json() == []


def test_get_categories_returns_seeded_category(client, seeded_product):
    response = client.get("/categories")
    assert response.status_code == 200
    names = [category["name"] for category in response.json()]
    assert "Suits" in names


def test_get_products_returns_seeded_product_with_numeric_price(client, seeded_product):
    response = client.get("/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "red-suit"
    # price precisa ser numérico (Float), não string com "$" (ver item 5)
    assert isinstance(data[0]["price"], (int, float))
    assert data[0]["price"] == 220.0


def test_get_products_by_category_found(client, seeded_product):
    response = client.get("/products/category/Suits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Red Suit"


def test_get_products_by_category_not_found_returns_404(client, seeded_product):
    response = client.get("/products/category/DoesNotExist")
    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}