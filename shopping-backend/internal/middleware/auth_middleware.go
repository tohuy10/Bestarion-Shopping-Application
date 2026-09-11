package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"shopping-backend/internal/service"
)

// AuthMiddleware intercepts incoming HTTP requests to verify the JWT Bearer Token.
// Protects routes from unauthenticated access and injects verified user_id into Gin Context.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Extract the "Authorization" HTTP Header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Request must include Authorization header"})
			c.Abort() // Stop middleware execution chain
			return
		}

		// 2. Clean header string and validate "Bearer <token>" format
		authHeader = strings.TrimSpace(authHeader)
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort() // Stop middleware execution chain
			return
		}

		tokenString := strings.TrimSpace(parts[1])

		// 3. Cryptographically verify token signature against secret key & check expiration
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return service.JwtSecret, nil
		})

		// 4. Abort request if token is forged, tampered with, or expired
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// 5. Extract user_id from token claims payload and store in Gin Context
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if userID, exists := claims["user_id"]; exists {
				c.Set("user_id", userID) // Makes user_id available to downstream handlers
			}
		}

		// 6. Token valid! Proceed to downstream handler function
		c.Next()
	}
}