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

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) UploadFile(c *gin.Context) {
	// 1. Lấy file từ Form Data ("image" hoặc "file")
	file, err := c.FormFile("image")
	if err != nil {
		file, err = c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File not found in request"})
			return
		}
	}

	// 2. Validate định dạng file (chỉ cho phép định dạng ảnh)
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

	// 3. TẠO THƯ MỤC UPLOADS NẾU CHƯA TỒN TẠI
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create upload directory"})
		return
	}

	// 4. Tạo tên file độc nhất tránh trùng lặp
	cleanFileName := strings.ReplaceAll(filepath.Base(file.Filename), " ", "_")
	newFileName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), cleanFileName)
	dst := filepath.Join(uploadDir, newFileName)

	// 5. Lưu file vào server
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error saving file: %v", err)})
		return
	}

	// 6. Trả về đường dẫn HTTP static của file vừa tải lên
	fileURL := fmt.Sprintf("http://localhost:8080/uploads/%s", newFileName)
	c.JSON(http.StatusOK, gin.H{
		"url":      fileURL,
		"filename": newFileName,
	})
}
