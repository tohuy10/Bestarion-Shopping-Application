package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadHandler manages multipart file upload requests.
type UploadHandler struct{}

// NewUploadHandler creates a new UploadHandler instance.
func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadFile handles POST /api/v1/upload (Uploads product image files to server disk)
func (h *UploadHandler) UploadFile(c *gin.Context) {
	// 1. Read uploaded file from multipart form data ("image" or "file" form key)
	file, err := c.FormFile("image")
	if err != nil {
		file, err = c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File not found in request"})
			return
		}
	}

	// 2. Validate image file extension (prevents uploading non-image/malicious files)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File format not supported. Only .jpg, .jpeg, .png, .gif, .webp are allowed"})
		return
	}

	// 3. Ensure uploads directory exists on server disk
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create upload directory"})
		return
	}

	// 4. Generate unique timestamped filename to prevent overwriting existing files
	cleanFileName := strings.ReplaceAll(filepath.Base(file.Filename), " ", "_")
	newFileName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), cleanFileName)
	dst := filepath.Join(uploadDir, newFileName)

	// 5. Save uploaded file binary onto server disk at destination path
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error saving file: %v", err)})
		return
	}

	// 6. Return accessible static HTTP URL for frontend rendering
	fileURL := fmt.Sprintf("http://localhost:8080/uploads/%s", newFileName)
	c.JSON(http.StatusOK, gin.H{
		"url":      fileURL,
		"filename": newFileName,
	})
}
