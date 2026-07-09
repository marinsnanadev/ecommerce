import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models import Category, Product

Base.metadata.create_all(bind=engine)

categories_data = [
    {
        "name": "Suits",
        "description": "Sharp tailoring and sculptural silhouettes.",
        "accent": "Tailored essentials",
        "image": "suit-crop.jpg",
        "products": [
            {"id": "red-suit", "name": "Red Suit", "tag": "New", "price": 220,
             "blurb": "A precise cut with sculpted shoulders.", "image": "red-suit (1).jpg",
             "is_new": True, "is_featured": True},
            {"id": "white-suit", "name": "White Suit", "tag": "Featured", "price": 180,
             "blurb": "Clean lines with fluid movement.", "image": "white-suit (1).jpg",
             "is_new": False, "is_featured": True},
        ],
    },
    {
        "name": "Skirts",
        "description": "Fluid movement with elevated structure.",
        "accent": "Soft volume",
        "image": "skirt-crop.jpg",
        "products": [
            {"id": "brown-skirt", "name": "Brown Skirt", "tag": "Featured", "price": 150,
             "blurb": "Soft drape with a dramatic return.", "image": "brown-skirt (2).jpg",
             "is_new": False, "is_featured": True},
            {"id": "white-skirt", "name": "White Skirt", "tag": "New", "price": 130,
             "blurb": "An effortless silhouette for daily dressing.", "image": "white-skirt (2).jpg",
             "is_new": True, "is_featured": False},
        ],
    },
    {
        "name": "Dresses",
        "description": "Evening-ready pieces with a modern edge.",
        "accent": "Editorial form",
        "image": "dress-crop.jpg",
        "products": [
            {"id": "black-dress", "name": "Black Dress", "tag": "Featured", "price": 240,
             "blurb": "A dramatic column in polished satin.", "image": "black-dress.jpg",
             "is_new": False, "is_featured": True},
            {"id": "long-black-dress", "name": "Long Black Dress", "tag": "New", "price": 210,
             "blurb": "Fluid structure with a striking neckline.", "image": "long-black-dress.jpg",
             "is_new": True, "is_featured": False},
            {"id": "white-and-blue-dress", "name": "White and Blue Dress", "tag": "Limited", "price": 290,
             "blurb": "Statement volume for special occasions.", "image": "white-blue-dress.jpg",
             "is_new": False, "is_featured": False},
        ],
    },
    {
        "name": "Blouses",
        "description": "Refined layers with clean, polished lines.",
        "accent": "Quiet luxury",
        "image": "blouse-crop.jpg",
        "products": [
            {"id": "red-blouse", "name": "Red Blouse", "tag": "New", "price": 120,
             "blurb": "A crisp finish for polished layering.", "image": "red-blouse (1).jpg",
             "is_new": True, "is_featured": False},
        ],
    },
    {
        "name": "Jackets",
        "description": "Structured outerwear for bold simplicity.",
        "accent": "Layering staples",
        "image": "jacket-crop.jpg",
        "products": [
            {"id": "yellow-jacket", "name": "Yellow Jacket", "tag": "Featured", "price": 200,
             "blurb": "Structured with a fluid, soft shoulder.", "image": "yellow-jacket (2).jpg",
             "is_new": False, "is_featured": True},
        ],
    },
    {
        "name": "Pants",
        "description": "Modern cuts designed for movement.",
        "accent": "Clean lines",
        "image": "pants-crop.jpg",
        "products": [
            {"id": "black-pants", "name": "Black Pants", "tag": "Featured", "price": 140,
             "blurb": "A high-rise staple with clean tailoring.", "image": "black-pants (1).jpg",
             "is_new": False, "is_featured": True},
        ],
    },
    {
        "name": "Purses",
        "description": "Statement accessories with sculptural detail.",
        "accent": "Signature accents",
        "image": "purse-crop.jpg",
        "products": [
            {"id": "green-purse", "name": "Green Purse", "tag": "Featured", "price": 95,
             "blurb": "A compact silhouette with sculptural form.", "image": "green-purse.jpg",
             "is_new": False, "is_featured": True},
            {"id": "white-mini-purse", "name": "White Mini Purse", "tag": "New", "price": 110,
             "blurb": "Soft structure for everyday carry.", "image": "white-mini-purse.jpg",
             "is_new": True, "is_featured": False},
            {"id": "yellow-brown-purse", "name": "Yellow or Brown Purse", "tag": "Limited", "price": 125,
             "blurb": "Elevated evening texture in a minimalist shape.", "image": "yellow-brown-purse.jpg",
             "is_new": False, "is_featured": False},
            {"id": "white-purse", "name": "White Purse", "tag": "New", "price": 130,
             "blurb": "A versatile piece with a sculptural edge.", "image": "white-purse.jpg",
             "is_new": True, "is_featured": False},
        ],
    },
    {
        "name": "Glasses",
        "description": "Modern frames with a sharp, editorial point of view.",
        "accent": "Visionary style",
        "image": "glasses.jpg",
        "products": [
            {"id": "glasses-brown", "name": "Brown Glasses", "tag": "Featured", "price": 160,
             "blurb": "Tortoiseshell detailing with a soft, sculptural profile.", "image": "glasses-brown.jpg",
             "is_new": False, "is_featured": True},
            {"id": "glasses-black", "name": "Black Glasses", "tag": "New", "price": 175,
             "blurb": "A slim frame with understated contrast and precision.", "image": "glasses-black.jpg",
             "is_new": True, "is_featured": False},
            {"id": "glasses-brown-close", "name": "Brown Close Fit Glasses", "tag": "Limited", "price": 190,
             "blurb": "Clean lines and a close fit for an elevated everyday look.", "image": "glasses-brown-close.jpg",
             "is_new": False, "is_featured": False},
        ],
    },
]

def seed():
    db = SessionLocal()

    db.query(Product).delete()
    db.query(Category).delete()
    db.commit()

    for cat_data in categories_data:
        products_data = cat_data.pop("products")
        category = Category(**cat_data)
        db.add(category)
        db.flush()

        for p_data in products_data:
            product = Product(**p_data, category_id=category.id)
            db.add(product)

    db.commit()
    db.close()
    print("Banco populado com sucesso!")

if __name__ == "__main__":
    seed()