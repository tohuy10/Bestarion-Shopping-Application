package service

import (
	"context"
	"shopping-backend/internal/domain"
	"shopping-backend/internal/repository/postgres"
)

type ShoppingService struct {
	repo *postgres.ShoppingRepository
}

func NewShoppingService(repo *postgres.ShoppingRepository) *ShoppingService {
	return &ShoppingService{repo: repo}
}

// Lấy giỏ hàng
func (s *ShoppingService) GetCart(ctx context.Context, userID int64) ([]domain.CartItem, error) {
	return s.repo.GetCartItems(ctx, userID)
}

// Thêm sản phẩm vào giỏ
func (s *ShoppingService) AddToCart(ctx context.Context, userID, productID int64, quantity int) error {
	// Có thể bổ sung logic kiểm tra sản phẩm tồn tại hoặc check stock ở đây nếu muốn
	return s.repo.AddToCart(ctx, userID, productID, quantity)
}

// Xóa sản phẩm khỏi giỏ
func (s *ShoppingService) RemoveCartItem(ctx context.Context, userID, productID int64) error {
	return s.repo.RemoveCartItem(ctx, userID, productID)
}

// Cập nhật số lượng cho 1 sản phẩm trong giỏ hàng
func (s *ShoppingService) SetCartItemQuantity(ctx context.Context, userID, productID int64, quantity int) error {
	return s.repo.SetCartItemQuantity(ctx, userID, productID, quantity)
}

// Thanh toán đơn hàng (Checkout)
func (s *ShoppingService) Checkout(ctx context.Context, userID int64) (*domain.Order, error) {
	// Gọi trực tiếp repository đang chứa Transaction trừ kho
	return s.repo.Checkout(ctx, userID)
}

// Lấy danh sách toàn bộ đơn hàng (Dành cho Admin)
func (s *ShoppingService) GetAllOrders(ctx context.Context) ([]domain.Order, error) {
	return s.repo.GetAllOrders(ctx)
}

// Lấy chi tiết đơn hàng theo ID (Dành cho Admin)
func (s *ShoppingService) GetOrderByID(ctx context.Context, orderID int64) (*domain.Order, error) {
	return s.repo.GetOrderByID(ctx, orderID)
}

// Lấy danh sách đơn hàng của riêng User
func (s *ShoppingService) GetUserOrders(ctx context.Context, userID int64) ([]domain.Order, error) {
	return s.repo.GetUserOrders(ctx, userID)
}

// Lấy chi tiết đơn hàng của riêng User theo ID
func (s *ShoppingService) GetUserOrderByID(ctx context.Context, orderID int64, userID int64) (*domain.Order, error) {
	return s.repo.GetUserOrderByID(ctx, orderID, userID)
}