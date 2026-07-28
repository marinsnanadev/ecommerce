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
    """Creates an in-memory SQLite database, isolated for each test."""
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
    """API TestClient with the in-memory database injected in place of the real one."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded_product(db_session):
    """Populates the test database with a basic category and product."""
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