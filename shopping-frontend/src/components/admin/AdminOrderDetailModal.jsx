import React from 'react';
import { Package, X } from 'lucide-react';

export default function AdminOrderDetailModal({ isOpen, loading, order, onClose }) {
  if (!isOpen) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN') : 'N/A';

  const renderStatusBadge = (status) => {
    const styles = {
      PAID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      CANCELLED: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full border whitespace-nowrap ${styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-fadeIn max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-bold text-base sm:text-lg text-white truncate">
              Order Details #{order ? order.id : ''}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">Loading order receipt details...</div>
          ) : !order ? (
            <div className="py-12 text-center text-rose-400 text-xs sm:text-sm">Order information unavailable.</div>
          ) : (
            <>
              {/* Grid Thông tin đơn hàng */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-700/60 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Order ID</p>
                  <p className="font-mono font-bold text-indigo-400 text-xs sm:text-sm">#{order.id}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Customer</p>
                  <p className="font-bold text-white text-xs truncate">
                    {order.user_name || order.full_name || `User #${order.user_id}`}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {order.user_email || `ID: ${order.user_id}`}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Status</p>
                  <div className="mt-1">{renderStatusBadge(order.status || 'PAID')}</div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Order Date</p>
                  <p className="font-medium text-slate-200 text-xs">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Danh sách sản phẩm mua */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Purchased Items
                </h4>

                {/* 📱 Mobile View: Dạng Card Thẻ (Hiển thị khi màn hình nhỏ < sm) */}
                <div className="block sm:hidden divide-y divide-slate-700/60 border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/30">
                  {order.items?.map((item) => (
                    <div key={item.id} className="p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-white text-xs">
                            {item.product_name || `Product #${item.product_id}`}
                          </p>
                          <p className="text-[10px] text-slate-500">ID: #{item.product_id}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          x{item.quantity}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400 text-[11px]">
                          Price: {formatCurrency(item.price)}
                        </span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 💻 Desktop View: Dạng Table (Hiển thị khi màn hình >= sm) */}
                <div className="hidden sm:block border border-slate-700/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700/60">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {order.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/60">
                          <td className="py-3 px-3">
                            <p className="font-medium text-white">{item.product_name || `Product #${item.product_id}`}</p>
                            <p className="text-[10px] text-slate-500">ID: #{item.product_id}</p>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-300">x{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-slate-300">{formatCurrency(item.price)}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tổng tiền đơn hàng */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-700/80">
                <span className="font-bold text-slate-200 text-xs sm:text-sm">Total Order Amount:</span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-400">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/50 border-t border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-xl shadow-sm transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}