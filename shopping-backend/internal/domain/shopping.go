package domain

import (
    "time"
)

type CartItem struct {
    ID          int64   `json:"id"`
    UserID      int64   `json:"user_id"`
    ProductID   int64   `json:"product_id"`
    ProductName string  `json:"product_name,omitempty"`
    Price       float64 `json:"price,omitempty"`
    Quantity    int     `json:"quantity"`
}

type Order struct {
    ID          int64       `json:"id"`
    UserID      int64       `json:"user_id"`
    TotalAmount float64     `json:"total_amount"`
    Status      string      `json:"status"`
    CreatedAt   time.Time   `json:"created_at"`
    Items       []OrderItem `json:"items,omitempty"`
}

type OrderItem struct {
    ID          int64   `json:"id"`
    OrderID     int64   `json:"order_id"`
    ProductID   int64   `json:"product_id"`
    ProductName string  `json:"product_name,omitempty"` // 🟢 Bổ sung field này
    Quantity    int     `json:"quantity"`
    Price       float64 `json:"price"`
}

type AddToCartReq struct {
    ProductID int64 `json:"product_id" binding:"required"`
    Quantity  int   `json:"quantity" binding:"required,gt=0"`
}