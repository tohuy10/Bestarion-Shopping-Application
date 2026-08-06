package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"shopping-backend/internal/handler"
	"shopping-backend/internal/middleware" // 🟢 1. Import Middleware xác thực JWT
	"shopping-backend/internal/repository/postgres"
	"shopping-backend/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func getEnvOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func main() {
	// 🟢 Load .env file (tries current directory, parent directory)
	envLoaded := false
	for _, envFile := range []string{".env", "../.env", "../../.env"} {
		if err := godotenv.Load(envFile); err == nil {
			envLoaded = true
			//log.Printf("✅ Loaded environment variables from %s\n", envFile)
			break
		}
	}

	if !envLoaded {
		log.Println("⚠️  WARNING: No .env file loaded! Please copy '.env.example' to '.env' and set your database credentials.")
	}

	// 1. Kết nối Database từ Environment Variables
	dbHost := getEnvOrDefault("DB_HOST", "localhost")
	dbPort := getEnvOrDefault("DB_PORT", "5432")
	dbUser := getEnvOrDefault("DB_USER", "postgres")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := getEnvOrDefault("DB_NAME", "go_react_post")
	dbSSLMode := getEnvOrDefault("DB_SSLMODE", "disable")

	if dbPassword == "" {
		log.Println("⚠️  WARNING: DB_PASSWORD is empty! If your PostgreSQL requires a password, set DB_PASSWORD in your .env file.")
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Cannot connect to DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Database not responding: %v", err)
	}
	log.Println("Connected to PostgreSQL successfully!")

	// 2. Khai báo Dependency Injection - Product Module
	productRepo := postgres.NewProductRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)

	// Khai báo Dependency Injection - User Module
	userRepo := postgres.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// Khai báo Dependency Injection - Shopping Module
	shoppingRepo := postgres.NewShoppingRepository(db)
	shoppingService := service.NewShoppingService(shoppingRepo)
	shoppingHandler := handler.NewShoppingHandler(shoppingService)
	// Khai báo Upload Handler
	uploadHandler := handler.NewUploadHandler()

	// 3. Khai báo Route & Cấu hình CORS Middleware
	r := gin.Default()

	// 🟢 Phục vụ static file cho các ảnh đã được tải lên server tại thư mục ./uploads
	r.Static("/uploads", "./uploads")

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 4. Các đường dẫn API
	v1 := r.Group("/api/v1")
	{
		// Upload route
		v1.POST("/upload", uploadHandler.UploadFile)
		// Auth Routes (Đăng ký / Đăng nhập)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)

			// 🟢 MỚI: Thêm 2 route cho tính năng Quên & Đặt lại mật khẩu
			auth.POST("/forgot-password", userHandler.ForgotPassword)
			auth.POST("/reset-password", userHandler.ResetPassword)
		}

		// Product Routes
		products := v1.Group("/products")
		{
			products.POST("", productHandler.Create)
			products.GET("", productHandler.GetAll)
			products.GET("/:id", productHandler.GetByID)
			products.PUT("/:id", productHandler.Update)
			products.DELETE("/:id", productHandler.Delete)
		}

		// 🟢 MỚI: Route lấy danh sách Categories cho Frontend
		v1.GET("/categories", productHandler.GetCategories)

		// 🟢 MỚI: Admin Management Routes (Fix lỗi 404 /api/v1/admin/users)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware()) // Yêu cầu JWT Token
		{
			admin.GET("/users", userHandler.GetAllUsers)
			admin.PATCH("/users/:id/role", userHandler.UpdateRole)

			// 🟢 MỚI: Quản lý Đơn hàng cho Admin
			admin.GET("/orders", shoppingHandler.GetAllOrders)     // Lấy danh sách đơn hàng
			admin.GET("/orders/:id", shoppingHandler.GetOrderByID) // Xem chi tiết đơn hàng
		}

		// 🟢 2. Các Route bắt buộc phải ĐĂNG NHẬP (Cần Bearer Token)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware()) // Bắt buộc client gửi Token hợp lệ
		{
			protected.GET("/me", userHandler.GetMe)
			protected.PATCH("/me", userHandler.UpdateMe)
			protected.PATCH("/me/password", userHandler.ChangePassword)
			protected.GET("/cart", shoppingHandler.GetCart)
			protected.POST("/cart/items", shoppingHandler.AddToCart)
			protected.DELETE("/cart/items/:product_id", shoppingHandler.RemoveFromCart)
			protected.PATCH("/cart/items/:product_id", shoppingHandler.UpdateCartItem)
			protected.POST("/checkout", shoppingHandler.Checkout)

			// 🟢 MỚI: Xem danh sách và chi tiết đơn hàng cá nhân của User
			protected.GET("/my/orders", shoppingHandler.GetMyOrders)
			protected.GET("/my/orders/:id", shoppingHandler.GetMyOrderByID)
		}
	}

	// 5. Run Server
	log.Println("Server running on port :8080")
	r.Run(":8080")
}
