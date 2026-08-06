import React from 'react';
import { Package, X, Download, Printer } from 'lucide-react';

export default function MyOrderDetailModal({ isOpen, loading, order, onClose }) {
  if (!isOpen) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN') : 'N/A';

  const renderStatusBadge = (status) => {
    const currentStatus = status || 'PAID';
    const styles = {
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`px-2.5 py-0.5 text-[10px] sm:text-xs font-bold rounded-full border whitespace-nowrap ${styles[currentStatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
        {currentStatus}
      </span>
    );
  };

  // 🟢 Hàm xử lý tải/in hóa đơn PDF
  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <>
      {/* 🟢 CSS Tối ưu riêng khi bấm Lưu/In PDF (Chuyển sang giao diện trắng chuyên nghiệp cho Hóa đơn) */}
      <style>
        {`
          @media print {
          /* 🟢 Xóa Header/Footer mặc định của trình duyệt (Tiêu đề & URL) */
            @page {
              margin: 0;
              size: auto;
            }

            body {
            /* Bổ sung margin cho body để nội dung không bị dính sát mép giấy */
              margin: 1.5cm;
            }
            body * {
              visibility: hidden;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible;
            }
            #printable-invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background-color: white !important;
              color: black !important;
              padding: 20px;
            }
            .no-print {
              display: none !important;
            }
            .print-text-dark {
              color: #111827 !important;
            }
            .print-border {
              border-color: #e5e7eb !important;
            }
            .print-bg-light {
              background-color: #f9fafb !important;
            }
          }
        `}
      </style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fadeIn max-h-[90vh] flex flex-col">

          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400 shrink-0" />
              <h3 className="font-bold text-base sm:text-lg text-white truncate">
                Order Receipt {order ? `#${order.id}` : ''}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition no-print"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body - Vùng sẽ được xuất/in ra PDF */}
          <div id="printable-invoice" className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                Loading order receipt details...
              </div>
            ) : !order ? (
              <div className="py-12 text-center text-rose-400 text-xs sm:text-sm">
                Order details unavailable
              </div>
            ) : (
              <>
                {/* Header bổ sung riêng khi in PDF */}
                <div className="hidden print:block mb-6 border-b pb-4 border-gray-300">
                  <h1 className="text-2xl font-bold text-gray-900">SALES INVOICE</h1>
                  <p className="text-sm text-gray-500">Thank you for your purchase!</p>
                </div>

                {/* Grid Thông tin chung đơn hàng */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 print-bg-light p-3.5 rounded-xl border border-slate-700/60 print-border text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 print-text-dark">Order ID</p>
                    <p className="font-mono font-bold text-indigo-400 print-text-dark text-xs sm:text-sm">#{order.id}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 print-text-dark">Status</p>
                    <div className="mt-1">{renderStatusBadge(order.status)}</div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 print-text-dark">Created At</p>
                    <p className="font-semibold text-white print-text-dark text-xs">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                {/* Danh sách sản phẩm mua */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print-text-dark mb-2.5">
                    Purchased Products
                  </h4>

                  {/* 📱 Mobile View: Dạng Card Thẻ (< sm) */}
                  <div className="block sm:hidden print:hidden divide-y divide-slate-700/60 border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/30">
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

                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800/80">
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

                  {/* 💻 Desktop & Print View: Dạng Bảng Table */}
                  <div className="hidden sm:block print:block border border-slate-700/60 print-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 print-bg-light text-slate-400 print-text-dark uppercase font-semibold border-b border-slate-700/60 print-border">
                        <tr>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-center">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50 print-border">
                        {order.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/60">
                            <td className="py-3 px-3">
                              <p className="font-medium text-white print-text-dark">{item.product_name || `Product #${item.product_id}`}</p>
                              <p className="text-[10px] text-slate-500 print-text-dark">ID: #{item.product_id}</p>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-300 print-text-dark">x{item.quantity}</td>
                            <td className="py-3 px-3 text-right text-slate-300 print-text-dark">{formatCurrency(item.price)}</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400 print-text-dark">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tổng tiền đơn hàng */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-700 print-border">
                  <span className="text-xs sm:text-sm font-bold text-slate-300 print-text-dark">Grand Total:</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400 print-text-dark">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer - Các nút hành động */}
          <div className="px-4 sm:px-6 py-3 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-2 shrink-0 no-print">
            {order && !loading && (
              <button
                onClick={handlePrintInvoice}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </>
  );
}