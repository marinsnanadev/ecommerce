from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from . import models
from .database import SessionLocal, engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int


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


def get_or_create_cart(db: Session, session_id: str):
    cart = db.query(models.Cart).filter(models.Cart.session_id == session_id).first()
    if not cart:
        cart = models.Cart(session_id=session_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


@app.get("/cart/{session_id}")
def get_cart(session_id: str, db: Session = Depends(get_db)):
    cart = get_or_create_cart(db, session_id)
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


@app.post("/cart/{session_id}/add")
def add_to_cart(session_id: str, item: CartItemCreate, db: Session = Depends(get_db)):
    cart = get_or_create_cart(db, session_id)

    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == item.product_id
    ).first()

    if existing_item:
        existing_item.quantity += item.quantity
    else:
        existing_item = models.CartItem(
            cart_id=cart.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(existing_item)

    db.commit()
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