# 🏗️ System Architecture - Bestarion Shopping Application

## 1. Overview

The **Bestarion Shopping Application** is built using a modern **Client-Server Single Page Application (SPA)** architecture, communicating via a **RESTful API** (HTTP/JSON).

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │       ReactJS 18 + Vite (Port 5173)             │    │
│  │  ┌──────────┬──────────┬───────────┬─────────┐  │    │
│  │  │  Pages   │Components│Axios API  │ Navbar  │  │    │
│  │  │ (Router) │  (UI)    │Interceptor│ (State) │  │    │
│  │  └──────────┴──────────┴───────────┴─────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                           │ HTTP/REST (JSON)            │
└───────────────────────────┼─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVER LAYER                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │       Golang Gin Framework (Port 8080)          │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │           Middlewares                    │   │    │
│  │  │   (CORS, JWT Auth Middleware)            │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │  ┌─────────────┬─────────────┬──────────────┐   │    │
│  │  │  Handlers   │   Services  │    Repos     │   │    │
│  │  │ (HTTP I/O)  │ (Business)  │(database/sql)│   │    │
│  │  └─────────────┴─────────────┴──────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            ▼
┌────────────────────┐    ┌─────────────────────┐
│   PostgreSQL DB    │    │ Local Upload Volume │
│ (Port 5433:5432)   │    │  (./uploads/)       │
└────────────────────┘    └─────────────────────┘
```

---

## 2. Key Business & Technical Mechanics

### 2.1 Admin Role Registration Assignment
* In `internal/service/user_service.go`, role assignment logic enforces:
  * Registering with **`admin@gmail.com`** automatically grants the **`admin`** role.
  * All other emails receive the default **`customer`** role.

### 2.2 Local Image File Upload & Static Storage
* Admin users select image files locally from their computer disk in Product Management.
* The frontend submits the file binary via `POST /api/v1/upload` (multipart form data).
* `UploadHandler` validates image formats (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`), creates `./uploads` if missing, and saves the file locally on server disk with a unique timestamp prefix.
* The static file URL (`http://localhost:8080/uploads/<filename>`) is stored in the PostgreSQL database and served by Gin via `r.Static("/uploads", "./uploads")`.
* Persistent Docker bind mount (`./shopping-backend/uploads:/app/uploads`) prevents image loss across container restarts.

---

## 3. Detailed Tech Stack

| Layer     | Technology           | Purpose                                              |
| --------- | -------------------- | ---------------------------------------------------- |
| Frontend  | ReactJS 18           | Single Page Application (SPA) User Interface         |
| Frontend  | Vite                 | Fast build tool & Dev server with HMR                |
| Frontend  | Axios                | HTTP Client with JWT Authorization Interceptor       |
| Frontend  | Lucide React         | Modern UI Icons                                      |
| Frontend  | Vanilla CSS          | Modern CSS styling system & Glassmorphism design     |
| Frontend  | Nginx                | High-performance static asset web server in container|
| Backend   | Go 1.21+             | High-performance Backend API language                |
| Backend   | Gin Framework        | Lightweight HTTP Web Routing Framework               |
| Backend   | database/sql + lib/pq| Native PostgreSQL database driver & query execution  |
| Backend   | golang-jwt/jwt/v5    | JWT token generation and cryptographical validation  |
| Backend   | bcrypt               | Secure password hashing                              |
| Backend   | godotenv             | Environment variable manager                         |
| Database  | PostgreSQL 15-Alpine | Relational Database Management System (RDBMS)        |
| DevOps    | Docker & Compose     | Multi-container orchestration                        |
| CI/CD     | Jenkins              | Automated CI/CD build & deployment pipeline          |

---

## 4. HTTP Request Lifecycle

```
Client Request (React Axios via http://localhost:8080/api/v1)
    │
    ▼
[CORS Middleware]          ← Validates origins (http://localhost:3000, http://localhost:5173)
    │
    ▼
[JWT Auth Middleware]       ← Extracts & cryptographically verifies JWT Bearer token
    │                         Injects verified `user_id` into Gin Context (`c.Set("user_id", userID)`)
    ▼
[Handler Layer]            ← Parses URL params/JSON body, validates input format
    │
    ▼
[Service Layer]            ← Executes domain business logic (e.g. admin@gmail.com check, stock, pricing)
    │
    ▼
[Repository Layer]         ← Prepares & executes raw SQL queries via database/sql
    │
    ▼
[PostgreSQL Database]      ← Data persistence layer
    │
    ▼
Response ← Structured JSON response with standard HTTP status code (200, 201, 400, 401, 500)
```

---

## 5. Architectural Patterns & Clean Code

1. **Dependency Injection**: Handlers wrap Services, and Services wrap Repositories. Interfaces define contracts for easy mocking and testing.
2. **Context Propagation (`context.Context`)**: `c.Request.Context()` is passed down from Handler to Repository queries to automatically cancel SQL queries if a client disconnects.
3. **Stateless Authentication**: API endpoints authenticate via stateless JWT tokens (`Authorization: Bearer <token>`). User roles (`admin` vs `customer`) dictate authorization levels.
4. **Data Persistence**:
   * Database data is preserved using PostgreSQL named Docker volume `postgres_data`.
   * Uploaded product images are stored on disk in `./shopping-backend/uploads` and served as static assets via `r.Static("/uploads", "./uploads")`.

---

## 6. Precise Docker Compose Architecture (`docker-compose.yml`)

```yaml
services:
  # 1. Database Service (Exposed on Host Port 5433 -> Container Port 5432)
  postgres_db:
    image: postgres:15-alpine
    container_name: shopping_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_postgres_password
      POSTGRES_DB: go_react_post
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U postgres -d go_react_post" ]

  # 2. Go Backend API Service (Exposed on Host Port 8080 -> Container Port 8080)
  backend:
    build:
      context: ./shopping-backend
      dockerfile: Dockerfile
    container_name: shopping_backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres_db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: your_postgres_password
      DB_NAME: go_react_post
      DB_SSLMODE: disable
    volumes:
      - ./shopping-backend/uploads:/app/uploads
    depends_on:
      postgres_db:
        condition: service_healthy

  # 3. React Frontend Service (Exposed on Host Port 5173 -> Container Nginx Port 80)
  frontend:
    build:
      context: ./shopping-frontend
      dockerfile: Dockerfile
    container_name: shopping_frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```
