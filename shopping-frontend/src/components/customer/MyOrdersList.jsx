import React from 'react';
import { Package, Eye, RefreshCw, Calendar, Hash } from 'lucide-react';

export default function MyOrdersList({ orders, loading, onFetchOrders, onOpenDetail }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status) => {
    const currentStatus = status || 'PAID';
    const styles = {
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };

    return (
      <span className={`px-2.5 py-1 text-[11px] sm:text-xs rounded-full font-semibold border whitespace-nowrap ${styles[currentStatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
        {currentStatus}
      </span>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl p-4 sm:p-6 space-y-4 animate-fadeIn">
      {/* Header inside the block */}
      <div className="flex justify-between items-center border-b border-slate-700/60 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400 shrink-0" /> My Order History
          </h2>
          <p className="text-xs text-slate-400">View all orders placed with your account</p>
        </div>
        <button
          onClick={onFetchOrders}
          className="p-2 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition shrink-0"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG RESPONSIVE */}
      <div className="rounded-xl overflow-hidden">
        
        {/* 📱 MOBILE VIEW: Dạng Card Thẻ (Hiển thị khi dưới màn hình md) */}
        <div className="block md:hidden divide-y divide-slate-700/50 border border-slate-700/60 rounded-xl bg-slate-900/30">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading your order history...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No orders placed yet</div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="p-4 space-y-3 hover:bg-slate-800/60 transition">
                {/* Dòng 1: Order ID & Status Badge */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 font-mono font-bold text-indigo-400 text-xs">
                    <Hash className="w-3.5 h-3.5" /> #{ord.id}
                  </div>
                  <div>{renderStatusBadge(ord.status)}</div>
                </div>

                {/* Dòng 2: Ngày đặt hàng */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatDate(ord.created_at)}</span>
                </div>

                {/* Dòng 3: Tổng tiền & Nút xem hóa đơn */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <div className="text-emerald-400 font-bold text-sm">
                    {formatCurrency(ord.total_amount)}
                  </div>
                  <button
                    onClick={() => onOpenDetail(ord.id)}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl transition text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 💻 DESKTOP VIEW: Dạng Bảng Table (Hiển thị từ màn hình md trở lên) */}
        <div className="hidden md:block overflow-x-auto border border-slate-700/60 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-700/60">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading your order history...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No orders placed yet
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/80 transition">
                    <td className="p-4 font-mono font-bold text-indigo-400">#{ord.id}</td>
                    <td className="p-4 text-slate-300 text-xs">{formatDate(ord.created_at)}</td>
                    <td className="p-4">{renderStatusBadge(ord.status)}</td>
                    <td className="p-4 text-emerald-400 font-bold">
                      {formatCurrency(ord.total_amount)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onOpenDetail(ord.id)}
                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl transition text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Receipt
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