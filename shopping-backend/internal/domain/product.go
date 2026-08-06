package domain

import (
	"context"
	"time"
)

type Product struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"` // 🟢 MỚI: Bổ sung Category
	Price     float64   `json:"price"`
	Stock     int       `json:"stock"`
	ImageURL  *string    `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
}
// ProductQuery chứa các tham số query từ client
type ProductQuery struct {
	Search   string  `json:"search"`
	Category string  `json:"category"` // 🟢 MỚI: Bổ sung Category filter
	MinPrice float64 `json:"min_price"`
	MaxPrice float64 `json:"max_price"`
	SortBy   string  `json:"sort_by"`   // e.g., "price", "created_at", "name"
	Order    string  `json:"order"`     // "asc" hoặc "desc"
	Page     int     `json:"page"`
	Limit    int     `json:"limit"`
}

// PaginatedResponse cấu trúc trả về danh sách có phân trang
type PaginatedResponse struct {
	Data       []Product `json:"data"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	Limit      int       `json:"limit"`
	TotalPages int       `json:"total_pages"`
}

// Cập nhật lại Interface ProductRepository & ProductService
type ProductRepository interface {
	Create(ctx context.Context, product *Product) error
	GetList(ctx context.Context, query ProductQuery) ([]Product, int, error) // <--- Cập nhật hàm này
	GetByID(ctx context.Context, id int64) (*Product, error)
	Update(ctx context.Context, product *Product) error
	Delete(ctx context.Context, id int64) error
	GetCategories(ctx context.Context) ([]string, error) // 🟢 MỚI: Lấy danh sách các category duy nhất
}

type ProductService interface {
	CreateProduct(ctx context.Context, product *Product) error
	GetProducts(ctx context.Context, query ProductQuery) (*PaginatedResponse, error) // <--- Cập nhật hàm này
	GetProductByID(ctx context.Context, id int64) (*Product, error)
	UpdateProduct(ctx context.Context, id int64, product *Product) (*Product, error)
	DeleteProduct(ctx context.Context, id int64) error
	GetCategories(ctx context.Context) ([]string, error) // 🟢 MỚI: Service lấy danh sách category
}