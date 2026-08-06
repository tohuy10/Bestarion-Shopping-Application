package service

import (
	"context"
	"errors"
	"shopping-backend/internal/domain"
)

// productService implements domain.ProductService and encapsulates Product Business Rules.
type productService struct {
	repo domain.ProductRepository
}

// NewProductService constructs a new productService via Dependency Injection.
func NewProductService(repo domain.ProductRepository) domain.ProductService {
	return &productService{repo: repo}
}

// CreateProduct applies business validation rules before saving a product to the database
func (s *productService) CreateProduct(ctx context.Context, p *domain.Product) error {
	// 1. Business Rule: Product name cannot be empty
	if p.Name == "" {
		return errors.New("Product name cannot be empty")
	}
	// 2. Business Rule: Price must be strictly positive
	if p.Price <= 0 {
		return errors.New("Product price must be greater than 0")
	}

	return s.repo.Create(ctx, p)
}

// GetProducts handles search, category filtering, sorting, and pagination response calculations
func (s *productService) GetProducts(ctx context.Context, q domain.ProductQuery) (*domain.PaginatedResponse, error) {
	// 1. Apply default pagination fallbacks
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.Limit <= 0 {
		q.Limit = 5
	}

	// 2. Fetch products and total record count from Repository
	products, total, err := s.repo.GetList(ctx, q)
	if err != nil {
		return nil, err
	}

	// 3. Business Calculation: Total pages = ceil(total / limit)
	totalPages := 0
	if total > 0 {
		totalPages = (total + q.Limit - 1) / q.Limit
	}

	// 4. Return paginated domain response
	return &domain.PaginatedResponse{
		Data:       products,
		Total:      total,
		Page:       q.Page,
		Limit:      q.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetProductByID fetches product details by ID after validating the ID
func (s *productService) GetProductByID(ctx context.Context, id int64) (*domain.Product, error) {
	if id <= 0 {
		return nil, errors.New("Invalid product ID")
	}
	return s.repo.GetByID(ctx, id)
}

// UpdateProduct validates product updates and persists modifications
func (s *productService) UpdateProduct(ctx context.Context, id int64, p *domain.Product) (*domain.Product, error) {
	if id <= 0 {
		return nil, errors.New("Invalid product ID")
	}

	// 1. Verify existing product exists in database
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("Product not found")
	}

	// 2. Validate input fields
	if p.Name == "" {
		return nil, errors.New("Product name cannot be empty")
	}
	if p.Price <= 0 {
		return nil, errors.New("Product price must be greater than 0")
	}

	// 3. Apply updated fields
	existing.Name = p.Name
	existing.Category = p.Category
	existing.Price = p.Price
	existing.Stock = p.Stock
	existing.ImageURL = p.ImageURL

	// 4. Save changes down to database
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}

// DeleteProduct validates product existence and deletes it
func (s *productService) DeleteProduct(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("Invalid product ID")
	}

	// Verify existence prior to deletion
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return errors.New("Product not found")
	}

	return s.repo.Delete(ctx, id)
}

// GetCategories fetches unique category strings for frontend dropdown filters
func (s *productService) GetCategories(ctx context.Context) ([]string, error) {
	return s.repo.GetCategories(ctx)
}