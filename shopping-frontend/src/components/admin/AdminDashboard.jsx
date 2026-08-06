import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Package, Users, ShoppingBag, Menu, X, Image, Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL, getAuthHeaderOnly } from '../../config';
import ProductManagement from './ProductManagement';
import UserManagement from './UserManagement';
import OrderManagement from './OrderManagement';
import AdminOrderDetailModal from './AdminOrderDetailModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'users' | 'orders'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const result = await res.json();
      const catList = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      setCategories(catList);
    } catch (err) {
      console.error('Cannot fetch categories:', err);
    }
  }, []);

  // 🟢 Product modal state (Thêm category vào formData)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', stock: '', image_url: '' });
  const [formError, setFormError] = useState('');
  const [imageSource, setImageSource] = useState('upload');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort_by: sortBy,
        order: order,
      });

      if (search.trim()) params.append('search', search.trim());
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);

      const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
      const result = await res.json();

      setProducts(result.data || []);
      setPagination(prev => ({ ...prev, total: result.total || 0, totalPages: result.total_pages || 1 }));
    } catch (err) {
      console.error(err);
      toast.error('Cannot fetch products. Please try again later.');
    } finally {
      setLoadingProducts(false);
    }
  }, [pagination.page, pagination.limit, search, minPrice, maxPrice, selectedCategory, sortBy, order]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaderOnly()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot fetch users');
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      toast.error(err.message || 'Cannot fetch user list.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: getAuthHeaderOnly()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot fetch orders');
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      toast.error(err.message || 'Cannot fetch order list.');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchOrderDetail = async (orderId) => {
    setIsOrderModalOpen(true);
    setLoadingOrderDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        headers: getAuthHeaderOnly()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      } else {
        toast.error('Cannot fetch order details');
        setIsOrderModalOpen(false);
      }
    } catch (err) {
      toast.error('Error connecting to server');
      setIsOrderModalOpen(false);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    }
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchProducts, fetchCategories, fetchUsers, fetchOrders]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const body = new FormData();
    body.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: body,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
        toast.success('📷 Image uploaded successfully!');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      toast.error('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  // 🟢 Cập nhật hàm mở Modal thiết lập thông tin Category
  const openProductModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        category: product.category || '', // 🟢 Bổ sung Category
        price: product.price || '',
        stock: product.stock || '',
        image_url: product.image_url || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', price: '', stock: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  // 🟢 Cập nhật Submit với category trong Payload
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: formData.name,
      category: formData.category.trim(), // 🟢 Thêm category vào payload
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      image_url: formData.image_url.trim()
    };

    try {
      const url = editingProduct ? `${API_BASE_URL}/products/${editingProduct.id}` : `${API_BASE_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaderOnly()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'An error occurred');
      }

      toast.success(editingProduct ? `✏️ Updated "${formData.name}" successfully!` : `🎉 Added product successfully!`);
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message);
      toast.error(`❌ ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the product "${name || id}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaderOnly()
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Cannot delete product');
      }

      toast.info(`🗑️ Product deleted successfully!`);
      fetchProducts();
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    const targetUser = users.find(u => u.id === userId);
    const adminCount = users.filter(u => u.role === 'admin').length;

    if (targetUser?.role === 'admin' && newRole !== 'admin' && adminCount <= 1) {
      toast.error('❌ Cannot demote the last remaining admin in the system!');
      return;
    }

    setUpdatingRoleId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaderOnly()
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot update user role');

      toast.success(`🛡️ Updated role for "${userName}" to: ${newRole.toUpperCase()}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col min-[950px]:flex-row">
      {/* Mobile Toggle Bar */}
      <div className="min-[950px]:hidden bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex justify-start items-center sticky top-0 z-30 backdrop-blur-md">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{isSidebarOpen ? 'Hide Menu' : 'Menu'}</span>
        </button>
      </div>

      {/* Navigation Sidebar */}
      <aside className={`w-full min-[950px]:w-64 bg-slate-800/80 border-r border-slate-700/60 p-4 flex-col justify-between shrink-0 ${isSidebarOpen ? 'flex' : 'hidden min-[950px]:flex'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-700/50 pb-4">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Admin Portal</h2>
              <p className="text-[11px] text-slate-400">Management System</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('products');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Management</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('users');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Management</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-700/50 text-[11px] text-slate-500 text-center">
          Shopping System v2.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {activeTab === 'products' && (
          <ProductManagement
            products={products}
            pagination={pagination}
            loadingProducts={loadingProducts}
            search={search}
            setSearch={setSearch}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            sortBy={sortBy}
            setSortBy={setSortBy}
            order={order}
            setOrder={setOrder}
            onFetchProducts={fetchProducts}
            onOpenCreateModal={() => openProductModal(null)}
            onOpenEditModal={(p) => openProductModal(p)}
            onDeleteProduct={handleDeleteProduct}
            onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement
            users={users}
            loadingUsers={loadingUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            updatingRoleId={updatingRoleId}
            onFetchUsers={fetchUsers}
            onRoleChange={handleRoleChange}
          />
        )}

        {activeTab === 'orders' && (
          <OrderManagement
            orders={orders}
            loadingOrders={loadingOrders}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            orderStatusFilter={statusFilter}
            setOrderStatusFilter={setStatusFilter}
            onFetchOrders={fetchOrders}
            onOpenOrderModal={fetchOrderDetail}
          />
        )}
      </main>

      {/* Product Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                {editingProduct ? 'Update Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 🟢 MỚI: Input nhập Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Electronics, Clothing, Books..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (VND)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Product Picture</label>
                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageSource('upload')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${imageSource === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource('url')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${imageSource === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Image className="w-3.5 h-3.5" /> Direct URL
                  </button>
                </div>

                {imageSource === 'upload' ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition text-slate-400 hover:text-indigo-400">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <Upload className="w-6 h-6 mb-1 text-slate-400" />
                        <p className="text-xs font-semibold">{uploadingImage ? 'Uploading image...' : 'Click to select local image'}</p>
                        <p className="text-[10px] text-slate-500">PNG, JPG, JPEG, WEBP or GIF</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                )}

                {formData.image_url && (
                  <div className="mt-3 text-center bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center px-1 mb-1">
                      <p className="text-[10px] text-slate-400">Selected Picture Preview:</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-24 max-w-full mx-auto object-contain p-1 rounded-lg border border-slate-700/60"
                      style={{ objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <span className="hidden text-xs text-rose-400">Invalid Image URL</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white shadow-lg shadow-indigo-600/30"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Order Receipt Modal */}
      <AdminOrderDetailModal
        isOpen={isOrderModalOpen}
        loading={loadingOrderDetail}
        order={selectedOrder}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}