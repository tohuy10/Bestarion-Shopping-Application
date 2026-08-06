package service

import (
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"shopping-backend/internal/domain"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var JwtSecret = []byte("your_super_secret_jwt_key_123") // Trong thực tế nên đọc từ env

type UserService interface {
	Register(ctx context.Context, req domain.RegisterReq) (*domain.AuthResponse, error)
	Login(ctx context.Context, req domain.LoginReq) (*domain.AuthResponse, error)
	ForgotPassword(ctx context.Context, req domain.ForgotPasswordReq) (string, error)
	ResetPassword(ctx context.Context, req domain.ResetPasswordReq) error
	GetProfile(ctx context.Context, userID int64) (*domain.User, error)
	UpdateProfile(ctx context.Context, userID int64, req domain.UpdateProfileReq) error
	ChangePassword(ctx context.Context, userID int64, req domain.ChangePasswordReq) error

	// 🟢 BỔ SUNG 2 PHƯƠNG THỨC MỚI VÀO INTERFACE
	GetAllUsers(ctx context.Context) ([]domain.User, error)
	UpdateUserRole(ctx context.Context, userID int64, role string) error
}

type userService struct {
	repo domain.UserRepository
}

func NewUserService(repo domain.UserRepository) UserService {
	return &userService{repo: repo}
}

func generateJWT(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":   user.ID,
		"email":     user.Email,
		"full_name": user.FullName,
		"role":      user.Role,
		"exp":       time.Now().Add(time.Hour * 24).Unix(), // Token có hạn 24 tiếng
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtSecret)
}

// 🟢 Hàm sinh mã OTP 6 chữ số ngẫu nhiên
func generateOTP6Digits() string {
	var table = [...]byte{'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'}
	b := make([]byte, 6)
	n, err := io.ReadAtLeast(rand.Reader, b, 6)
	if err != nil || n != 6 {
		return "123456" // Fallback
	}
	for i := 0; i < len(b); i++ {
		b[i] = table[int(b[i])%len(table)]
	}
	return string(b)
}

// 🟢 Mã hóa OTP 6 số thành JWT lưu thời hạn 15 phút
func generateOTPToken(email, otp string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"code":  otp,
		"scope": "reset_password",
		"exp":   time.Now().Add(time.Minute * 15).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtSecret)
}

func (s *userService) Register(ctx context.Context, req domain.RegisterReq) (*domain.AuthResponse, error) {
	existing, _ := s.repo.GetByEmail(ctx, req.Email)
	if existing != nil {
		// 🟢 SỬA: Trả về ErrEmailAlreadyExists của domain
		return nil, domain.ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := "customer"
	if req.Email == "admin@gmail.com" {
		role = "admin"
	}

	user := &domain.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FullName:     req.FullName,
		Role:         role,
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := generateJWT(user)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{Token: token, User: *user}, nil
}

func (s *userService) Login(ctx context.Context, req domain.LoginReq) (*domain.AuthResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		// 🟢 SỬA: Trả về ErrInvalidCredentials của domain
		return nil, domain.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		// 🟢 SỬA: Trả về ErrInvalidCredentials của domain khi sai pass
		return nil, domain.ErrInvalidCredentials
	}

	token, err := generateJWT(user)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{Token: token, User: *user}, nil
}

func (s *userService) ForgotPassword(ctx context.Context, req domain.ForgotPasswordReq) (string, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		// 🟢 SỬA: Trả về ErrUserNotFound của domain
		return "", domain.ErrUserNotFound
	}

	otpCode := generateOTP6Digits()

	signedToken, err := generateOTPToken(user.Email, otpCode)
	if err != nil {
		return "", err
	}

	fmt.Printf("[FORGOT PASSWORD] 6 digits code for %s: %s | Signed Token: %s\n", user.Email, otpCode, signedToken)

	return otpCode, nil
}

func (s *userService) ResetPassword(ctx context.Context, req domain.ResetPasswordReq) error {
	if len(req.Token) != 6 {
		// 🟢 SỬA: Trả về ErrInvalidToken của domain
		return domain.ErrInvalidToken
	}

	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		// 🟢 SỬA: Trả về ErrUserNotFound của domain
		return domain.ErrUserNotFound
	}

	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdatePassword(ctx, user.ID, string(newHashedPassword))
}

func (s *userService) GetProfile(ctx context.Context, userID int64) (*domain.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID int64, req domain.UpdateProfileReq) error {
	return s.repo.UpdateFullName(ctx, userID, req.FullName)
}

func (s *userService) ChangePassword(ctx context.Context, userID int64, req domain.ChangePasswordReq) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		return domain.ErrInvalidCurrentPassword
	}

	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdatePassword(ctx, userID, string(newHashedPassword))
}

// 🟢 MỚI: Service Lấy danh sách User
func (s *userService) GetAllUsers(ctx context.Context) ([]domain.User, error) {
	return s.repo.GetAll(ctx)
}

// 🟢 MỚI: Service Cập nhật Role
func (s *userService) UpdateUserRole(ctx context.Context, userID int64, role string) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// Nếu tài khoản hiện tại là Admin và được đổi sang role khác Admin
	if user.Role == "admin" && role != "admin" {
		adminCount, err := s.repo.CountAdmins(ctx)
		if err != nil {
			return err
		}
		if adminCount <= 1 {
			return domain.ErrLastAdminDemotion
		}
	}

	return s.repo.UpdateRole(ctx, userID, role)
}

// package service

// import (
// 	"context"
// 	"crypto/rand"
// 	"errors"
// 	"fmt"
// 	"github.com/golang-jwt/jwt/v5"
// 	"golang.org/x/crypto/bcrypt"
// 	"io"
// 	"shopping-backend/internal/domain"
// 	"time"
// )

// var JwtSecret = []byte("your_super_secret_jwt_key_123") // Trong thực tế nên đọc từ env

// type UserService interface {
// 	Register(ctx context.Context, req domain.RegisterReq) (*domain.AuthResponse, error)
// 	Login(ctx context.Context, req domain.LoginReq) (*domain.AuthResponse, error)
// 	// 🟢 MỚI: Thêm 2 hàm xử lý Quên/Reset pass
// 	ForgotPassword(ctx context.Context, req domain.ForgotPasswordReq) (string, error)
// 	ResetPassword(ctx context.Context, req domain.ResetPasswordReq) error
// }

// type userService struct {
// 	repo domain.UserRepository
// }

// func NewUserService(repo domain.UserRepository) UserService {
// 	return &userService{repo: repo}
// }

// func generateJWT(user *domain.User) (string, error) {
// 	claims := jwt.MapClaims{
// 		"user_id":   user.ID,
// 		"email":     user.Email,
// 		"full_name": user.FullName,
// 		"role":      user.Role,
// 		"exp":       time.Now().Add(time.Hour * 24).Unix(), // Token có hạn 24 tiếng
// 	}

// 	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
// 	return token.SignedString(JwtSecret)
// }

// // 🟢 MỚI: Tạo Reset Token có thời hạn ngắn (15 phút)
// func generateResetToken(email string) (string, error) {
// 	claims := jwt.MapClaims{
// 		"email": email,
// 		"scope": "reset_password",
// 		"exp":   time.Now().Add(time.Minute * 15).Unix(),
// 	}
// 	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
// 	return token.SignedString(JwtSecret)
// }

// func (s *userService) Register(ctx context.Context, req domain.RegisterReq) (*domain.AuthResponse, error) {
// 	// Kiểm tra xem email đã đăng ký chưa
// 	existing, _ := s.repo.GetByEmail(ctx, req.Email)
// 	if existing != nil {
// 		return nil, errors.New("email này đã được sử dụng")
// 	}

// 	// Mã hóa mật khẩu
// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
// 	if err != nil {
// 		return nil, err
// 	}

// 	// Mặc định tạo tài khoản thường ('customer'). Muốn làm Admin có thể gán thủ công hoặc cấu hình riêng.
// 	role := "customer"
// 	if req.Email == "admin@gmail.com" { // Ví dụ: Email này mặc định là Admin
// 		role = "admin"
// 	}

// 	user := &domain.User{
// 		Email:        req.Email,
// 		PasswordHash: string(hashedPassword),
// 		FullName:     req.FullName,
// 		Role:         role,
// 	}

// 	if err := s.repo.Create(ctx, user); err != nil {
// 		return nil, err
// 	}

// 	token, err := generateJWT(user)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &domain.AuthResponse{Token: token, User: *user}, nil
// }

// func (s *userService) Login(ctx context.Context, req domain.LoginReq) (*domain.AuthResponse, error) {
// 	user, err := s.repo.GetByEmail(ctx, req.Email)
// 	if err != nil {
// 		return nil, errors.New("email hoặc mật khẩu không chính xác")
// 	}

// 	// Verify mật khẩu
// 	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
// 		return nil, errors.New("email hoặc mật khẩu không chính xác")
// 	}

// 	token, err := generateJWT(user)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return &domain.AuthResponse{Token: token, User: *user}, nil
// }

// // 🟢 Hàm sinh mã OTP 6 chữ số ngẫu nhiên
// func generateOTP6Digits() string {
// 	var table = [...]byte{'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'}
// 	b := make([]byte, 6)
// 	n, err := io.ReadAtLeast(rand.Reader, b, 6)
// 	if err != nil || n != 6 {
// 		return "123456" // Fallback
// 	}
// 	for i := 0; i < len(b); i++ {
// 		b[i] = table[int(b[i])%len(table)]
// 	}
// 	return string(b)
// }

// // 🟢 MỚI: Xử lý Quên mật khẩu
// func (s *userService) ForgotPassword(ctx context.Context, req domain.ForgotPasswordReq) (string, error) {
// 	user, err := s.repo.GetByEmail(ctx, req.Email)
// 	if err != nil {
// 		return "", errors.New("không tìm thấy tài khoản với email này")
// 	}

// 	resetToken, err := generateResetToken(user.Email)
// 	if err != nil {
// 		return "", err
// 	}

// 	// Trong thực tế, bạn sẽ gửi `resetToken` này qua Email.
// 	// Ở đây ta trả về token/in ra log để test trực tiếp với Frontend.
// 	fmt.Printf("[FORGOT PASSWORD] Reset Token cho %s: %s\n", user.Email, resetToken)

// 	return resetToken, nil
// }

// // 🟢 MỚI: Xử lý Đặt lại mật khẩu
// func (s *userService) ResetPassword(ctx context.Context, req domain.ResetPasswordReq) error {
// 	// Parse và verify Reset Token
// 	token, err := jwt.Parse(req.Token, func(t *jwt.Token) (interface{}, error) {
// 		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
// 			return nil, errors.New("phương thức ký không hợp lệ")
// 		}
// 		return JwtSecret, nil
// 	})

// 	if err != nil || !token.Valid {
// 		return errors.New("mã xác nhận không hợp lệ hoặc đã hết hạn")
// 	}

// 	claims, ok := token.Claims.(jwt.MapClaims)
// 	if !ok || claims["scope"] != "reset_password" || claims["email"] != req.Email {
// 		return errors.New("mã xác nhận không hợp lệ")
// 	}

// 	// Lấy thông tin user
// 	user, err := s.repo.GetByEmail(ctx, req.Email)
// 	if err != nil {
// 		return errors.New("người dùng không tồn tại")
// 	}

// 	// Hash mật khẩu mới
// 	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
// 	if err != nil {
// 		return err
// 	}

// 	// Cập nhật DB
// 	return s.repo.UpdatePassword(ctx, user.ID, string(newHashedPassword))
// }
