from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    accent = Column(String)
    image = Column(String)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    tag = Column(String)
    price = Column(Float)
    blurb = Column(String)
    image = Column(String)
    is_new = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)

    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Preenchidos/atualizados automaticamente a cada pedido finalizado,
    # e editáveis diretamente na página de conta do cliente.
    default_phone = Column(String, nullable=True)
    default_address_street = Column(String, nullable=True)
    default_address_city_state = Column(String, nullable=True)
    default_address_zip = Column(String, nullable=True)
    default_payment_method = Column(String, nullable=True)

    cart = relationship("Cart", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="user", order_by="Order.created_at.desc()")


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)

    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    user = relationship("User", back_populates="cart")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    name = Column(String)
    email = Column(String)
    phone = Column(String)
    address_street = Column(String)
    address_city_state = Column(String)
    address_zip = Column(String)
    payment_method = Column(String)

    subtotal = Column(Float)
    tax = Column(Float)
    shipping = Column(Float)
    total = Column(Float)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(String, ForeignKey("products.id"), nullable=True)

    # Snapshot no momento da compra: preserva o pedido histórico mesmo que
    # o produto original mude de preço, nome ou seja removido depois.
    product_name = Column(String)
    product_price = Column(Float)
    product_image = Column(String)
    quantity = Column(Integer, default=1)

    order = relationship("Order", back_populates="items")