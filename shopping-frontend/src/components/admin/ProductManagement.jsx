import React from 'react';
import {
  Package, Plus, Search, ChevronLeft, ChevronRight, Edit2, Trash2,
  ArrowUpDown, RefreshCw, Tag
} from 'lucide-react';

export default function ProductManagement({
  products,
  pagination,
  loadingProducts,
  search,
  setSearch,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedCategory,
  setSelectedCategory,
  categories = [],
  sortBy,
  setSortBy,
  order,
  setOrder,
  onFetchProducts,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteProduct,
  onPageChange
}) {
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/40 p-4 sm:p-6 rounded-2xl border border-slate-700/50 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Product Management</h1>
          <p className="text-xs text-slate-400">Create, edit, view inventory, and delete products</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
          />
        </div>

        {/* 🟢 MỚI: Bộ lọc Category */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {Array.isArray(categories) && categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex gap-2">
          <input
            type="number"
            placeholder="Price from"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white"
          />
          <input
            type="number"
            placeholder="Price to"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white"
          />
        </div>

        <div className="md:col-span-3 flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-slate-300"
          >
            <option value="created_at">Newest</option>
            <option value="price">Price</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
          </select>
          <button
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50 shrink-0"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={onFetchProducts}
            className="p-2 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50 shrink-0"
            title="Reload products"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${loadingProducts ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Danh sách Sản Phẩm */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        
        {/* 📱 MOBILE VIEW: Dạng Card Thẻ */}
        <div className="block md:hidden divide-y divide-slate-700/50">
          {loadingProducts ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading product list...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No products found</div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/80 transition">
                {/* Ảnh + Tên + Category + Stock */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`items-center justify-center text-slate-600 ${product.image_url ? 'hidden' : 'flex'}`}>
                      <Package className="w-5 h-5 stroke-1" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-medium text-white text-xs truncate">{product.name}</h3>
                      {product.category && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                      {formatCurrency(product.price)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Stock: <span className="text-slate-200 font-semibold">{product.stock}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onOpenEditModal(product)}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(product.id, product.name)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 💻 DESKTOP VIEW: Bảng Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-700/60">
              <tr>
                <th className="p-3.5 w-14">Picture</th>
                <th className="p-3.5">Product</th>
                {/* 🟢 MỚI: Thêm cột Category */}
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loadingProducts ? (
                <tr>
                  {/* 🟢 Tăng colSpan từ 5 lên 6 */}
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading product list...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  {/* 🟢 Tăng colSpan từ 5 lên 6 */}
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/80 transition">
                    <td className="p-3.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`items-center justify-center text-slate-600 ${product.image_url ? 'hidden' : 'flex'}`}>
                          <Package className="w-5 h-5 stroke-1" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-white">{product.name}</td>
                    
                    {/* 🟢 MỚI: Hiển thị giá trị Category */}
                    <td className="p-3.5">
                      {product.category ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <Tag className="w-3 h-3" />
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Uncategorized</span>
                      )}
                    </td>

                    <td className="p-3.5 text-emerald-400 font-bold">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="p-3.5 text-slate-300">{product.stock}</td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => onOpenEditModal(product)}
                        className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product.id, product.name)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-3.5 bg-slate-900/40 border-t border-slate-700/60 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <span>Total: <strong className="text-slate-200">{pagination.total}</strong> products</span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="whitespace-nowrap px-1">Page {pagination.page} / {pagination.totalPages}</span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}