import logging
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from . import models
from .database import get_db
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)

load_dotenv()

# Structured-ish logging for the checkout flow: one line per key event, with
# order/user/cart ids as fields instead of buried in free text, so it's easy
# to grep/aggregate in production log tooling.
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("ecommerce.checkout")

app = FastAPI()

# In production, set CORS_ORIGINS in backend/.env with the real front-end
# URL(s), comma-separated (e.g. "https://mysite.com,https://www.mysite.com").
# In development, it falls back to the default localhost:3000 from Create React App.
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
    session_id: Optional[str] = None  # guest cart to merge, if any


class UserOut(BaseModel):
    id: int
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CheckoutInfo(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address_street: Optional[str] = None
    address_city_state: Optional[str] = None
    address_zip: Optional[str] = None
    payment_method: str
    # Required for guest checkout (no auth token): identifies which guest
    # cart, tracked by session_id, to check out. Ignored for signed-in users.
    session_id: Optional[str] = None
    # When the client already showed the customer a price-change warning
    # (see PRICE_CHANGED below) and the customer chose to proceed, resend
    # the same request with this set to True to charge the current price.
    confirm_price_changes: bool = False


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    default_phone: Optional[str] = None
    default_address_street: Optional[str] = None
    default_address_city_state: Optional[str] = None
    default_address_zip: Optional[str] = None
    default_payment_method: Optional[str] = None


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
# Cart helpers (shared between guest and authenticated routes)
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
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product_id
    ).first()

    if existing_item:
        existing_item.quantity += quantity
        existing_item.price_snapshot = product.price
    else:
        db.add(models.CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            price_snapshot=product.price,
        ))

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
# Order/account helpers
# ---------------------------------------------------------------------------

# Mantidos em sincronia com as mesmas constantes no front-end (CheckoutPage.js).
SHIPPING_COST = 12.0
TAX_RATE = 0.08


def _serialize_order(order: models.Order):
    return {
        "id": order.id,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "payment_method": order.payment_method,
        "address_street": order.address_street,
        "address_city_state": order.address_city_state,
        "address_zip": order.address_zip,
        "subtotal": order.subtotal,
        "tax": order.tax,
        "shipping": order.shipping,
        "total": order.total,
        "items": [
            {
                "product_id": item.product_id,
                "name": item.product_name,
                "price": item.product_price,
                "image": item.product_image,
                "quantity": item.quantity,
            }
            for item in order.items
        ],
    }


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
# Cart (authenticated user)
#
# IMPORTANT: these fixed-path routes ("/cart/me...") must be registered
# BEFORE the dynamic routes ("/cart/{session_id}...") declared below.
# FastAPI matches routes in the order they're declared, so if the
# dynamic route came first, "/cart/me" would be captured by it with
# session_id="me" and the authenticated route would never be reached.
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
# Pedidos e conta do cliente
# ---------------------------------------------------------------------------

@app.post("/orders")
def place_order(
    payload: CheckoutInfo,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    if current_user:
        owner_desc = f"user_id={current_user.id}"
        cart = get_or_create_user_cart(db, current_user.id)
    else:
        # Guest checkout: no auth token, so the cart is identified by the
        # session_id the front-end has been using for this guest all along.
        if not payload.session_id:
            raise HTTPException(status_code=400, detail="session_id is required for guest checkout")
        owner_desc = f"session_id={payload.session_id}"
        cart = get_or_create_cart(db, payload.session_id)

    logger.info("checkout.start %s idempotency_key=%s", owner_desc, idempotency_key)

    def _find_existing_order():
        query = db.query(models.Order).filter(models.Order.idempotency_key == idempotency_key)
        if current_user:
            query = query.filter(models.Order.user_id == current_user.id)
        else:
            query = query.filter(models.Order.session_id == payload.session_id)
        return query.first()

    # Idempotent replay: if the client already sent this exact key (e.g. a
    # retried request after a timeout, or a double click), return the order
    # that was already created instead of placing a second one.
    if idempotency_key:
        existing_order = _find_existing_order()
        if existing_order:
            logger.info(
                "checkout.idempotent_replay %s order_id=%s idempotency_key=%s",
                owner_desc, existing_order.id, idempotency_key,
            )
            return _serialize_order(existing_order)

    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # A product may have been deleted from the catalog after being added to
    # the cart. Fail with a clear, actionable error instead of crashing on
    # item.product being None further down.
    missing_product_ids = [item.product_id for item in cart.items if item.product is None]
    if missing_product_ids:
        logger.warning("checkout.product_removed %s product_ids=%s", owner_desc, missing_product_ids)
        raise HTTPException(
            status_code=409,
            detail={
                "code": "PRODUCT_REMOVED",
                "message": "One or more items in your cart are no longer available. Please remove them to continue.",
                "product_ids": missing_product_ids,
            },
        )

    # A product's price may have changed since it was added to the cart.
    # Surface this explicitly rather than silently charging a different
    # amount than what the customer last saw.
    if not payload.confirm_price_changes:
        price_changes = [
            {
                "product_id": item.product_id,
                "old_price": item.price_snapshot,
                "new_price": item.product.price,
            }
            for item in cart.items
            if item.price_snapshot is not None and item.price_snapshot != item.product.price
        ]
        if price_changes:
            logger.warning("checkout.price_changed %s changes=%s", owner_desc, price_changes)
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "PRICE_CHANGED",
                    "message": "The price of one or more items changed. Review and confirm to continue.",
                    "changes": price_changes,
                },
            )

    # Price/items come from the cart already saved on the server, never from
    # what the client sends in the payload, preventing the total from being manipulated.
    subtotal = sum(item.product.price * item.quantity for item in cart.items)
    tax = round(subtotal * TAX_RATE, 2)
    total = subtotal + tax + SHIPPING_COST

    order = models.Order(
        user_id=current_user.id if current_user else None,
        session_id=payload.session_id if not current_user else None,
        idempotency_key=idempotency_key,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        address_street=payload.address_street,
        address_city_state=payload.address_city_state,
        address_zip=payload.address_zip,
        payment_method=payload.payment_method,
        subtotal=subtotal,
        tax=tax,
        shipping=SHIPPING_COST,
        total=total,
    )
    db.add(order)
    db.flush()  # generates order.id before creating the items

    for cart_item in cart.items:
        db.add(models.OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            product_name=cart_item.product.name,
            product_price=cart_item.product.price,
            product_image=cart_item.product.image,
            quantity=cart_item.quantity,
        ))

    if current_user:
        # Stored as a "preference" to pre-fill the next checkout
        # and to show up on the account page. Guests have no account to save this to.
        current_user.default_phone = payload.phone
        current_user.default_address_street = payload.address_street
        current_user.default_address_city_state = payload.address_city_state
        current_user.default_address_zip = payload.address_zip
        current_user.default_payment_method = payload.payment_method

    for item in list(cart.items):
        db.delete(item)

    try:
        db.commit()
    except IntegrityError:
        # Two concurrent requests raced past the earlier idempotency check
        # with the same key; the unique constraint caught the duplicate.
        # Roll back this attempt and hand back the order the other request
        # already created.
        db.rollback()
        # Only treat this as an idempotency-key race: without a key, this
        # constraint can't be what raised, and matching by NULL key could
        # otherwise return an unrelated earlier order as if it were this one.
        winner = _find_existing_order() if idempotency_key else None
        if winner:
            logger.info(
                "checkout.idempotent_race_resolved %s order_id=%s idempotency_key=%s",
                owner_desc, winner.id, idempotency_key,
            )
            return _serialize_order(winner)
        raise

    db.refresh(order)
    logger.info(
        "checkout.success %s order_id=%s total=%.2f items=%d",
        owner_desc, order.id, order.total, len(order.items),
    )
    return _serialize_order(order)


@app.get("/account")
def get_account(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "default_phone": current_user.default_phone,
        "default_address_street": current_user.default_address_street,
        "default_address_city_state": current_user.default_address_city_state,
        "default_address_zip": current_user.default_address_zip,
        "default_payment_method": current_user.default_payment_method,
        "orders": [_serialize_order(order) for order in orders],
    }


@app.put("/account")
def update_account(
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "default_phone": current_user.default_phone,
        "default_address_street": current_user.default_address_street,
        "default_address_city_state": current_user.default_address_city_state,
        "default_address_zip": current_user.default_address_zip,
        "default_payment_method": current_user.default_payment_method,
    }


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