import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from . import models
from .database import get_db
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

load_dotenv()

app = FastAPI()

# Em produção, defina CORS_ORIGINS no backend/.env com a(s) URL(s) real(is)
# do front-end, separadas por vírgula (ex: "https://meusite.com,https://www.meusite.com").
# Em desenvolvimento, já cai no localhost:3000 padrão do Create React App.
_default_origins = "http://localhost:3000"
allowed_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    session_id: Optional[str] = None  # carrinho de convidado a mesclar, se houver


class UserOut(BaseModel):
    id: int
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


@app.get("/")
def read_root():
    return {"message": "backend running"}

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.get("/products/category/{category_name}")
def get_products_by_category(category_name: str, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.name == category_name).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category.products


# ---------------------------------------------------------------------------
# Helpers de carrinho (compartilhados entre rotas de convidado e autenticadas)
# ---------------------------------------------------------------------------

def get_or_create_cart(db: Session, session_id: str):
    cart = db.query(models.Cart).filter(models.Cart.session_id == session_id).first()
    if not cart:
        cart = models.Cart(session_id=session_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def get_or_create_user_cart(db: Session, user_id: int):
    cart = db.query(models.Cart).filter(models.Cart.user_id == user_id).first()
    if not cart:
        cart = models.Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _serialize_cart(cart: models.Cart):
    result = []
    for item in cart.items:
        product = item.product
        result.append({
            "item_id": item.id,
            "quantity": item.quantity,
            "product": {
                "id": product.id,
                "name": product.name,
                "tag": product.tag,
                "price": product.price,
                "blurb": product.blurb,
                "image": product.image,
                "is_new": product.is_new,
                "is_featured": product.is_featured,
                "category": product.category.name if product.category else None,
            },
        })
    return result


def _add_item_to_cart(db: Session, cart: models.Cart, product_id: str, quantity: int):
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product_id
    ).first()

    if existing_item:
        existing_item.quantity += quantity
    else:
        db.add(models.CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))

    db.commit()


def _merge_guest_cart_into_user_cart(db: Session, guest_cart: models.Cart, user_cart: models.Cart):
    for guest_item in list(guest_cart.items):
        existing_item = (
            db.query(models.CartItem)
            .filter(
                models.CartItem.cart_id == user_cart.id,
                models.CartItem.product_id == guest_item.product_id,
            )
            .first()
        )
        if existing_item:
            existing_item.quantity += guest_item.quantity
            guest_cart.items.remove(guest_item)
            db.delete(guest_item)
        else:
            guest_cart.items.remove(guest_item)
            user_cart.items.append(guest_item)
    db.delete(guest_cart)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/auth/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"access_token": token, "user": user}


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if payload.session_id:
        guest_cart = db.query(models.Cart).filter(models.Cart.session_id == payload.session_id).first()
        if guest_cart:
            user_cart = get_or_create_user_cart(db, user.id)
            _merge_guest_cart_into_user_cart(db, guest_cart, user_cart)
            db.commit()

    token = create_access_token(user.id)
    return {"access_token": token, "user": user}


@app.get("/auth/me", response_model=UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Cart (usuário autenticado)
#
# IMPORTANTE: essas rotas com path fixo ("/cart/me...") precisam ser
# registradas ANTES das rotas dinâmicas "/cart/{session_id}..." logo abaixo.
# O FastAPI casa rotas na ordem em que são declaradas, então se a rota
# dinâmica viesse primeiro, "/cart/me" seria capturada por ela com
# session_id="me" e a rota autenticada nunca seria alcançada.
# ---------------------------------------------------------------------------

@app.get("/cart/me")
def get_my_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = get_or_create_user_cart(db, current_user.id)
    return _serialize_cart(cart)


@app.post("/cart/me/add")
def add_to_my_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cart = get_or_create_user_cart(db, current_user.id)
    _add_item_to_cart(db, cart, item.product_id, item.quantity)
    return {"message": "Product added to cart"}


@app.put("/cart/me/item/{item_id}")
def update_my_cart_item(
    item_id: int,
    update: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.CartItem)
        .join(models.Cart)
        .filter(models.CartItem.id == item_id, models.Cart.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.quantity = update.quantity
    db.commit()
    return {"message": "Quantity updated"}


@app.delete("/cart/me/item/{item_id}")
def remove_my_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.CartItem)
        .join(models.Cart)
        .filter(models.CartItem.id == item_id, models.Cart.user_id == current_user.id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Item removed from cart"}


@app.delete("/cart/me")
def clear_my_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    if cart:
        for item in cart.items:
            db.delete(item)
        db.commit()
    return {"message": "Clean cart"}


# ---------------------------------------------------------------------------
# Cart (convidado, por session_id)
# ---------------------------------------------------------------------------

@app.get("/cart/{session_id}")
def get_cart(session_id: str, db: Session = Depends(get_db)):
    cart = get_or_create_cart(db, session_id)
    return _serialize_cart(cart)


@app.post("/cart/{session_id}/add")
def add_to_cart(session_id: str, item: CartItemCreate, db: Session = Depends(get_db)):
    cart = get_or_create_cart(db, session_id)
    _add_item_to_cart(db, cart, item.product_id, item.quantity)
    return {"message": "Product added to cart"}


@app.put("/cart/{session_id}/item/{item_id}")
def update_cart_item(session_id: str, item_id: int, update: CartItemUpdate, db: Session = Depends(get_db)):
    item = (
        db.query(models.CartItem)
        .join(models.Cart)
        .filter(models.CartItem.id == item_id, models.Cart.session_id == session_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.quantity = update.quantity
    db.commit()
    return {"message": "Quantity updated"}


@app.delete("/cart/{session_id}/item/{item_id}")
def remove_cart_item(session_id: str, item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(models.CartItem)
        .join(models.Cart)
        .filter(models.CartItem.id == item_id, models.Cart.session_id == session_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Item removed from cart"}


@app.delete("/cart/{session_id}")
def clear_cart(session_id: str, db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter(models.Cart.session_id == session_id).first()
    if cart:
        for item in cart.items:
            db.delete(item)
        db.commit()
    return {"message": "Clean cart"}