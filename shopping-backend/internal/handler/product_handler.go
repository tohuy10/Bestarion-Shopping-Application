package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"shopping-backend/internal/domain"
)

// ProductHandler handles incoming HTTP requests for Product operations.
// Uses Dependency Injection to delegate business logic to domain.ProductService.
type ProductHandler struct {
	service domain.ProductService
}

// NewProductHandler creates and returns a new ProductHandler instance.
func NewProductHandler(s domain.ProductService) *ProductHandler {
	return &ProductHandler{service: s}
}

// Create handles POST /api/v1/products (Creates a new product)
func (h *ProductHandler) Create(c *gin.Context) {
	var p domain.Product

	// 1. Read incoming HTTP JSON body and parse into Product struct
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. Delegate business logic & database insertion to Service layer
	if err := h.service.CreateProduct(c.Request.Context(), &p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Respond with HTTP 201 Created and newly created product JSON (with generated DB ID)
	c.JSON(http.StatusCreated, p)
}

// GetAll handles GET /api/v1/products (Reads URL query parameters: search, min_price, max_price, category, sort_by, order, page, limit)
func (h *ProductHandler) GetAll(c *gin.Context) {
	// Parse pagination parameters from URL with default fallbacks
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	minPrice, _ := strconv.ParseFloat(c.Query("min_price"), 64)
	maxPrice, _ := strconv.ParseFloat(c.Query("max_price"), 64)

	// Build query parameters struct
	query := domain.ProductQuery{
		Search:   c.Query("search"),
		Category: c.Query("category"),
		MinPrice: minPrice,
		MaxPrice: maxPrice,
		SortBy:   c.DefaultQuery("sort_by", "created_at"),
		Order:    c.DefaultQuery("order", "desc"),
		Page:     page,
		Limit:    limit,
	}

	// Delegate filtered catalog retrieval to Service layer
	result, err := h.service.GetProducts(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Respond with HTTP 200 OK and paginated product list
	c.JSON(http.StatusOK, result)
}

// GetByID handles GET /api/v1/products/:id (Fetch single product by ID)
func (h *ProductHandler) GetByID(c *gin.Context) {
	// Extract and parse integer ID from URL path parameter
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Fetch product from Service layer
	p, err := h.service.GetProductByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Return product JSON with HTTP 200 OK
	c.JSON(http.StatusOK, p)
}

// Update handles PUT /api/v1/products/:id (Updates an existing product)
func (h *ProductHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var p domain.Product
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedProduct, err := h.service.UpdateProduct(c.Request.Context(), id, &p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedProduct)
}

// Delete handles DELETE /api/v1/products/:id (Removes a product)
func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.service.DeleteProduct(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GetCategories handles GET /api/v1/categories (Fetch distinct category names for filter dropdowns)
func (h *ProductHandler) GetCategories(c *gin.Context) {
	categories, err := h.service.GetCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}