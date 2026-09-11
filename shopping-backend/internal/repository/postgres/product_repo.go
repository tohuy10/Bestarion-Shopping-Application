package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"shopping-backend/internal/domain"
)

// productRepository implements domain.ProductRepository for PostgreSQL interactions.
type productRepository struct {
	db *sql.DB
}

// NewProductRepository constructs the repository and initializes schema migrations on startup
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

// Create inserts a new product record into PostgreSQL and scans the generated ID & timestamp back
func (r *productRepository) Create(ctx context.Context, p *domain.Product) error {
	query := `
        INSERT INTO products (name, category, price, stock, image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, created_at`

	return r.db.QueryRowContext(ctx, query, p.Name, p.Category, p.Price, p.Stock, p.ImageURL).Scan(&p.ID, &p.CreatedAt)
}

// GetList dynamically builds a SQL query for searching, category filtering, price filtering, sorting, and pagination
func (r *productRepository) GetList(ctx context.Context, q domain.ProductQuery) ([]domain.Product, int, error) {
	var conditions []string
	var args []interface{}
	argID := 1

	// 1. Case-insensitive search by product name
	if q.Search != "" {
		conditions = append(conditions, fmt.Sprintf("name ILIKE $%d", argID))
		args = append(args, "%"+q.Search+"%")
		argID++
	}

	// 2. Filter by category
	if q.Category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argID))
		args = append(args, q.Category)
		argID++
	}

	// 3. Filter by price range
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

	// 4. Count total records matching filter criteria
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products %s", whereClause)
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 5. Dynamic Sorting configuration
	allowedSorts := map[string]bool{"price": true, "name": true, "created_at": true, "id": true, "category": true}
	sortBy := "created_at"
	if allowedSorts[q.SortBy] {
		sortBy = q.SortBy
	}

	order := "DESC"
	if strings.ToLower(q.Order) == "asc" {
		order = "ASC"
	}

	// 6. Pagination calculation (OFFSET = (page - 1) * limit)
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 10
	}
	offset := (q.Page - 1) * q.Limit

	// 7. Execute paginated select query
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
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.ImageURL, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
	}

	return products, total, nil
}

// GetByID fetches a single product by ID
func (r *productRepository) GetByID(ctx context.Context, id int64) (*domain.Product, error) {
	query := `SELECT id, name, category, price, stock, image_url, created_at FROM products WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)

	var p domain.Product
	err := row.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.ImageURL, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// Update updates an existing product row in PostgreSQL
func (r *productRepository) Update(ctx context.Context, p *domain.Product) error {
	query := `UPDATE products SET name = $1, category = $2, price = $3, stock = $4, image_url = $5 WHERE id = $6`
	_, err := r.db.ExecContext(ctx, query, p.Name, p.Category, p.Price, p.Stock, p.ImageURL, p.ID)
	return err
}

// Delete removes a product record by ID
func (r *productRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM products WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// GetCategories fetches distinct category names for storefront filter dropdowns
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