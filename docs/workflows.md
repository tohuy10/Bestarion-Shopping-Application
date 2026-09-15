# 🔄 System Workflows - Bestarion Shopping Application

This document details the core end-to-end execution flows within the **Bestarion Shopping Application**.

---

## 1. Authentication & Security Workflow

### 1.1 User Registration & Admin Auto-Role Assignment (`POST /api/v1/auth/register`)
```text
User ──▶ Fills Register Form (email, username, password, full_name)
  │
  ▼
React (Axios) ──POST /api/v1/auth/register──▶ Go Backend (UserHandler)
  │                                                │
  │                                                ├── ShouldBindJSON validation
  │                                                ├── Check existing email in PostgreSQL
  │                                                ├── Hash password using bcrypt.GenerateFromPassword
  │                                                ├── Role Check:
  │                                                │   if email == "admin@gmail.com" => role = "admin"
  │                                                │   else => role = "customer"
  │                                                └── INSERT into `users` table
  │                                                │
  ◀── HTTP 201 Created { user } ───────────────────┘
```

### 1.2 User Login & Token Storage (`POST /api/v1/auth/login`)
```text
User ──▶ Enters email + password
  │
  ▼
React (Axios) ──POST /api/v1/auth/login──▶ Go Backend (UserHandler)
  │                                            │
  │                                            ├── Query user by email from PostgreSQL
  │                                            ├── Compare password via bcrypt.CompareHashAndPassword
  │                                            └── Generate JWT signed with JwtSecret (contains user_id & role)
  │                                            │
  ◀── HTTP 200 OK { token, user } ─────────────┘
  │
  ▼
React stores `token` in `localStorage`
  │
  ▼
Axios Interceptor automatically attaches `Authorization: Bearer <token>` to all subsequent HTTP requests
```

### 1.3 Request Authorization via Middleware (`AuthMiddleware`)
```text
React (Axios Request) ──▶ Authorization: Bearer <JWT>
  │
  ▼
[AuthMiddleware]
  ├── Missing / Invalid Header format ──▶ Abort with 401 Unauthorized
  ├── Cryptographic Signature Verification via JwtSecret
  ├── Expiration check
  └── Inject verified `user_id` into Gin Context: `c.Set("user_id", userID)`
  │
  ▼
[Downstream Handler] ──▶ Extracts `c.Get("user_id")` and executes business logic
```

---

## 2. Product Management & Local Image File Upload Workflow

### 2.1 Local File Selection & Image Upload (`POST /api/v1/upload`)
```text
Admin ──▶ Selects local image file from computer disk (.jpg, .png, .webp) in Product Form
  │
  ▼
React (Axios) ──POST /api/v1/upload (multipart/form-data)──▶ Go Backend (UploadHandler)
  │                                                             │
  │                                                             ├── Validate file extension (.jpg, .png, .webp, .gif)
  │                                                             ├── Create `./uploads` folder if missing on server
  │                                                             ├── Generate unique filename: timestamp_filename.png
  │                                                             ├── Save file binary to server disk at `./uploads/...`
  │                                                             └── Return static HTTP URL
  │                                                             │
  ◀── HTTP 200 OK { url: "http://localhost:8080/uploads/17000_image.png" }
  │
  ▼
React sets returned static URL as `image_url` on product object and sends POST/PUT /api/v1/products
```

### 2.2 Product Catalog Filtering & Pagination (`GET /api/v1/products`)
```text
Customer ──▶ Types search query, selects Category, or changes sorting
  │
  ▼
React ──GET /api/v1/products?search=phone&category=Electronics&page=1&limit=5──▶ Go Backend
  │                                                                                   │
  │                                                                                   ├── Build dynamic SQL query
  │                                                                                   ├── Query matching products & COUNT(*)
  │                                                                                   └── Calculate TotalPages = ceil(total / limit)
  │                                                                                   │
  ◀── HTTP 200 OK { data: [...products], total, page, totalPages } ───────────────────┘
```

---

## 3. Shopping Cart & Transactional Checkout Workflow

### 3.1 Adding Product to Cart (`POST /api/v1/cart/items`)
```text
Customer ──▶ Clicks "Add to Cart"
  │
  ▼
React ──POST /api/v1/cart/items { product_id: 5, quantity: 1 }──▶ Go Backend
  │                                                                    │
  │                                                                    ├── Check if item already exists in `cart_items` for user
  │                                                                    ├── If exists: UPDATE cart_items SET quantity = quantity + 1
  │                                                                    └── If new: INSERT INTO cart_items (user_id, product_id, quantity)
  │                                                                    │
  ◀── HTTP 200 OK { message: "Added to cart successfully" } ───────────┘
```

### 3.2 Atomic Transactional Checkout (`POST /api/v1/checkout`)
```text
Customer ──▶ Clicks "Checkout" in Cart Modal
  │
  ▼
React ──POST /api/v1/checkout──▶ Go Backend (ShoppingService)
  │                                  │
  │                                  ├── Begin PostgreSQL Transaction (`tx, err := db.BeginTx(ctx)`)
  │                                  ├── Fetch current user's cart items
  │                                  ├── Check product stock availability for each item
  │                                  ├── INSERT INTO `orders` (user_id, total_amount, status='completed')
  │                                  ├── Loop cart items: INSERT INTO `order_items` & UPDATE `products` SET stock = stock - quantity
  │                                  ├── DELETE FROM `cart_items` WHERE user_id = $1
  │                                  └── Commit Transaction (`tx.Commit()`)
  │                                  │
  ◀── HTTP 200 OK { message: "Checkout successful", order } ─────────┘
```
