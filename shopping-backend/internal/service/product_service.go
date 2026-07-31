package service

import (
	"context"
	"errors"
	"shopping-backend/internal/domain"
)

type productService struct {
	repo domain.ProductRepository
}

func NewProductService(repo domain.ProductRepository) domain.ProductService {
	return &productService{repo: repo}
}

func (s *productService) CreateProduct(ctx context.Context, p *domain.Product) error {
	// Business validation logic
	if p.Name == "" {
		return errors.New("tên sản phẩm không được để trống")
	}
	if p.Price <= 0 {
		return errors.New("giá sản phẩm phải lớn hơn 0")
	}

	return s.repo.Create(ctx, p)
}

// GetProducts được nâng cấp để hỗ trợ Tìm kiếm, Lọc, Sắp xếp và Phân trang
func (s *productService) GetProducts(ctx context.Context, q domain.ProductQuery) (*domain.PaginatedResponse, error) {
	// Gán giá trị mặc định cho phân trang nếu chưa truyền vào
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.Limit <= 0 {
		q.Limit = 5
	}

	products, total, err := s.repo.GetList(ctx, q)
	if err != nil {
		return nil, err
	}

	// Tính tổng số trang (TotalPages)
	totalPages := 0
	if total > 0 {
		totalPages = (total + q.Limit - 1) / q.Limit
	}

	return &domain.PaginatedResponse{
		Data:       products,
		Total:      total,
		Page:       q.Page,
		Limit:      q.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetProductByID lấy chi tiết 1 sản phẩm theo ID
func (s *productService) GetProductByID(ctx context.Context, id int64) (*domain.Product, error) {
	if id <= 0 {
		return nil, errors.New("ID sản phẩm không hợp lệ")
	}
	return s.repo.GetByID(ctx, id)
}

// UpdateProduct kiểm tra validate và cập nhật thông tin sản phẩm
func (s *productService) UpdateProduct(ctx context.Context, id int64, p *domain.Product) (*domain.Product, error) {
	if id <= 0 {
		return nil, errors.New("ID sản phẩm không hợp lệ")
	}

	// 1. Kiểm tra sản phẩm có tồn tại trong CSDL không
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("không tìm thấy sản phẩm cần cập nhật")
	}

	// 2. Validate dữ liệu đầu vào
	if p.Name == "" {
		return nil, errors.New("tên sản phẩm không được để trống")
	}
	if p.Price <= 0 {
		return nil, errors.New("giá sản phẩm phải lớn hơn 0")
	}

	// 3. Cập nhật các trường thông tin mới
	existing.Name = p.Name
	existing.Price = p.Price
	existing.Stock = p.Stock
	existing.ImageURL = p.ImageURL

	// 4. Lưu xuống CSDL
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}

// DeleteProduct xóa sản phẩm theo ID
func (s *productService) DeleteProduct(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("ID sản phẩm không hợp lệ")
	}

	// Kiểm tra sản phẩm có tồn tại trước khi xóa
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return errors.New("không tìm thấy sản phẩm để xóa")
	}

	return s.repo.Delete(ctx, id)
}