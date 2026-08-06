import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, ShoppingBag, Package, Search, Filter, ChevronLeft, ChevronRight, RotateCcw, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL, getAuthHeaders } from '../../config';
import ProductCatalog from './ProductCatalog';
import ShoppingCartComponent from './ShoppingCart';
import MyOrdersList from './MyOrdersList';
import MyOrderDetailModal from './MyOrderDetailModal';

export default function CustomerStorefront() {
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'my_orders'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState({ loading: false });

  // 🔴 1. Bổ sung State Danh mục (Categories)
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Search, Filter & Pagination states
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(6); // Products per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Order history states
  const [myOrders, setMyOrders] = useState([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [selectedMyOrder, setSelectedMyOrder] = useState(null);
  const [loadingMyOrderDetail, setLoadingMyOrderDetail] = useState(false);
  const [isMyOrderModalOpen, setIsMyOrderModalOpen] = useState(false);

  // 🔴 2. Lấy danh sách Categories từ API
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setCategories(data.data);
        } else if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  // 🔴 3. Cập nhật fetchProducts gửi thêm param 'category'
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) queryParams.append('search', search.trim());
      if (selectedCategory) queryParams.append('category', selectedCategory); // 👈 Thêm category filter
      if (minPrice) queryParams.append('min_price', minPrice);
      if (maxPrice) queryParams.append('max_price', maxPrice);

      const res = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedCategory, minPrice, maxPrice]);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const sortedItems = (data || []).sort((a, b) => (a.id || 0) - (b.id || 0));
        setCart(sortedItems);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const fetchMyOrders = useCallback(async () => {
    setLoadingMyOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/my/orders`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data || []);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoadingMyOrders(false);
    }
  }, []);

  const fetchMyOrderDetail = async (orderId) => {
    setIsMyOrderModalOpen(true);
    setLoadingMyOrderDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/my/orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedMyOrder(data);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Cannot view order receipt');
        setIsMyOrderModalOpen(false);
      }
    } catch (err) {
      toast.error('Connection error while fetching receipt');
      setIsMyOrderModalOpen(false);
    } finally {
      setLoadingMyOrderDetail(false);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchMyOrders();
    fetchCategories(); // 👈 Gọi API lấy danh mục khi trang vừa load
  }, [fetchMyOrders]);

  useEffect(() => {
    if (activeTab === 'shop') {
      fetchProducts();
    } else if (activeTab === 'my_orders') {
      fetchMyOrders();
    }
  }, [activeTab, fetchProducts, fetchMyOrders]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset về trang 1 khi lọc
    fetchProducts();
  };

  // 🔴 4. Cập nhật Reset bộ lọc bao gồm cả Category
  const handleResetFilter = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  const handleAddToCart = async (product) => {
    if (product.stock <= 0) return;

    setAddingId(product.id);
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        })
      });

      if (res.ok) {
        toast.success(`🛒 Added "${product.name}" to cart!`);
        await fetchCart();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to add product to cart');
      }
    } catch (err) {
      toast.error('Connection error while adding item to cart');
    } finally {
      setAddingId(null);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setCheckoutStatus({ loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Checkout failed');
        return;
      }

      const orderId = data.order?.id || data.id;
      toast.success(`🎉 Checkout successful! Order #${orderId}`);
      await fetchCart();
      await fetchProducts();
      await fetchMyOrders();
    } catch (err) {
      toast.error('Connection error during checkout');
    } finally {
      setCheckoutStatus({ loading: false });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      {/* Header card */}
      <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Store</h1>
          <p className="text-xs text-slate-400">Choose your favorite products or view your past orders</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap max-w-full">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs flex-wrap max-w-full">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${activeTab === 'shop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <ShoppingBag className="w-4 h-4" /> Shop Catalog
            </button>
            <button
              onClick={() => setActiveTab('my_orders')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${activeTab === 'my_orders' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Package className="w-4 h-4" /> My Orders ({myOrders.length})
            </button>
          </div>

          <div className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/30">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold text-sm">{cart.reduce((sum, i) => sum + i.quantity, 0)} items</span>
          </div>
        </div>
      </div>

      {activeTab === 'shop' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <form onSubmit={handleFilterSubmit} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 🔴 5. Dropdown chọn Category */}
            <div className="relative w-full sm:w-44">
              <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1); // Auto reload trang 1 khi đổi danh mục
                }}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {Array.isArray(categories) && categories.map((cat, idx) => {
                  const catVal = typeof cat === 'string' ? cat : cat.id || cat.name;
                  const catName = typeof cat === 'string' ? cat : cat.name;
                  return (
                    <option key={idx} value={catVal} className="bg-slate-800 text-white">
                      {catName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Min Price */}
            <div className="w-24 sm:w-28">
              <input
                type="number"
                placeholder="Min $"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Max Price */}
            <div className="w-24 sm:w-28">
              <input
                type="number"
                placeholder="Max $"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Button */}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shrink-0"
            >
              <Filter className="w-4 h-4" /> Filter
            </button>

            {/* Clear Filter Button */}
            {(search || selectedCategory || minPrice || maxPrice) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm transition flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </form>

          {/* Catalog & Cart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProductCatalog
              products={products}
              loading={loading}
              addingId={addingId}
              onAddToCart={handleAddToCart}
            />
            <ShoppingCartComponent
              cart={cart}
              checkoutStatus={checkoutStatus}
              onFetchCart={fetchCart}
              onCheckout={handleCheckout}
            />
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Showing <span className="text-slate-200 font-medium">{products.length}</span> of{' '}
                <span className="text-slate-200 font-medium">{totalItems}</span> items (Page {page} of {totalPages})
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || loading}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs sm:text-sm text-slate-300 px-3 font-medium whitespace-nowrap text-center min-w-[50px]">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages || loading}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my_orders' && (
        <MyOrdersList
          orders={myOrders}
          loading={loadingMyOrders}
          onFetchOrders={fetchMyOrders}
          onOpenDetail={fetchMyOrderDetail}
        />
      )}

      <MyOrderDetailModal
        isOpen={isMyOrderModalOpen}
        loading={loadingMyOrderDetail}
        order={selectedMyOrder}
        onClose={() => {
          setIsMyOrderModalOpen(false);
          setSelectedMyOrder(null);
        }}
      />
    </div>
  );
}