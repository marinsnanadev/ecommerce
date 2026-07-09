from app.database import SessionLocal
from app.models import Category, Product

db = SessionLocal()
try:
    categories = db.query(Category).all()
    products = db.query(Product).all()
    print('categories', len(categories))
    print('products', len(products))
    for category in categories:
        if category.name == 'Glasses':
            print('glasses_category', category.name, category.description, category.accent)
            for product in category.products:
                print('glasses_product', product.id, product.name, product.price, product.image)
finally:
    db.close()
