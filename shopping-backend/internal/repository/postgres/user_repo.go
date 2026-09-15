package postgres

import (
	"context"
	"database/sql"
	"errors"
	"shopping-backend/internal/domain"
)

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) domain.UserRepository {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id BIGSERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		full_name VARCHAR(255) NOT NULL,
		role VARCHAR(50) NOT NULL DEFAULT 'customer',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	_, _ = db.Exec(query)
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *domain.User) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Tạo User
	query := `
		INSERT INTO users (email, password_hash, full_name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err = tx.QueryRowContext(ctx, query, u.Email, u.PasswordHash, u.FullName, u.Role).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		return err
	}

	// // 2. Tự động khởi tạo Giỏ hàng trống cho User
	// cartQuery := `INSERT INTO carts (user_id) VALUES ($1)`
	// if _, err := tx.ExecContext(ctx, cartQuery, u.ID); err != nil {
	// 	return err
	// }

	return tx.Commit()
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, password_hash, full_name, role, created_at FROM users WHERE email = $1`
	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("User not found with the given email")
		}
		return nil, err
	}
	return u, nil
}

func (r *userRepository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	query := `SELECT id, email, password_hash, full_name, role, created_at FROM users WHERE id = $1`
	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}

// 🟢 MỚI: Cập nhật mật khẩu trong DB
func (r *userRepository) UpdatePassword(ctx context.Context, userID int64, newPasswordHash string) error {
	query := `UPDATE users SET password_hash = $1 WHERE id = $2`
	res, err := r.db.ExecContext(ctx, query, newPasswordHash, userID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrUserNotFound
	}
	return nil
}

// Cập nhật tên hiển thị của người dùng
func (r *userRepository) UpdateFullName(ctx context.Context, userID int64, fullName string) error {
	query := `UPDATE users SET full_name = $1 WHERE id = $2`
	res, err := r.db.ExecContext(ctx, query, fullName, userID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrUserNotFound
	}
	return nil
}

// 🟢 MỚI: Lấy danh sách toàn bộ User
func (r *userRepository) GetAll(ctx context.Context) ([]domain.User, error) {
	query := `SELECT id, email, full_name, role, created_at FROM users ORDER BY id ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]domain.User, 0)
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// 🟢 MỚI: Cập nhật Role của User theo ID
func (r *userRepository) UpdateRole(ctx context.Context, userID int64, role string) error {
	query := `UPDATE users SET role = $1 WHERE id = $2`
	res, err := r.db.ExecContext(ctx, query, role, userID)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

func (r *userRepository) CountAdmins(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE role = 'admin'`
	var count int
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}