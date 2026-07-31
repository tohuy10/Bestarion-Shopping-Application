package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"shopping-backend/internal/domain"
)

type productRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) domain.ProductRepository {
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';")
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, p *domain.Product) error {
	query := `
        INSERT INTO products (name, price, stock, image_url, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, created_at`

	return r.db.QueryRowContext(ctx, query, p.Name, p.Price, p.Stock, p.ImageURL).Scan(&p.ID, &p.CreatedAt)
}

// GetList thay thế cho GetAll cũ (hỗ trợ Tìm kiếm, Lọc, Sắp xếp và Phân trang)
func (r *productRepository) GetList(ctx context.Context, q domain.ProductQuery) ([]domain.Product, int, error) {
	var conditions []string
	var args []interface{}
	argID := 1

	// 1. Tìm kiếm theo tên (dùng ILIKE không phân biệt hoa thường)
	if q.Search != "" {
		conditions = append(conditions, fmt.Sprintf("name ILIKE $%d", argID))
		args = append(args, "%"+q.Search+"%")
		argID++
	}

	// 2. Lọc theo giá
	if q.MinPrice > 0 {
		conditions = append(conditions, fmt.Sprintf("price >= $%d", argID))
		args = append(args, q.MinPrice)
		argID++
	}
	if q.MaxPrice > 0 {
		conditions = append(conditions, fmt.Sprintf("price <= $%d", argID))
		args = append(args, q.MaxPrice)
		argID++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// 3. Đếm tổng số bản ghi thỏa điều kiện
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products %s", whereClause)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 4. Sắp xếp (Validate cột để chống SQL Injection)
	allowedSorts := map[string]bool{"price": true, "name": true, "created_at": true, "id": true}
	sortBy := "created_at"
	if allowedSorts[q.SortBy] {
		sortBy = q.SortBy
	}

	order := "DESC"
	if strings.ToLower(q.Order) == "asc" {
		order = "ASC"
	}

	// 5. Phân trang
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 10
	}
	offset := (q.Page - 1) * q.Limit

	// Cấu trúc query chính
	query := fmt.Sprintf(`
		SELECT id, name, price, stock, image_url, created_at 
		FROM products 
		%s 
		ORDER BY %s %s 
		LIMIT $%d OFFSET $%d`,
		whereClause, sortBy, order, argID, argID+1)

	args = append(args, q.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.ImageURL, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
	}

	return products, total, nil
}

// GetByID lấy chi tiết 1 sản phẩm theo ID
func (r *productRepository) GetByID(ctx context.Context, id int64) (*domain.Product, error) {
	query := `SELECT id, name, price, stock, image_url, created_at FROM products WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)

	var p domain.Product
	err := row.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.ImageURL, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// Update cập nhật thông tin sản phẩm
func (r *productRepository) Update(ctx context.Context, p *domain.Product) error {
	query := `UPDATE products SET name = $1, price = $2, stock = $3, image_url = $4 WHERE id = $5`
	_, err := r.db.ExecContext(ctx, query, p.Name, p.Price, p.Stock, p.ImageURL, p.ID)
	return err
}

// Delete xóa sản phẩm theo ID
func (r *productRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM products WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}