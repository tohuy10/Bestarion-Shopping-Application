package handler

import (
	"errors"
	"net/http"
	"shopping-backend/internal/domain"
	"shopping-backend/internal/service"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	service service.UserService
}

func NewUserHandler(s service.UserService) *UserHandler {
	return &UserHandler{service: s}
}

func getCurrentUserID(c *gin.Context) int64 {
	if val, exists := c.Get("user_id"); exists {
		switch v := val.(type) {
		case float64:
			return int64(v)
		case int64:
			return v
		case int:
			return int64(v)
		}
	}
	return 0
}

// Hàm bổ trợ: Format lỗi Validate từ ShouldBindJSON thành Map chi tiết
func formatValidationError(err error) map[string]string {
	errs := make(map[string]string)
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		for _, fe := range ve {
			switch fe.Tag() {
			case "required":
				errs[fe.Field()] = "This field is required"
			case "email":
				errs[fe.Field()] = "Invalid email format"
			case "min":
				errs[fe.Field()] = "Password must be at least " + fe.Param() + " characters long"
			case "len":
				errs[fe.Field()] = "Must be exactly " + fe.Param() + " characters long"
			default:
				errs[fe.Field()] = "Invalid value"
			}
		}
		return errs
	}
	return map[string]string{"error": "Invalid JSON payload structure"}
}

func (h *UserHandler) Register(c *gin.Context) {
	var req domain.RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		// 🟢 Trả về chi tiết các trường bị lỗi validate
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid JSON payload",
			"details": formatValidationError(err),
		})
		return
	}

	res, err := h.service.Register(c.Request.Context(), req)
	if err != nil {
		// 🟢 Phân loại lỗi nghiệp vụ cụ thể
		if errors.Is(err, domain.ErrEmailAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "System error, please try again later"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *UserHandler) Login(c *gin.Context) {
	var req domain.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid JSON payload",
			"details": formatValidationError(err),
		})
		return
	}

	res, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		// 🟢 Bắt lỗi đăng nhập sai (User không tồn tại hoặc Mật khẩu sai)
		if errors.Is(err, domain.ErrInvalidCredentials) || errors.Is(err, domain.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "System error, please try again later"})
		return
	}

	c.JSON(http.StatusOK, res)
}

// 🟢 Handler Quên Mật Khẩu
func (h *UserHandler) ForgotPassword(c *gin.Context) {
	var req domain.ForgotPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid email format",
			"details": formatValidationError(err),
		})
		return
	}

	resetToken, err := h.service.ForgotPassword(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Email not found in the system"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "System error, please try again later"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Request successful. Please check your email/token.",
		"reset_token": resetToken,
	})
}

// 🟢 Handler Đặt Lại Mật Khẩu
func (h *UserHandler) ResetPassword(c *gin.Context) {
	var req domain.ResetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid JSON payload",
			"details": formatValidationError(err),
		})
		return
	}

	err := h.service.ResetPassword(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidToken) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "System error, please try again later"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successful"})
}

// 🟢 MỚI: Handler lấy toàn bộ danh sách User cho Admin
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user list"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// 🟢 MỚI: Handler cập nhật Role cho User
func (h *UserHandler) UpdateRole(c *gin.Context) {
	idParam := c.Param("id")
	userID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req domain.UpdateRoleReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid data",
			"details": formatValidationError(err),
		})
		return
	}

	if err := h.service.UpdateUserRole(c.Request.Context(), userID, req.Role); err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Update role successful"})
}

func (h *UserHandler) GetMe(c *gin.Context) {
	userID := getCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid account or not logged in"})
		return
	}

	user, err := h.service.GetProfile(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user information"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID := getCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid account or not logged in"})
		return
	}

	var req domain.UpdateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid data",
			"details": formatValidationError(err),
		})
		return
	}

	if err := h.service.UpdateProfile(c.Request.Context(), userID, req); err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	updatedUser, err := h.service.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Update profile successful"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Update profile successful", "user": updatedUser})
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := getCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid account or not logged in"})
		return
	}

	var req domain.ChangePasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid data",
			"details": formatValidationError(err),
		})
		return
	}

	if err := h.service.ChangePassword(c.Request.Context(), userID, req); err != nil {
		if errors.Is(err, domain.ErrInvalidCurrentPassword) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
			return
		}
		if errors.Is(err, domain.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
