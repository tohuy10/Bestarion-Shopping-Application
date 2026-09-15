# 🔑 Accounts & Testing Guide - Bestarion Shopping Application

This document provides account registration rules, role privileges, and testing workflows for the **Bestarion Shopping Application**.

---

## 🔑 Account Registration & Admin Privileges Rule

The backend dynamically assigns roles during registration in `internal/service/user_service.go`:

```go
role := "customer"
if req.Email == "admin@gmail.com" {
    role = "admin"
}
```

### 📋 Account Roles Summary

| Registration Email | Assigned Role | Privileges & Access Rights |
| :--- | :--- | :--- |
| **`admin@gmail.com`** | **`admin`** | **Full Admin Privileges**: Create/Edit/Delete products, select & upload local product images to `./uploads`, view all system orders, promote/demote user roles. |
| **Any other email** (e.g. `user@example.com`) | **`customer`** | **Customer Privileges**: Browse product catalog, search & filter by category/price, add to cart, execute checkout, view personal order history & profile. |

---

## 🚀 How to Create & Test Accounts

### 1. Registering an Admin Account:
1. Open **`http://localhost:5173`** and click **Sign Up**.
2. Fill out the registration form with email: **`admin@gmail.com`** and any password (e.g. `123456`).
3. Click **Register**. The backend automatically detects `admin@gmail.com` and grants **`admin`** role privileges to this account!

### 2. Registering a Customer Account:
1. Open **`http://localhost:5173`** and click **Sign Up**.
2. Register with any other email address (e.g. `john@example.com`).
3. Click **Register**. The account will receive the standard **`customer`** role.

---

## 📸 Product Image Selection & Upload Workflow

Admin users can select local image files from their computer disk when creating or editing products:

1. Log in as an **Admin** (`admin@gmail.com`).
2. Go to **Admin Panel** -> **Product Management**.
3. Click **Add Product** or **Edit Product**.
4. Click **Choose Image File** to open local file selection from your computer disk (`.jpg`, `.png`, `.webp`, `.gif`).
5. Upon selection, the React frontend submits the image file binary via `POST /api/v1/upload` (multipart form data).
6. The Go backend receives the file, generates a unique timestamped filename, and saves it into the local `./uploads` directory on disk.
7. The static URL (`http://localhost:8080/uploads/<filename>`) is automatically stored in the product's `image_url` database field.
8. Persistent Docker Volume mount (`./shopping-backend/uploads:/app/uploads`) ensures uploaded images survive container restarts.
