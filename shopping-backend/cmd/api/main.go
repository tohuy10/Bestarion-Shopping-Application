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

// getEnvOrDefault reads an environment variable or returns a fallback default value
func getEnvOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func main() {
	// ==========================================
	// 1. ENVIRONMENT CONFIGURATION & DB CONNECT
	// ==========================================
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

	// Read database configuration from Environment Variables
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

	// Open connection to PostgreSQL pool
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Cannot connect to DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Database not responding: %v", err)
	}
	log.Println("Connected to PostgreSQL successfully!")

	// ==========================================
	// 2. DEPENDENCY INJECTION SETUP
	// Repository -> Service -> Handler Wiring
	// ==========================================

	// Product Module Wiring
	productRepo := postgres.NewProductRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)

	// User Module Wiring
	userRepo := postgres.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// Shopping Module Wiring (Cart & Orders)
	shoppingRepo := postgres.NewShoppingRepository(db)
	shoppingService := service.NewShoppingService(shoppingRepo)
	shoppingHandler := handler.NewShoppingHandler(shoppingService)

	// Upload Handler Wiring
	uploadHandler := handler.NewUploadHandler()

	// ==========================================
	// 3. GIN ROUTER & MIDDLEWARE CONFIGURATION
	// ==========================================
	r := gin.Default() // Initializes router with default Logger and Recovery middlewares

	// Serve static files for uploaded product images at ./uploads
	r.Static("/uploads", "./uploads")

	// Configure Cross-Origin Resource Sharing (CORS) for React frontend (:5173 / :3000)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ==========================================
	// 4. API ROUTE DEFINITIONS & GROUPING
	// ==========================================
	v1 := r.Group("/api/v1")
	{
		// File upload endpoint
		v1.POST("/upload", uploadHandler.UploadFile)

		// Public Authentication Routes (Register, Login, Password Reset)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
			auth.POST("/forgot-password", userHandler.ForgotPassword)
			auth.POST("/reset-password", userHandler.ResetPassword)
		}

		// Product Catalog Routes
		products := v1.Group("/products")
		{
			products.POST("", productHandler.Create)
			products.GET("", productHandler.GetAll)
			products.GET("/:id", productHandler.GetByID)
			products.PUT("/:id", productHandler.Update)
			products.DELETE("/:id", productHandler.Delete)
		}

		// Fetch Category Filter List
		v1.GET("/categories", productHandler.GetCategories)

		// Admin Management Routes (Protected by AuthMiddleware)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware()) // Requires valid JWT Bearer Token
		{
			admin.GET("/users", userHandler.GetAllUsers)
			admin.PATCH("/users/:id/role", userHandler.UpdateRole)

			// Admin Order Management
			admin.GET("/orders", shoppingHandler.GetAllOrders)     // List all system orders
			admin.GET("/orders/:id", shoppingHandler.GetOrderByID) // View specific order detail
		}

		// Authenticated User Routes (Protected by AuthMiddleware)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware()) // Requires valid JWT Bearer Token
		{
			protected.GET("/me", userHandler.GetMe)
			protected.PATCH("/me", userHandler.UpdateMe)
			protected.PATCH("/me/password", userHandler.ChangePassword)

			// Shopping Cart Routes
			protected.GET("/cart", shoppingHandler.GetCart)
			protected.POST("/cart/items", shoppingHandler.AddToCart)
			protected.DELETE("/cart/items/:product_id", shoppingHandler.RemoveFromCart)
			protected.PATCH("/cart/items/:product_id", shoppingHandler.UpdateCartItem)
			protected.POST("/checkout", shoppingHandler.Checkout)

			// Personal Order History
			protected.GET("/my/orders", shoppingHandler.GetMyOrders)
			protected.GET("/my/orders/:id", shoppingHandler.GetMyOrderByID)
		}
	}

	// ==========================================
	// 5. START HTTP SERVER
	// ==========================================
	log.Println("Server running on port :8080")
	r.Run(":8080")
}
