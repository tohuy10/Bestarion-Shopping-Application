import React from 'react';
import { Search, Eye, RefreshCw, Calendar, User, Hash } from 'lucide-react';

export default function OrderManagement({
  orders,
  loadingOrders,
  orderSearch,
  setOrderSearch,
  orderStatusFilter,
  setOrderStatusFilter,
  onFetchOrders,
  onOpenOrderModal
}) {
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN') : 'N/A';

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            Paid
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">
            Pending
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id?.toString().includes(orderSearch) ||
      order.user_id?.toString().includes(orderSearch);

    const matchesStatus = orderStatusFilter === 'ALL' || order.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/40 p-4 sm:p-6 rounded-2xl border border-slate-700/50 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Order Management</h1>
          <p className="text-xs text-slate-400">View and check all orders in the system</p>
        </div>
        <button
          onClick={onFetchOrders}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs text-slate-200 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} /> Reload
        </button>
      </div>

      {/* Bộ lọc đơn hàng */}
      <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID / User ID..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setOrderStatusFilter('ALL')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${orderStatusFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setOrderStatusFilter('PAID')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${orderStatusFilter === 'PAID'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Paid
          </button>
          <button
            onClick={() => setOrderStatusFilter('PENDING')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${orderStatusFilter === 'PENDING'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setOrderStatusFilter('CANCELLED')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${orderStatusFilter === 'CANCELLED'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        
        {/* 📱 MOBILE VIEW: Dạng Card Thẻ (Hiển thị khi màn hình nhỏ hơn md) */}
        <div className="block md:hidden divide-y divide-slate-700/50">
          {loadingOrders ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading order list...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No orders found</div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-3 hover:bg-slate-800/80 transition">
                {/* Dòng 1: Order ID & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-indigo-400 text-xs">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Order #{order.id}</span>
                  </div>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                {/* Dòng 2: User ID & Tổng Tiền */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>User #{order.user_id}</span>
                  </div>
                  <div className="font-semibold text-emerald-400">
                    {formatCurrency(order.total_amount)}
                  </div>
                </div>

                {/* Dòng 3: Ngày tạo & Nút bấm Chi Tiết */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-700/30">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <button
                    onClick={() => onOpenOrderModal(order.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 💻 DESKTOP VIEW: Bảng Table (Hiển thị từ màn hình md trở lên) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-700/60">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loadingOrders ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading order list...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/80 transition">
                    <td className="p-4 font-medium text-indigo-400">#{order.id}</td>
                    <td className="p-4 text-slate-300">User #{order.user_id}</td>
                    <td className="p-4 font-semibold text-emerald-400">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="p-4">{renderStatusBadge(order.status)}</td>
                    <td className="p-4 text-slate-400 text-xs">{formatDate(order.created_at)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onOpenOrderModal(order.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}