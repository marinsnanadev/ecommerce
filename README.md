# VIOLET — E-commerce Full Stack

A full-stack fashion e-commerce application, combining a React front-end with a Python (FastAPI) back-end. The project persists its data in a relational database and implements user authentication, a persistent shopping cart, and a complete checkout flow supporting both registered and guest customers.

![status](https://img.shields.io/badge/status-in%20development-yellow)
![react](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![fastapi](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![sqlite](https://img.shields.io/badge/SQLite-07405E?logo=sqlite&logoColor=white)

---

## Preview

### Home
![Home](docs/gifs/splash-and-homepage.gif)

### Login and logout
![Account](docs/gifs/login-logout.gif)

### Checkout
![Checkout](docs/gifs/placing-order.gif)

---

## About the project

VIOLET began as a front-end-only prototype for a clothing and accessories store and has since evolved into a complete full-stack application. The objective was to move beyond hardcoded, fictional data toward a real, production-oriented architecture, including:

- A custom REST API built in Python
- A relational database persisting products, categories, users, carts, and orders
- User authentication with encrypted passwords and JWT-based sessions
- A complete, idempotent checkout flow, supporting both guest checkout and authenticated accounts
- A React front-end consuming this data dynamically

## Technology Stack

**Front-end**
- React
- Custom CSS (animations, scroll reveal, responsive design)
- Tests with Jest and Testing Library

**Back-end**
- Python 3
- FastAPI
- SQLAlchemy (ORM)
- SQLite (database)
- Uvicorn (ASGI server)
- JWT authentication with PBKDF2 password hashing
- Tests with pytest

## Features

- Category and product listing pulled from the database
- Filtering (New / Featured) and sorting by price
- Persistent shopping cart (survives page refresh), tied to a guest session
- Add, update quantity, and remove cart items via the API
- User registration and login (hashed password, JWT-based session)
- Automatic merge of the guest cart into the account cart on login/registration
- Checkout supporting both guest customers and authenticated accounts, backed by a single order pipeline on the server
- Idempotent order submission via an `Idempotency-Key` header, so a network retry or a duplicate click never creates two orders
- Server-side validation at checkout: products removed from the catalog or price changes since the item was added to the cart are detected and surfaced explicitly, rather than silently charging a different amount
- Order total calculated and persisted entirely on the server; client-submitted prices are never trusted
- Structured logging across the checkout flow for observability
- Customer account page: editable address, phone, and preferred payment method, plus order history
- Confirmation modal before logging out
- Auto-generated interactive API documentation (Swagger)
- Automated test suite on both the back-end (pytest) and front-end (Jest)

## API Endpoints

**Products and categories**

| Method | Route | Description |
|--------|------|-----------|
| GET | `/categories` | Lists all categories |
| GET | `/products` | Lists all products |
| GET | `/products/category/{category_name}` | Lists products in a specific category |

**Authentication**

| Method | Route | Description |
|--------|------|-----------|
| POST | `/auth/register` | Creates a new account (merges the guest cart, if `session_id` is sent) |
| POST | `/auth/login` | Authenticates and returns a token (merges the guest cart, if `session_id` is sent) |
| GET | `/auth/me` | Returns the authenticated user's data |

**Cart — guest (by `session_id`)**

| Method | Route | Description |
|--------|------|-----------|
| GET | `/cart/{session_id}` | Returns the session's cart items |
| POST | `/cart/{session_id}/add` | Adds a product to the cart |
| PUT | `/cart/{session_id}/item/{item_id}` | Updates an item's quantity |
| DELETE | `/cart/{session_id}/item/{item_id}` | Removes an item from the cart |
| DELETE | `/cart/{session_id}` | Clears the entire cart |

**Cart — authenticated user** (requires `Authorization: Bearer {token}` header)

| Method | Route | Description |
|--------|------|-----------|
| GET | `/cart/me` | Returns the account's cart items |
| POST | `/cart/me/add` | Adds a product to the cart |
| PUT | `/cart/me/item/{item_id}` | Updates an item's quantity |
| DELETE | `/cart/me/item/{item_id}` | Removes an item from the cart |
| DELETE | `/cart/me` | Clears the entire cart |

**Orders and account**

| Method | Route | Description |
|--------|------|-----------|
| POST | `/orders` | Completes the purchase. Works for an authenticated user (`Authorization` header) or a guest (`session_id` in the body); price is always calculated on the server. Accepts an optional `Idempotency-Key` header to safely retry a request. |
| GET | `/account` | Returns account data, saved preferences, and order history (requires authentication) |
| PUT | `/account` | Updates address, phone, or preferred payment method (requires authentication) |

Interactive documentation is available at `/docs` while the server is running.

## Running the project locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [Python 3.10+](https://www.python.org/downloads/) installed

### 1. Clone the repository

```bash
git clone https://github.com/marinsnanadev/ecommerce.git
cd ecommerce
```

### 2. Running the back-end

```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Seed the database with initial data
python -m app.seed

# Start the server
uvicorn app.main:app --reload
```

The back-end will be available at `http://127.0.0.1:8000`.

Note: copy `backend/.env.example` to `backend/.env` to set `SECRET_KEY` (used to sign login tokens) and `CORS_ORIGINS` (front-end URLs authorized to access the API). In local development, the default values already work without creating this file.

#### Running the back-end tests

```bash
cd backend
pip install -r requirements.txt  # already includes pytest and httpx
pytest
```

### 3. Running the front-end

In another terminal, from the project root:

```bash
npm install
npm start
```

The front-end will be available at `http://localhost:3000` and points by default to the API at `http://127.0.0.1:8000`.

Note: if the API is hosted at a different address (e.g. production), copy `.env.example` to `.env` and adjust the `REACT_APP_API_URL` variable.

#### Running the front-end tests

```bash
npm test
```

Both servers (back-end and front-end) need to be running simultaneously for the application to work fully.

## Roadmap / Next steps

- Introduce versioned database migrations (Alembic) instead of relying on schema creation at startup
- Stock/quantity validation when adding or updating cart items
- Checkout metrics and alerting, complementing the existing structured logs
- Admin panel for product management
- Password recovery by email
- Deploy the back-end (Render/Railway) and front-end (Vercel/Netlify)

## Author

Developed by **Nana** — Software Engineering student, with prior experience as a full-stack developer.

[GitHub](https://github.com/marinsnanadev)