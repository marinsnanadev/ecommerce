# VIOLET — E-commerce Full Stack

Loja virtual de moda com front-end em React e back-end em Python (FastAPI), com persistência de dados em banco SQL e carrinho de compras funcional.

![status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![react](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![fastapi](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![sqlite](https://img.shields.io/badge/SQLite-07405E?logo=sqlite&logoColor=white)

---

## 📸 Preview

### Home
![Home](docs/gifs/homepage.gif)


---

## ✨ Sobre o projeto

VIOLET é uma loja de roupas e acessórios construída inicialmente como projeto front-end, e evoluída para uma aplicação full stack completa. O objetivo foi sair de dados fictícios (hardcoded) para uma arquitetura real, com:

- API REST própria, construída em Python
- Banco de dados relacional persistindo produtos, categorias e carrinho
- Front-end em React consumindo os dados dinamicamente

## 🧱 Tech Stack

**Front-end**
- React
- CSS customizado (animações, scroll reveal, design responsivo)

**Back-end**
- Python 3
- FastAPI
- SQLAlchemy (ORM)
- SQLite (banco de dados)
- Uvicorn (servidor ASGI)

## 🚀 Funcionalidades

- [x] Listagem de categorias vinda do banco de dados
- [x] Listagem de produtos por categoria, com filtros (Novo / Destaque) e ordenação por preço
- [x] Carrinho de compras persistente (sobrevive a refresh da página), vinculado a uma sessão de visitante
- [x] Adicionar, atualizar quantidade e remover itens do carrinho via API
- [x] Documentação interativa da API gerada automaticamente (Swagger)
- [ ] Autenticação de usuário
- [ ] Checkout funcional
- [ ] Painel administrativo para cadastro de produtos


## 🔌 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Lista todas as categorias |
| GET | `/products` | Lista todos os produtos |
| GET | `/products/category/{category_name}` | Lista produtos de uma categoria específica |
| GET | `/cart/{session_id}` | Retorna os itens do carrinho de uma sessão |
| POST | `/cart/{session_id}/add` | Adiciona um produto ao carrinho |
| PUT | `/cart/{session_id}/item/{item_id}` | Atualiza a quantidade de um item |
| DELETE | `/cart/{session_id}/item/{item_id}` | Remove um item do carrinho |
| DELETE | `/cart/{session_id}` | Limpa o carrinho inteiro |

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

> ⚠️ Os dois servidores (back-end e front-end) precisam estar rodando simultaneamente para a aplicação funcionar completamente.

## 🗺️ Roadmap / Próximos passos

- Sistema de autenticação de usuários
- Painel administrativo para gestão de produtos
- Deploy do back-end (Render/Railway) e front-end (Vercel/Netlify)

## 👩‍💻 Autora

Desenvolvido por **Nana** — Estudante de Engenharia de Software, com experiência prévia como desenvolvedora full stack.

[GitHub](https://github.com/marinsnanadev)