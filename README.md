# 🛒 Bestarion Shopping Application

A modern, full-stack E-commerce Web Application built with **Go** (Golang + Gin + PostgreSQL) for the REST API backend and **React** (Vite + Tailwind CSS + Lucide Icons) for the frontend user interface.

---

## 📁 Repository Structure

```text
Bestarion_Shopping_App/
├── shopping-backend/   # Go REST API backend server (Port 8080)
├── shopping-frontend/  # React Vite frontend application (Port 5173)
└── README.md           # Project documentation & setup instructions
```

---

## 🛠️ Prerequisites

Before running the application from scratch, ensure you have the following installed on your machine:

- [Go (Golang)](https://go.dev/dl/) v1.20 or later
- [Node.js](https://nodejs.org/) v18 or later (with `npm`)
- [PostgreSQL](https://www.postgresql.org/download/) database server running on `localhost:5432`

---

## 🚀 Setup & Installation Guide (From Scratch)

Follow these steps to set up and launch both the backend and frontend services.

### 1️⃣ Database Configuration (PostgreSQL)

1. Ensure your local PostgreSQL service is running on port `5432`.
2. Connect to PostgreSQL using `psql` or your preferred SQL tool (e.g. DBeaver, pgAdmin) and create a database named `go_react_post`:

```sql
CREATE DATABASE go_react_post;
```

---

### 2️⃣ Backend Setup (`shopping-backend`)

1. Open a terminal and navigate to the `shopping-backend` directory:
   ```bash
   cd shopping-backend
   ```

2. **Configure Environment Variables**:
   Copy the example environment file `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and set your PostgreSQL password and database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_actual_postgres_password
   DB_NAME=go_react_post
   DB_SSLMODE=disable
   ```

4. **Install Dependencies & Tidy Go Modules**:
   ```bash
   go mod tidy
   ```

5. **Start the Backend API Server**:
   ```bash
   go run ./cmd/api
   ```
   The backend API will start running at **`http://localhost:8080`**.

---

### 3️⃣ Frontend Setup (`shopping-frontend`)

1. Open a **second terminal window** and navigate to the `shopping-frontend` directory:
   ```bash
   cd shopping-frontend
   ```

2. **Install Node Packages**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```

4. Open your web browser and navigate to:
   **`http://localhost:5173`**

---

## ✨ Features & User Roles

- 🛍️ **Customer Storefront**:
  - Browse product catalog with real-time searching, price range filtering, and category selection.
  - Interactive shopping cart with quantity management.
  - Asynchronous checkout with instant order confirmation.
  - Personal **My Orders** history tab with printable receipt modals.

- 🛡️ **Admin Portal**:
  - **Product Management**: Add/Edit/Delete items, category assignment, direct image URL or local file upload preview.
  - **User Management**: View user list, filter by roles, assign/update roles (`Admin` or `Customer`) with built-in safety protection preventing demoting the last remaining admin.
  - **Order Management**: Oversee all user transactions with detailed order view and printable receipts.

---

## 🛠️ Tech Stack

- **Backend**: Go (Golang), Gin Framework, PostgreSQL (`lib/pq`), JWT Authentication, bcrypt, `godotenv`.
- **Frontend**: React (Vite), Tailwind CSS, Lucide React Icons, React Toastify.
