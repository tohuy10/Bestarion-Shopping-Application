package unit_test

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestPasswordHashing(t *testing.T) {
	rawPassword := "SecurePassword123!"

	hash, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	// Test correct password
	err = bcrypt.CompareHashAndPassword(hash, []byte(rawPassword))
	if err != nil {
		t.Errorf("Password matching failed for correct password: %v", err)
	}

	// Test wrong password
	err = bcrypt.CompareHashAndPassword(hash, []byte("WrongPassword"))
	if err == nil {
		t.Errorf("Expected error for wrong password, but got success")
	}
}
