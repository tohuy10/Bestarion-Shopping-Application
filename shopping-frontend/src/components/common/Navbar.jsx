import React, { useState } from 'react';
import { ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar({ user, activeView, setActiveView, onLogout }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Tạo chữ cái viết tắt đại diện cho User (Ví dụ: "Nguyen Van A" -> "NA")
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <nav className="bg-slate-800/80 border-b border-slate-700/60 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex justify-between items-center gap-2">

        {/* Left Side: Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0">
            <span className="font-bold text-white text-sm sm:text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Shopping Store
            </span>
            <span className={`self-start sm:self-auto text-[9px] sm:text-xs px-2 py-0.5 sm:px-2.5 rounded-full font-semibold shrink-0 whitespace-nowrap ${
              user?.role === 'admin'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {user?.role === 'admin' ? 'ADMIN PANEL' : 'CUSTOMER STORE'}
            </span>
          </div>
        </div>

        {/* Right Side: User Profile & Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          
          {/* 📱 MOBILE VIEW: Avatar Nút bấm hiển thị thông tin User */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-1.5 p-1 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition"
              title={user?.full_name}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/40">
                {getInitials(user?.full_name)}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-0.5" />
            </button>

            {/* Popup Xổ xuống thông tin User trên Mobile */}
            {showMobileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMobileMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 z-20 space-y-2 animate-fadeIn">
                  <div className="border-b border-slate-700 pb-2">
                    <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveView(activeView === 'profile' ? 'main' : 'profile');
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 rounded-lg transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{activeView === 'profile' ? 'Main Page' : 'Account Settings'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 💻 DESKTOP VIEW: Thông tin Tên + Email đầy đủ */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.full_name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>

          {/* Account / Main Page Button (Ẩn bớt trên mobile vì đã tích hợp vào Dropdown trên) */}
          <button
            onClick={() => setActiveView(activeView === 'profile' ? 'main' : 'profile')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-600/50 hover:border-indigo-500/30 rounded-xl text-xs font-medium transition"
            title={activeView === 'profile' ? 'Main Page' : 'Account Settings'}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>{activeView === 'profile' ? 'Main Page' : 'Account Settings'}</span>
          </button>

          {/* Logout Button (Desktop View) */}
          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-600/50 hover:border-rose-500/30 rounded-xl text-xs font-medium transition"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Log out</span>
          </button>

        </div>

      </div>
    </nav>
  );
}