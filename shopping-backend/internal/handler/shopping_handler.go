package handler

import (
	"net/http"
	"shopping-backend/internal/domain"
	"shopping-backend/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ShoppingHandler struct {
	service *service.ShoppingService
}

func NewShoppingHandler(s *service.ShoppingService) *ShoppingHandler {
	return &ShoppingHandler{service: s}
}

func getUserID(c *gin.Context) int64 {
	if val, exists := c.Get("user_id"); exists {
		switch v := val.(type) {
		case float64:
			return int64(v) // JWT claims mặc định parse ra float64
		case int64:
			return v
		case int:
			return int64(v)
		}
	}
	return 0 // Trả về 0 thay vì hardcode id = 1
}

func (h *ShoppingHandler) GetCart(c *gin.Context) {
	items, err := h.service.GetCart(c.Request.Context(), getUserID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ShoppingHandler) AddToCart(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tài khoản không hợp lệ hoặc chưa đăng nhập"})
		return
	}

	var req domain.AddToCartReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.AddToCart(c.Request.Context(), userID, req.ProductID, req.Quantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã thêm vào giỏ hàng thành công"})
}

func (h *ShoppingHandler) RemoveFromCart(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tài khoản không hợp lệ hoặc chưa đăng nhập"})
		return
	}

	pidParam := c.Param("product_id")
	if pidParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
		return
	}

	productID, err := strconv.ParseInt(pidParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id must be a number"})
		return
	}

	if err := h.service.RemoveCartItem(c.Request.Context(), userID, productID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa sản phẩm khỏi giỏ hàng"})
}

// Cập nhật số lượng sản phẩm trong giỏ hàng (body: { "quantity": <int> })
func (h *ShoppingHandler) UpdateCartItem(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tài khoản không hợp lệ hoặc chưa đăng nhập"})
		return
	}

	pidParam := c.Param("product_id")
	if pidParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
		return
	}

	productID, err := strconv.ParseInt(pidParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id must be a number"})
		return
	}

	var body struct {
		Quantity int `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if err := h.service.SetCartItemQuantity(c.Request.Context(), userID, productID, body.Quantity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật số lượng giỏ hàng thành công"})
}

func (h *ShoppingHandler) Checkout(c *gin.Context) {
	order, err := h.service.Checkout(c.Request.Context(), getUserID(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Thanh toán đơn hàng thành công",
		"order":   order,
	})
}

// Admin: Lấy danh sách tất cả các đơn hàng
func (h *ShoppingHandler) GetAllOrders(c *gin.Context) {
	orders, err := h.service.GetAllOrders(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// Admin: Xem chi tiết 1 đơn hàng
func (h *ShoppingHandler) GetOrderByID(c *gin.Context) {
	idParam := c.Param("id")
	orderID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID đơn hàng không hợp lệ"})
		return
	}

	order, err := h.service.GetOrderByID(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// User: Lấy danh sách các đơn hàng của chính mình
func (h *ShoppingHandler) GetMyOrders(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tài khoản không hợp lệ hoặc chưa đăng nhập"})
		return
	}

	orders, err := h.service.GetUserOrders(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// User: Xem chi tiết 1 đơn hàng của chính mình
func (h *ShoppingHandler) GetMyOrderByID(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tài khoản không hợp lệ hoặc chưa đăng nhập"})
		return
	}

	idParam := c.Param("id")
	orderID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID đơn hàng không hợp lệ"})
		return
	}

	order, err := h.service.GetUserOrderByID(c.Request.Context(), orderID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}
