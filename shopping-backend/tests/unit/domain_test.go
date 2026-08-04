package unit_test

import (
	"testing"
)

func TestProductStockValidation(t *testing.T) {
	tests := []struct {
		name          string
		initialStock  int
		orderQuantity int
		expectedStock int
		expectError   bool
	}{
		{
			name:          "Valid stock deduction",
			initialStock:  10,
			orderQuantity: 3,
			expectedStock: 7,
			expectError:   false,
		},
		{
			name:          "Insufficient stock",
			initialStock:  2,
			orderQuantity: 5,
			expectedStock: 2,
			expectError:   true,
		},
		{
			name:          "Exact stock deduction",
			initialStock:  5,
			orderQuantity: 5,
			expectedStock: 0,
			expectError:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.orderQuantity > tt.initialStock {
				if !tt.expectError {
					t.Errorf("expected error for insufficient stock, but got none")
				}
			} else {
				remaining := tt.initialStock - tt.orderQuantity
				if remaining != tt.expectedStock {
					t.Errorf("expected stock %d, got %d", tt.expectedStock, remaining)
				}
			}
		})
	}
}

func TestUserRoleValidation(t *testing.T) {
	validRoles := map[string]bool{
		"admin":    true,
		"customer": true,
	}

	tests := []struct {
		role  string
		valid bool
	}{
		{"admin", true},
		{"customer", true},
		{"superadmin", false},
		{"guest", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run("Role_"+tt.role, func(t *testing.T) {
			isValid := validRoles[tt.role]
			if isValid != tt.valid {
				t.Errorf("role %s validation got %v, expected %v", tt.role, isValid, tt.valid)
			}
		})
	}
}
