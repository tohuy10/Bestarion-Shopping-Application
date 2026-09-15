package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"shopping-backend/internal/domain"
)

type ShoppingRepository struct {
	db *sql.DB
}

func NewShoppingRepository(db *sql.DB) *ShoppingRepository {
	cartQuery := `
	CREATE TABLE IF NOT EXISTS cart_items (
		id BIGSERIAL PRIMARY KEY,
		user_id BIGINT NOT NULL,
		product_id BIGINT NOT NULL,
		quantity INT NOT NULL DEFAULT 1,
		UNIQUE(user_id, product_id)
	);`
	ordersQuery := `
	CREATE TABLE IF NOT EXISTS orders (
		id BIGSERIAL PRIMARY KEY,
		user_id BIGINT NOT NULL,
		total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
		status VARCHAR(50) NOT NULL DEFAULT 'PAID',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`
	orderItemsQuery := `
	CREATE TABLE IF NOT EXISTS order_items (
		id BIGSERIAL PRIMARY KEY,
		order_id BIGINT NOT NULL,
		product_id BIGINT NOT NULL,
		quantity INT NOT NULL,
		price NUMERIC(12, 2) NOT NULL
	);`
	_, _ = db.Exec(cartQuery)
	_, _ = db.Exec(ordersQuery)
	_, _ = db.Exec(orderItemsQuery)
	return &ShoppingRepository{db: db}
}

// ------------------- CART METHODS -------------------

// Lấy danh sách item trong giỏ hàng của user
func (r *ShoppingRepository) GetCartItems(ctx context.Context, userID int64) ([]domain.CartItem, error) {
	query := `
		SELECT ci.id, ci.user_id, ci.product_id, p.name, p.price, ci.quantity
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.user_id = $1
		ORDER BY ci.id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []domain.CartItem{}
	for rows.Next() {
		var item domain.CartItem
		if err := rows.Scan(&item.ID, &item.UserID, &item.ProductID, &item.ProductName, &item.Price, &item.Quantity); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

// Thêm sản phẩm vào giỏ (Nó sẽ tự động cộng dồn nếu sản phẩm đã có trong giỏ)
func (r *ShoppingRepository) AddToCart(ctx context.Context, userID, productID int64, quantity int) error {
	query := `
		INSERT INTO cart_items (user_id, product_id, quantity)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, product_id)
		DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
	`
	_, err := r.db.ExecContext(ctx, query, userID, productID, quantity)
	return err
}

// Xóa 1 sản phẩm khỏi giỏ hàng
func (r *ShoppingRepository) RemoveCartItem(ctx context.Context, userID, productID int64) error {
	query := `DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`
	_, err := r.db.ExecContext(ctx, query, userID, productID)
	return err
}

// Thiết lập số lượng cho một mục trong giỏ hàng (nếu quantity <= 0 thì xóa mục)
func (r *ShoppingRepository) SetCartItemQuantity(ctx context.Context, userID, productID int64, quantity int) error {
	if quantity <= 0 {
		return r.RemoveCartItem(ctx, userID, productID)
	}

	// Cập nhật nếu tồn tại, nếu không thì chèn mới
	query := `
		INSERT INTO cart_items (user_id, product_id, quantity)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, product_id)
		DO UPDATE SET quantity = EXCLUDED.quantity
	`
	_, err := r.db.ExecContext(ctx, query, userID, productID, quantity)
	return err
}

// ------------------- CHECKOUT TRANSACTION -------------------

func (r *ShoppingRepository) Checkout(ctx context.Context, userID int64) (*domain.Order, error) {
	// 1. Mở Transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback() // Tự động Rollback nếu xảy ra lỗi giữa chừng

	// 2. Lấy danh sách sản phẩm trong giỏ và KHÓA dòng sản phẩm để kiểm tra tồn kho (FOR UPDATE)
	queryItems := `
		SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.user_id = $1
		FOR UPDATE OF p
	`
	rows, err := tx.QueryContext(ctx, queryItems, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type cartRow struct {
		productID int64
		quantity  int
		price     float64
		stock     int
		name      string
	}

	var items []cartRow
	var totalAmount float64

	for rows.Next() {
		var item cartRow
		if err := rows.Scan(&item.productID, &item.quantity, &item.price, &item.stock, &item.name); err != nil {
			return nil, err
		}

		// ⚠️ KIỂM TRA TỒN KHO: Nếu không đủ stock -> Rollback toàn bộ
		if item.stock < item.quantity {
			return nil, fmt.Errorf("Product '%s' does not have enough stock", item.name)
		}

		totalAmount += item.price * float64(item.quantity)
		items = append(items, item)
	}

	if len(items) == 0 {
		return nil, errors.New("Your cart is empty")
	}

	// 3. Tạo Đơn Hàng mới (orders)
	var orderID int64
	createOrderQuery := `
		INSERT INTO orders (user_id, total_amount, status)
		VALUES ($1, $2, 'PAID')
		RETURNING id
	`
	err = tx.QueryRowContext(ctx, createOrderQuery, userID, totalAmount).Scan(&orderID)
	if err != nil {
		return nil, err
	}

	// 4. Chèn từng mục vào Chi tiết Đơn hàng (order_items) & TRỪ TỒN KHO (products.stock)
	insertOrderItemQuery := `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`
	updateStockQuery := `UPDATE products SET stock = stock - $1 WHERE id = $2`

	for _, item := range items {
		// Chèn order_item
		_, err := tx.ExecContext(ctx, insertOrderItemQuery, orderID, item.productID, item.quantity, item.price)
		if err != nil {
			return nil, err
		}

		// Trừ số lượng tồn kho
		_, err = tx.ExecContext(ctx, updateStockQuery, item.quantity, item.productID)
		if err != nil {
			return nil, err
		}
	}

	// 5. Xóa toàn bộ sản phẩm trong giỏ hàng (cart_items) của user này
	clearCartQuery := `DELETE FROM cart_items WHERE user_id = $1`
	if _, err := tx.ExecContext(ctx, clearCartQuery, userID); err != nil {
		return nil, err
	}

	// 6. Commit Transaction (Lưu vĩnh viễn vào Postgres)
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &domain.Order{
		ID:          orderID,
		UserID:      userID,
		TotalAmount: totalAmount,
		Status:      "PAID",
	}, nil
}

// ------------------- ADMIN ORDER MANAGEMENT -------------------

// Lấy danh sách tất cả các đơn hàng hệ thống
func (r *ShoppingRepository) GetAllOrders(ctx context.Context) ([]domain.Order, error) {
	query := `
		SELECT id, user_id, total_amount, status, created_at
		FROM orders
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []domain.Order{}
	for rows.Next() {
		var o domain.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.TotalAmount, &o.Status, &o.CreatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

// Lấy chi tiết 1 đơn hàng kèm danh sách sản phẩm
func (r *ShoppingRepository) GetOrderByID(ctx context.Context, orderID int64) (*domain.Order, error) {
    // 1. Lấy thông tin order cơ bản
    orderQuery := `
        SELECT id, user_id, total_amount, status, created_at
        FROM orders
        WHERE id = $1
    `
    var order domain.Order
    err := r.db.QueryRowContext(ctx, orderQuery, orderID).Scan(
        &order.ID, &order.UserID, &order.TotalAmount, &order.Status, &order.CreatedAt,
    )
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, errors.New("Cannot find order with the given ID")
        }
        return nil, err
    }

    // 🟢 2. CẬP NHẬT: Thêm LEFT JOIN p.name và bổ sung COALESCE phòng trường hợp sp đã bị xóa
    itemsQuery := `
        SELECT 
            oi.id, 
            oi.order_id, 
            oi.product_id, 
            COALESCE(p.name, 'Product not found') AS product_name, 
            oi.quantity, 
            oi.price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
    `
    rows, err := r.db.QueryContext(ctx, itemsQuery, orderID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var items []domain.OrderItem
    for rows.Next() {
        var item domain.OrderItem
        // 🟢 CẬP NHẬT: Thêm &item.ProductName vào đúng vị trí thứ 4 tương ứng với SQL
        if err := rows.Scan(
            &item.ID, 
            &item.OrderID, 
            &item.ProductID, 
            &item.ProductName, // 👈 Thêm biến này ở đây
            &item.Quantity, 
            &item.Price,
        ); err != nil {
            return nil, err
        }
        items = append(items, item)
    }

    order.Items = items
    return &order, nil
}

// ------------------- USER ORDER METHODS -------------------

// Lấy danh sách đơn hàng của 1 user cụ thể
func (r *ShoppingRepository) GetUserOrders(ctx context.Context, userID int64) ([]domain.Order, error) {
	query := `
		SELECT id, user_id, total_amount, status, created_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []domain.Order{}
	for rows.Next() {
		var o domain.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.TotalAmount, &o.Status, &o.CreatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

// Lấy chi tiết 1 đơn hàng thuộc về 1 user cụ thể
func (r *ShoppingRepository) GetUserOrderByID(ctx context.Context, orderID int64, userID int64) (*domain.Order, error) {
	orderQuery := `
		SELECT id, user_id, total_amount, status, created_at
		FROM orders
		WHERE id = $1 AND user_id = $2
	`
	var order domain.Order
	err := r.db.QueryRowContext(ctx, orderQuery, orderID, userID).Scan(
		&order.ID, &order.UserID, &order.TotalAmount, &order.Status, &order.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("Cannot find order with the given ID for this user")
		}
		return nil, err
	}

	itemsQuery := `
		SELECT 
			oi.id, 
			oi.order_id, 
			oi.product_id, 
			COALESCE(p.name, 'Product not found') AS product_name, 
			oi.quantity, 
			oi.price
		FROM order_items oi
		LEFT JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = $1
	`
	rows, err := r.db.QueryContext(ctx, itemsQuery, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.OrderItem
	for rows.Next() {
		var item domain.OrderItem
		if err := rows.Scan(
			&item.ID, 
			&item.OrderID, 
			&item.ProductID, 
			&item.ProductName, 
			&item.Quantity, 
			&item.Price,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	order.Items = items
	return &order, nil
}