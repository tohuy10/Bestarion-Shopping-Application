package domain

import (
	"context"
	"errors"
	"time"
)

// 🟢 MỚI: Khai báo các biến lỗi chuẩn cho toàn hệ thống
var (
	ErrEmailAlreadyExists = errors.New("Email already exists")
	ErrUserNotFound       = errors.New("User not found")
	ErrInvalidCredentials = errors.New("Invalid email or password")
	ErrInvalidToken       = errors.New("Invalid or expired reset token")
	ErrInvalidCurrentPassword = errors.New("Current password is incorrect")
)

// User định nghĩa cấu trúc dữ liệu người dùng trong CSDL
type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Không serialize mật khẩu ra JSON
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"` // 'admin' hoặc 'customer'
	CreatedAt    time.Time `json:"created_at"`
}

// RegisterReq DTO nhận dữ liệu đăng ký từ Client
type RegisterReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

// LoginReq DTO nhận dữ liệu đăng nhập từ Client
type LoginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ForgotPasswordReq DTO Yêu cầu quên mật khẩu
type ForgotPasswordReq struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordReq DTO Đặt lại mật khẩu mới
type ResetPasswordReq struct {
	Email       string `json:"email" binding:"required,email"`
	Token       string `json:"token" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}
// 🟢 MỚI: DTO cập nhật Role
type UpdateRoleReq struct {
	Role string `json:"role" binding:"required,oneof=admin customer"`
}

// UpdateProfileReq DTO cập nhật họ tên người dùng
type UpdateProfileReq struct {
	FullName string `json:"full_name" binding:"required"`
}

// ChangePasswordReq DTO đổi mật khẩu khi đã đăng nhập
type ChangePasswordReq struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// AuthResponse DTO trả về Token và thông tin User sau khi Auth thành công
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UserRepository Interface giao tiếp với Database
type UserRepository interface {
	Create(ctx context.Context, u *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id int64) (*User, error)
	UpdatePassword(ctx context.Context, userID int64, newPasswordHash string) error
	UpdateFullName(ctx context.Context, userID int64, fullName string) error

	// 🟢 MỚI: Phương thức quản lý Admin
	GetAll(ctx context.Context) ([]User, error)
	UpdateRole(ctx context.Context, userID int64, role string) error
}