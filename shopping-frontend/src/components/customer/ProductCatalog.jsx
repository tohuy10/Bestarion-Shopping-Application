import React from 'react';
import { Package, Plus, X } from 'lucide-react';

export default function ProductCatalog({ products, loading, addingId, onAddToCart }) {
  if (loading) {
    return <div className="col-span-2 text-center py-12 text-slate-400">Loading products...</div>;
  }

  return (
    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {products.map((p) => {
        const isOutOfStock = p.stock <= 0;
        const isAdding = addingId === p.id;

        return (
          <div
            key={p.id}
            className={`bg-slate-800/60 border rounded-2xl p-5 flex flex-col justify-between transition group ${isOutOfStock ? 'border-rose-500/30 opacity-75' : 'border-slate-700/60 hover:border-indigo-500/50'
              }`}
          >
            <div>
              <div className="h-44 w-full bg-slate-950/60 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-slate-700/50 relative">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`items-center justify-center text-slate-600 ${p.image_url ? 'hidden' : 'flex'}`}>
                  <Package className="w-10 h-10 stroke-1" />
                </div>
              </div>

              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                {isOutOfStock && (
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                    Out of Stock
                  </span>
                )}
              </div>

              <p className="text-emerald-400 font-bold text-base mb-3">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
              </p>

              <p className="text-xs text-slate-400">
                Stock:{' '}
                {isOutOfStock ? (
                  <span className="text-rose-400 font-medium">0 (Out of stock)</span>
                ) : (
                  <span className="text-slate-200">{p.stock} products</span>
                )}
              </p>
            </div>

            <button
              onClick={() => onAddToCart(p)}
              disabled={isOutOfStock || isAdding}
              className={`mt-4 w-full py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${isOutOfStock
                ? 'bg-slate-700/50 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
                }`}
            >
              {isAdding ? (
                'Adding...'
              ) : isOutOfStock ? (
                <>
                  <X className="w-4 h-4 text-rose-400" /> Out of Stock
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
