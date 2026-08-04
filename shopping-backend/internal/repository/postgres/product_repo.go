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
	query := `
	CREATE TABLE IF NOT EXISTS products (
		id BIGSERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		category VARCHAR(100) DEFAULT '',
		price NUMERIC(12, 2) NOT NULL DEFAULT 0,
		stock INT NOT NULL DEFAULT 0,
		image_url TEXT DEFAULT '',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	_, _ = db.Exec(query)
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';")
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '';")
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, p *domain.Product) error {
	// 🟢 2. Bổ sung category vào INSERT
	query := `
        INSERT INTO products (name, category, price, stock, image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, created_at`

	return r.db.QueryRowContext(ctx, query, p.Name, p.Category, p.Price, p.Stock, p.ImageURL).Scan(&p.ID, &p.CreatedAt)
}

func (r *productRepository) GetList(ctx context.Context, q domain.ProductQuery) ([]domain.Product, int, error) {
	var conditions []string
	var args []interface{}
	argID := 1

	// Tìm kiếm theo tên
	if q.Search != "" {
		conditions = append(conditions, fmt.Sprintf("name ILIKE $%d", argID))
		args = append(args, "%"+q.Search+"%")
		argID++
	}

	// Lọc theo Category
	if q.Category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argID))
		args = append(args, q.Category)
		argID++
	}

	// Lọc theo giá
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

	// Đếm tổng số bản ghi
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products %s", whereClause)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 🟢 3. Cho phép sắp xếp theo category
	allowedSorts := map[string]bool{"price": true, "name": true, "created_at": true, "id": true, "category": true}
	sortBy := "created_at"
	if allowedSorts[q.SortBy] {
		sortBy = q.SortBy
	}

	order := "DESC"
	if strings.ToLower(q.Order) == "asc" {
		order = "ASC"
	}

	// Phân trang
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 10
	}
	offset := (q.Page - 1) * q.Limit

	// 🟢 4. SELECT thêm cột category
	query := fmt.Sprintf(`
        SELECT id, name, category, price, stock, image_url, created_at 
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
		// 🟢 5. Scan thêm &p.Category
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.ImageURL, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
	}

	return products, total, nil
}

func (r *productRepository) GetByID(ctx context.Context, id int64) (*domain.Product, error) {
	// 🟢 6. SELECT và Scan thêm category
	query := `SELECT id, name, category, price, stock, image_url, created_at FROM products WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)

	var p domain.Product
	err := row.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.ImageURL, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *productRepository) Update(ctx context.Context, p *domain.Product) error {
	// 🟢 7. UPDATE thêm category
	query := `UPDATE products SET name = $1, category = $2, price = $3, stock = $4, image_url = $5 WHERE id = $6`
	_, err := r.db.ExecContext(ctx, query, p.Name, p.Category, p.Price, p.Stock, p.ImageURL, p.ID)
	return err
}

func (r *productRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM products WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *productRepository) GetCategories(ctx context.Context) ([]string, error) {
	query := `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []string{}
	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err == nil {
			categories = append(categories, cat)
		}
	}
	return categories, nil
}