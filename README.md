# VIOLET — E-commerce Full Stack

Loja virtual de moda com front-end em React e back-end em Python (FastAPI), com persistência de dados em banco SQL, autenticação de usuários, carrinho de compras e checkout funcionais.

![status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![react](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![fastapi](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![sqlite](https://img.shields.io/badge/SQLite-07405E?logo=sqlite&logoColor=white)

---

## 📸 Preview

### Home
![Home](docs/gifs/splash-and-homepage.gif)

### Login e logout
![Account](docs/gifs/login-logout.gif)

### Checkout
![Checkout](docs/gifs/placing-order.gif)

---

## ✨ Sobre o projeto

VIOLET é uma loja de roupas e acessórios construída inicialmente como projeto front-end, e evoluída para uma aplicação full stack completa. O objetivo foi sair de dados fictícios (hardcoded) para uma arquitetura real, com:

- API REST própria, construída em Python
- Banco de dados relacional persistindo produtos, categorias, usuários, carrinho e pedidos
- Autenticação de usuários com senha criptografada e sessão via JWT
- Fluxo de checkout completo, com opção de comprar como convidado ou criar conta
- Front-end em React consumindo os dados dinamicamente

## 🧱 Tech Stack

**Front-end**
- React
- CSS customizado (animações, scroll reveal, design responsivo)
- Testes com Jest + Testing Library

**Back-end**
- Python 3
- FastAPI
- SQLAlchemy (ORM)
- SQLite (banco de dados)
- Uvicorn (servidor ASGI)
- JWT (autenticação) + hash de senha com PBKDF2
- Testes com pytest

## 🚀 Funcionalidades

- [x] Listagem de categorias e produtos vinda do banco de dados
- [x] Filtros (Novo / Destaque) e ordenação por preço
- [x] Carrinho de compras persistente (sobrevive a refresh da página), vinculado a uma sessão de visitante
- [x] Adicionar, atualizar quantidade e remover itens do carrinho via API
- [x] Cadastro e login de usuários (senha com hash, sessão via JWT)
- [x] Ao logar ou criar conta, o carrinho de convidado é mesclado automaticamente com o da conta
- [x] Checkout com escolha entre continuar como convidado ou entrar/criar conta
- [x] Pedido calculado e persistido no servidor (nunca confia em preço enviado pelo cliente)
- [x] Página de conta do cliente: endereço, telefone e forma de pagamento preferida (editáveis) + histórico de pedidos
- [x] Modal de confirmação antes de deslogar
- [x] Documentação interativa da API gerada automaticamente (Swagger)
- [x] Suíte de testes automatizados no back-end (pytest) e no front-end (Jest)

## 🔌 Endpoints da API

**Produtos e categorias**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Lista todas as categorias |
| GET | `/products` | Lista todos os produtos |
| GET | `/products/category/{category_name}` | Lista produtos de uma categoria específica |

**Autenticação**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria uma conta nova (mescla o carrinho de convidado, se `session_id` for enviado) |
| POST | `/auth/login` | Autentica e retorna um token (mescla o carrinho de convidado, se `session_id` for enviado) |
| GET | `/auth/me` | Retorna os dados do usuário autenticado |

**Carrinho — convidado (por `session_id`)**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/cart/{session_id}` | Retorna os itens do carrinho da sessão |
| POST | `/cart/{session_id}/add` | Adiciona um produto ao carrinho |
| PUT | `/cart/{session_id}/item/{item_id}` | Atualiza a quantidade de um item |
| DELETE | `/cart/{session_id}/item/{item_id}` | Remove um item do carrinho |
| DELETE | `/cart/{session_id}` | Limpa o carrinho inteiro |

**Carrinho — usuário autenticado** (requer header `Authorization: Bearer {token}`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/cart/me` | Retorna os itens do carrinho da conta |
| POST | `/cart/me/add` | Adiciona um produto ao carrinho |
| PUT | `/cart/me/item/{item_id}` | Atualiza a quantidade de um item |
| DELETE | `/cart/me/item/{item_id}` | Remove um item do carrinho |
| DELETE | `/cart/me` | Limpa o carrinho inteiro |

**Pedidos e conta** (requer header `Authorization: Bearer {token}`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/orders` | Finaliza a compra a partir do carrinho da conta (preço calculado no servidor) |
| GET | `/account` | Retorna dados da conta, preferências salvas e histórico de pedidos |
| PUT | `/account` | Atualiza endereço, telefone ou forma de pagamento preferida |

Documentação interativa disponível em `/docs` quando o servidor está rodando.

## ⚙️ Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado
- [Python 3.10+](https://www.python.org/downloads/) instalado

### 1. Clone o repositório

```bash
git clone https://github.com/marinsnanadev/ecommerce.git
cd ecommerce
```

### 2. Rodando o back-end

```bash
cd backend
python -m venv venv

# Ativar o ambiente virtual
# Windows:
venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Popular o banco de dados com os dados iniciais
python -m app.seed

# Iniciar o servidor
uvicorn app.main:app --reload
```

O back-end estará disponível em `http://127.0.0.1:8000`.

> 💡 Copie `backend/.env.example` para `backend/.env` para definir `SECRET_KEY` (usada para assinar os tokens de login) e `CORS_ORIGINS` (URLs do front-end autorizadas a acessar a API). Em desenvolvimento local, os valores padrão já funcionam sem precisar criar esse arquivo.

#### Rodando os testes do back-end

```bash
cd backend
pip install -r requirements.txt  # já inclui pytest e httpx
pytest
```

### 3. Rodando o front-end

Em outro terminal, na raiz do projeto:

```bash
npm install
npm start
```

O front-end estará disponível em `http://localhost:3000` e já aponta por padrão para a API em `http://127.0.0.1:8000`.

> 💡 Se sua API estiver em outro endereço (ex: produção), copie `.env.example` para `.env` e ajuste a variável `REACT_APP_API_URL`.

#### Rodando os testes do front-end

```bash
npm test
```

> ⚠️ Os dois servidores (back-end e front-end) precisam estar rodando simultaneamente para a aplicação funcionar completamente.

## 🗺️ Roadmap / Próximos passos

- Painel administrativo para gestão de produtos
- Recuperação de senha por email
- Deploy do back-end (Render/Railway) e front-end (Vercel/Netlify)

## 👩‍💻 Autora

Desenvolvido por **Nana** — Estudante de Engenharia de Software, com experiência prévia como desenvolvedora full stack.

[GitHub](https://github.com/marinsnanadev)