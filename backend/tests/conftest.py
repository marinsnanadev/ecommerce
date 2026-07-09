import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app, get_db
from app.database import Base
from app.models import Category, Product


@pytest.fixture()
def db_session():
    """Cria um banco SQLite em memória, isolado para cada teste."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    """TestClient da API com o banco em memória injetado no lugar do banco real."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded_product(db_session):
    """Popula o banco de teste com uma categoria e um produto básicos."""
    category = Category(name="Suits", description="Tailored pieces", accent="Essentials", image="suit.jpg")
    db_session.add(category)
    db_session.flush()

    product = Product(
        id="red-suit",
        name="Red Suit",
        tag="New",
        price=220.0,
        blurb="A precise cut with sculpted shoulders.",
        image="red-suit.jpg",
        is_new=True,
        is_featured=True,
        category_id=category.id,
    )
    db_session.add(product)
    db_session.commit()

    return {"category": category, "product": product}