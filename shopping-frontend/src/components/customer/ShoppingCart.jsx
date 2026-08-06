import React from 'react';
import { ShoppingCart as ShoppingCartIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL, getAuthHeaders } from '../../config';

export default function ShoppingCart({ cart, checkoutStatus, onFetchCart, onCheckout }) {
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdateQuantity = async (item, newQty) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${item.product_id || item.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity: newQty })
      });

      if (res.ok) {
        if (newQty <= 0) toast.info('🗑️ Item removed from cart');
        await onFetchCart();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update quantity');
      }
    } catch (err) {
      toast.error('Network error while updating cart');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${item.product_id || item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        toast.success('🗑️ Item removed from cart');
        await onFetchCart();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to remove item from cart');
      }
    } catch (err) {
      toast.error('Network error while removing item from cart');
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 h-fit space-y-4">
      <h2 className="font-bold text-white text-lg flex items-center gap-2">
        <ShoppingCartIcon className="w-5 h-5 text-indigo-400" /> Shopping Cart
      </h2>

      {cart.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">Your cart is empty</p>
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-slate-700/50 max-h-[30rem] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id || item.product_id} className="py-2.5 flex justify-between items-start text-xs">
                <div className="pr-4">
                  <p className="font-medium text-white">{item.product_name || item.name}</p>
                  <p className="text-slate-400 mt-0.5">{item.quantity} x {new Intl.NumberFormat('vi-VN').format(item.price)}đ</p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/40 px-2 py-1 rounded">
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        className="text-slate-300 hover:text-white px-1"
                        title="Decrease"
                      >
                        -
                      </button>
                      <span className="font-bold text-white px-1">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                        className="text-slate-300 hover:text-white px-1"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-3">
                  <span className="font-bold text-emerald-400">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="text-rose-400 hover:text-rose-500"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-700 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-300">Total:</span>
            <span className="text-emerald-400 text-base">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCartPrice)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || checkoutStatus.loading}
            className={`w-full py-2.5 text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${cart.length === 0 || checkoutStatus.loading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.98]'
              }`}
          >
            {checkoutStatus.loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      )}
    </div>
  );
}
