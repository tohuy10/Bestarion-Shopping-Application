import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  ArrowUpDown, RefreshCw, ShoppingBag,
  X, Check, LogOut, ShoppingCart, User, Key, Mail,
  AlertCircle, CheckCircle, ArrowLeft, Send, ShieldCheck,
  ShieldAlert, UserCheck, Menu,
  Package, Users, Eye, Filter, Calendar, CreditCard, Image, Upload // 👈 Đã thêm icon Upload & Image mới
} from 'lucide-react';

// 🟢 Import Toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState('main');

  const handleUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveView('main');
    toast.info('👋 Logged out of your account');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* 🟢 ToastContainer nằm ở cấp cao nhất */}
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {!user ? (
        <AuthScreen
          onLoginSuccess={(userData) => {
            setUser(userData);
            setActiveView('main');
          }}
        />
      ) : (
        <>
          {/* Top Navbar */}
          <nav className="bg-slate-800/80 border-b border-slate-700/60 sticky top-0 z-40 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg tracking-tight">Shopping Store</span>
                  <span className={`ml-3 text-xs px-2.5 py-0.5 rounded-full font-semibold ${user.role === 'admin'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                    {user.role === 'admin' ? 'ADMIN PANEL' : 'CUSTOMER STORE'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white">{user.full_name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={() => setActiveView(activeView === 'profile' ? 'main' : 'profile')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-600/50 hover:border-indigo-500/30 rounded-xl text-xs font-medium transition"
                >
                  <User className="w-3.5 h-3.5" />
                  {activeView === 'profile' ? 'Main Page' : 'Account Settings'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-600/50 hover:border-rose-500/30 rounded-xl text-xs font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log out
                </button>
              </div>
            </div>
          </nav>

          {/* Điều hướng View dựa vào Role */}
          {activeView === 'profile' ? (
            <ProfilePage
              user={user}
              onBack={() => setActiveView('main')}
              onUserUpdate={handleUserUpdate}
            />
          ) : user.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <CustomerStorefront />
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================================
 1. MÀN HÌNH AUTHENTICATION (Đăng ký / Đăng nhập / Quên & Đặt lại mật khẩu)
 ========================================================================= */
function AuthScreen({ onLoginSuccess }) {
  // mode: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState('login');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    token: '',
    new_password: ''
  });

  // 🟢 State lưu trữ lỗi chi tiết từng trường { email: "...", password: "..." }
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form & errors khi chuyển tab/mode
  const switchMode = (newMode) => {
    setAuthMode(newMode);
    setFieldErrors({});
    setGeneralError('');
  };

  // 🟢 Hàm validate dữ liệu phía Client trước khi gửi API
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Email (áp dụng cho tất cả các mode)
    if (!formData.email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Invalid email format (Ex: example@gmail.com)';
    }

    // Validate Register Mode
    if (authMode === 'register') {
      if (!formData.full_name.trim()) {
        errors.full_name = 'Please enter your full name';
      } else if (formData.full_name.trim().length < 2) {
        errors.full_name = 'Full name must be at least 2 characters long';
      }
    }

    // Validate Mật khẩu Đăng ký / Đăng nhập
    if (authMode === 'login' || authMode === 'register') {
      if (!formData.password) {
        errors.password = 'Please enter your password';
      } else if (authMode === 'register' && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
    }

    // Validate Reset Password Mode
    if (authMode === 'reset') {
      if (!formData.token.trim()) {
        errors.token = 'Please enter the OTP code';
      } else if (formData.token.trim().length !== 6 || !/^\d+$/.test(formData.token.trim())) {
        errors.token = 'OTP code must include exactly 6 digits';
      }

      if (!formData.new_password) {
        errors.new_password = 'Please enter your new password';
      } else if (formData.new_password.length < 6) {
        errors.new_password = 'New password must be at least 6 characters long';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0; // Trả về true nếu không có lỗi
  };

  // 🟢 Hàm hỗ trợ map lỗi từ Backend về đúng trường input
  const handleBackendErrors = (data) => {
    if (data.details && typeof data.details === 'object') {
      const mappedErrors = {};
      // Mapping từ PascalCase (Backend Go) sang snake_case (Frontend React)
      Object.keys(data.details).forEach((key) => {
        const fieldName = key
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '');
        mappedErrors[fieldName] = data.details[key];
      });
      setFieldErrors(mappedErrors);
    } else {
      setGeneralError(data.error || data.message || 'An error occurred, please try again');
    }
  };

  // Xử lý Submit Login & Register
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (!validateForm()) return; // Chặn gửi request nếu dữ liệu chưa hợp lệ

    setLoading(true);
    const isRegister = authMode === 'register';
    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          ...(isRegister && { full_name: formData.full_name.trim() })
        })
      });

      const data = await res.json();
      if (!res.ok) {
        handleBackendErrors(data);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(isRegister ? '🎉 Registration successful!' : '🔑 Login successful!');
      setTimeout(() => onLoginSuccess(data.user), 300);

    } catch (err) {
      setGeneralError('Cannot connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Yêu cầu Quên Mật Khẩu
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        handleBackendErrors(data);
        return;
      }

      const otpCode = data.reset_token || '';
      setFormData(prev => ({ ...prev, token: otpCode }));
      toast.success(`🎉 Mã xác thực OTP của bạn là: ${otpCode}`);
      switchMode('reset');
    } catch (err) {
      setGeneralError('System error while sending recovery request.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Đặt lại mật khẩu
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          token: formData.token.trim(),
          new_password: formData.new_password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        handleBackendErrors(data);
        return;
      }

      toast.success('🎉 Password reset successful! Please log in.');
      switchMode('login');
      setFormData(prev => ({ ...prev, password: '', token: '', new_password: '' }));
    } catch (err) {
      setGeneralError('Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {authMode === 'login' && 'Login'}
            {authMode === 'register' && 'Create New Account'}
            {authMode === 'forgot' && 'Forgot Password'}
            {authMode === 'reset' && 'Reset Password'}
          </h2>
        </div>

        {/* Thông báo lỗi chung (Nếu có) */}
        {generalError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs text-center font-medium">
            {generalError}
          </div>
        )}

        {/* Form Đăng nhập / Đăng ký */}
        {(authMode === 'login' || authMode === 'register') && (
          <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={(e) => {
                      setFormData({ ...formData, full_name: e.target.value });
                      if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: '' });
                    }}
                    className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${fieldErrors.full_name ? 'border-rose-500' : 'border-slate-700'
                      } rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500`}
                  />
                </div>
                {fieldErrors.full_name && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.full_name}</span>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${fieldErrors.email ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500`}
                />
              </div>
              {fieldErrors.email && (
                <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.email}</span>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${fieldErrors.password ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500`}
                />
              </div>
              {fieldErrors.password && (
                <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/30 text-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : authMode === 'register' ? 'Sign Up' : 'Log In'}
            </button>
          </form>
        )}

        {/* Form Yêu cầu Quên mật khẩu */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Recovery Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${fieldErrors.email ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500`}
                />
              </div>
              {fieldErrors.email && (
                <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.email}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/30 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send OTP Verification Code'}
            </button>
          </form>
        )}

        {/* Form Đặt lại mật khẩu */}
        {authMode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">OTP Code (6 digits)</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="VD: 495916"
                  value={formData.token}
                  onChange={(e) => {
                    setFormData({ ...formData, token: e.target.value });
                    if (fieldErrors.token) setFieldErrors({ ...fieldErrors, token: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${fieldErrors.token ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white font-mono tracking-widest focus:outline-none focus:border-indigo-500`}
                />
              </div>
              {fieldErrors.token && (
                <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.token}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.new_password}
                  onChange={(e) => {
                    setFormData({ ...formData, new_password: e.target.value });
                    if (fieldErrors.new_password) setFieldErrors({ ...fieldErrors, new_password: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${fieldErrors.new_password ? 'border-rose-500' : 'border-slate-700'
                    } rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500`}
                />
              </div>
              {fieldErrors.new_password && (
                <span className="text-[11px] text-rose-400 mt-1 block">{fieldErrors.new_password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-600/30 text-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Password Reset'}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-2 border-t border-slate-700/60 flex justify-between items-center text-xs">
          {authMode !== 'login' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </button>
          )}

          {authMode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="text-indigo-400 hover:underline ml-auto"
            >
              Don't have an account? Register now
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

/* =========================================================================
 2. TRANG HỒ SƠ NGƯỜI DÙNG
 ========================================================================= */
function ProfilePage({ user, onBack, onUserUpdate }) {
  const [profile, setProfile] = useState(user);
  const [nameForm, setNameForm] = useState({ full_name: user?.full_name || '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: getAuthHeaders()
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setNameForm({ full_name: data.full_name || '' });
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || 'Cannot fetch profile information');
        }
      } catch (err) {
        toast.error('Cannot fetch profile information');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError('');

    if (!nameForm.full_name.trim()) {
      setNameError('Please enter your full name');
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: nameForm.full_name.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error || data.message || 'Failed to update name');
        return;
      }

      const updatedUser = data.user || { ...profile, full_name: nameForm.full_name.trim() };
      setProfile(updatedUser);
      onUserUpdate(updatedUser);
      toast.success('Full name updated successfully');
    } catch (err) {
      toast.error('Connection error while updating full name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.current_password || !passwordForm.new_password) {
      setPasswordError('Please enter both current and new passwords');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/me/password`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordForm)
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || data.message || 'Failed to update password');
        return;
      }

      setPasswordForm({ current_password: '', new_password: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error('Connection error while updating password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-xs text-slate-400">Edit your full name and change your password from a dedicated page</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-xs font-medium text-white border border-slate-600/50"
        >
          Back
        </button>
      </div>

      {loadingProfile ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400">
          Loading user information...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Current Information</h2>
                <p className="text-xs text-slate-400">View your current account information</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-700/60 pb-3">
                <span className="text-slate-400">Full Name</span>
                <span className="text-white font-medium text-right">{profile?.full_name}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-700/60 pb-3">
                <span className="text-slate-400">Email</span>
                <span className="text-white font-medium text-right break-all">{profile?.email}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-700/60 pb-3">
                <span className="text-slate-400">Role</span>
                <span className="text-white font-medium capitalize text-right">{profile?.role}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Created At</span>
                <span className="text-white font-medium text-right">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleUpdateName} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Update Full Name</h2>
                <p className="text-xs text-slate-400">Your display name will be updated immediately in the interface</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Full Name</label>
                <input
                  type="text"
                  value={nameForm.full_name}
                  onChange={(e) => setNameForm({ full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                {nameError && <p className="text-[11px] text-rose-400 mt-1">{nameError}</p>}
              </div>

              <button
                type="submit"
                disabled={savingName}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50"
              >
                {savingName ? 'Saving...' : 'Update Full Name'}
              </button>
            </form>

            <form onSubmit={handleChangePassword} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
              <input
                type="text"
                name="username"
                value={user?.email || profile?.email || ''} // Email của user hiện tại (ví dụ: admin@gmail.com)
                readOnly
                autoComplete="username"
                className="hidden" // Hoặc style style={{ display: 'none' }}
              />
              <div>
                <h2 className="text-lg font-bold text-white">Change Password</h2>
                <p className="text-xs text-slate-400">Enter your current and new passwords</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {passwordError && <p className="text-[11px] text-rose-400">{passwordError}</p>}

              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 2. TRANG MUA SẮM DÀNH CHO CUSTOMER
 ========================================================================= */
function CustomerStorefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState({ loading: false, error: null, success: false });

  // 🟢 State cho Quản lý Đơn hàng Cá nhân của Customer
  const [customerTab, setCustomerTab] = useState('shop'); // 'shop' | 'my_orders'
  const [myOrders, setMyOrders] = useState([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [selectedMyOrder, setSelectedMyOrder] = useState(null);
  const [isMyOrderModalOpen, setIsMyOrderModalOpen] = useState(false);
  const [loadingMyOrderDetail, setLoadingMyOrderDetail] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products?limit=20`);
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Lỗi tải giỏ hàng:', err);
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
      console.error('Lỗi tải đơn hàng cá nhân:', err);
    } finally {
      setLoadingMyOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchMyOrders();
  }, [fetchMyOrders]);

  useEffect(() => {
    if (customerTab === 'my_orders') {
      fetchMyOrders();
    }
  }, [customerTab, fetchMyOrders]);

  const handleViewMyOrderDetails = async (orderId) => {
    setLoadingMyOrderDetail(true);
    setIsMyOrderModalOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/my/orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedMyOrder(data);
      } else {
        toast.error('Cannot load order receipt details');
      }
    } catch (err) {
      toast.error('Network error loading order details');
    } finally {
      setLoadingMyOrderDetail(false);
    }
  };

  const addToCart = async (product) => {
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
        toast.success(`🛒 Added "${product.name}" to cart`);
        await fetchCart();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Cannot add to cart');
      }
    } catch (err) {
      toast.error('Network error while adding to cart');
    } finally {
      setAddingId(null);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setCheckoutStatus({ loading: true, error: null, success: false });

    try {
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('🎉 Checkout successful! Your order has been placed.');
        setCheckoutStatus({ loading: false, error: null, success: true });
        setCart([]);
        fetchProducts();
        fetchMyOrders();
      } else {
        toast.error(`❌ ${data.error || 'Checkout failed'}`);
        setCheckoutStatus({ loading: false, error: data.error || 'Checkout failed', success: false });
      }
    } catch (err) {
      toast.error('Network error while checking out');
      setCheckoutStatus({ loading: false, error: 'Network error while checking out', success: false });
    }
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Store</h1>
          <p className="text-xs text-slate-400">Choose your favorite products or view your past orders</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap max-w-full">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs flex-wrap max-w-full">
            <button
              onClick={() => setCustomerTab('shop')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${customerTab === 'shop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <ShoppingBag className="w-4 h-4" /> Shop Catalog
            </button>
            <button
              onClick={() => setCustomerTab('my_orders')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${customerTab === 'my_orders' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
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

      {customerTab === 'my_orders' ? (
        /* ==================== MÀN HÌNH ĐƠN HÀNG CÁ NHÂN ==================== */
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" /> My Order History
              </h2>
              <p className="text-xs text-slate-400">View all orders placed with your account</p>
            </div>
            <button
              onClick={fetchMyOrders}
              className="p-2 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loadingMyOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
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
                {loadingMyOrders ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading your order history...
                    </td>
                  </tr>
                ) : myOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No orders placed yet
                    </td>
                  </tr>
                ) : (
                  myOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/80 transition">
                      <td className="p-4 font-mono font-bold text-indigo-400">#{ord.id}</td>
                      <td className="p-4 text-slate-300 text-xs">{formatDate(ord.created_at)}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {ord.status || 'PAID'}
                        </span>
                      </td>
                      <td className="p-4 text-emerald-400 font-bold">
                        {formatCurrency(ord.total_amount)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleViewMyOrderDetails(ord.id)}
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
      ) : (
        /* ==================== MÀN HÌNH DANH SÁCH SẢN PHẨM ==================== */

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách sản phẩm dạng Thẻ Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-slate-400">Loading products...</div>
          ) : products.map((p) => {
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
                  onClick={() => addToCart(p)}
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

        {/* Cột Giỏ hàng bên phải */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 h-fit space-y-4">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" /> Shopping Cart
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
                            onClick={async () => {
                              const newQty = item.quantity - 1;
                              try {
                                const res = await fetch(`${API_BASE_URL}/cart/items/${item.product_id || item.id}`, {
                                  method: 'PATCH',
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({ quantity: newQty })
                                });

                                if (res.ok) {
                                  if (newQty <= 0) toast.info('🗑️ Item removed from cart');
                                  await fetchCart();
                                } else {
                                  const d = await res.json();
                                  toast.error(d.error || 'Failed to update quantity');
                                }
                              } catch (err) {
                                toast.error('Network error while updating cart');
                              }
                            }}
                            className="text-slate-300 hover:text-white px-1"
                            title="Decrease"
                          >
                            -
                          </button>

                          <span className="text-sm font-semibold px-2">{item.quantity}</span>

                          <button
                            onClick={async () => {
                              const newQty = item.quantity + 1;
                              try {
                                const res = await fetch(`${API_BASE_URL}/cart/items/${item.product_id || item.id}`, {
                                  method: 'PATCH',
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({ quantity: newQty })
                                });

                                if (res.ok) {
                                  await fetchCart();
                                } else {
                                  const d = await res.json();
                                  toast.error(d.error || 'Failed to update quantity');
                                }
                              } catch (err) {
                                toast.error('Network error while updating cart');
                              }
                            }}
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
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE_URL}/cart/items/${item.product_id || item.id}`, {
                              method: 'DELETE',
                              headers: getAuthHeaders()
                            });

                            if (res.ok) {
                              toast.success('🗑️ Item removed from cart');
                              await fetchCart();
                            } else {
                              const d = await res.json();
                              toast.error(d.error || 'Failed to remove item from cart');
                            }
                          } catch (err) {
                            toast.error('Network error while removing item from cart');
                          }
                        }}
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
                onClick={handleCheckout}
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
      </div>
      )}

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG CÁ NHÂN */}
      {isMyOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg text-white">
                  Order Receipt {selectedMyOrder ? `#${selectedMyOrder.id}` : ''}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsMyOrderModalOpen(false);
                  setSelectedMyOrder(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingMyOrderDetail ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Loading order receipt details...
              </div>
            ) : !selectedMyOrder ? (
              <div className="p-8 text-center text-rose-400 text-sm">
                Order details unavailable
              </div>
            ) : (
              <div className="space-y-4">
                {/* Thông tin chung */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Order ID</p>
                    <p className="font-mono font-bold text-indigo-400 text-sm">#{selectedMyOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                    <span className="px-2 py-0.5 text-[10px] rounded-full font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {selectedMyOrder.status || 'PAID'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Created At</p>
                    <p className="font-semibold text-white text-xs">{formatDate(selectedMyOrder.created_at)}</p>
                  </div>
                </div>

                {/* Bảng sản phẩm trong đơn */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Purchased Products</h4>
                  <div className="border border-slate-700/60 rounded-xl overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700/60">
                        <tr>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-center">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {selectedMyOrder.items?.map((item) => (
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

                {/* Tổng tiền */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-xs font-bold text-slate-300">Grand Total:</span>
                  <span className="text-base font-bold text-emerald-400">
                    {formatCurrency(selectedMyOrder.total_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 3. TRANG DASHBOARD QUẢN LÝ DÀNH CHO ADMIN (NÂNG CẤP SIDEBAR & USER ROLES)
 ========================================================================= */
function AdminDashboard() {
  // Tab hiện tại: 'products' | 'users' | 'orders'
  const [activeTab, setActiveTab] = useState('products');
  // State ẩn/hiện Sidebar menu khi màn hình nhỏ (Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* -----------------------------------------------------------------------
  STATE CHO QUẢN LÝ SẢN PHẨM
  ----------------------------------------------------------------------- */
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', image_url: '' });
  const [formError, setFormError] = useState('');
  const [imageSource, setImageSource] = useState('upload'); // 'upload' | 'url'
  const [uploadingImage, setUploadingImage] = useState(false);

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

  /* -----------------------------------------------------------------------
  STATE CHO QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
  ----------------------------------------------------------------------- */
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  /* -----------------------------------------------------------------------
  STATE CHO QUẢN LÝ ĐƠN HÀNG (MỚI)
  ----------------------------------------------------------------------- */
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Lấy Token từ LocalStorage để thực hiện các Request Admin
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  /* =======================================================================
  API CALLS: SẢN PHẨM
  ======================================================================= */
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
  }, [pagination.page, pagination.limit, search, minPrice, maxPrice, sortBy, order]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [fetchProducts, activeTab]);

  const openModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, stock: product.stock, image_url: product.image_url || '' });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: formData.name,
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
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Có lỗi xảy ra');
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
        headers: getAuthHeader()
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

  /* =======================================================================
  API CALLS: NGƯỜI DÙNG & QUẢN LÝ PHÂN QUYỀN
  ======================================================================= */
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot fetch users. Please try again later.');
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [fetchUsers, activeTab]);

  // Cập nhật Quyền (Role) cho Người Dùng
  const handleRoleChange = async (userId, newRole, userName) => {
    setUpdatingRoleId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot update user role');

      toast.success(`🛡️ Updated role for "${userName}" to: ${newRole.toUpperCase()}`);

      // Cập nhật trực tiếp State giao diện không cần reload lại toàn bộ
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // Lọc người dùng kết hợp Tìm kiếm & Phân quyền (Role)
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  /* =======================================================================
  API CALLS: QUẢN LÝ ĐƠN HÀNG (MỚI)
  ======================================================================= */
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        toast.error('Cannot fetch orders. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while fetching orders');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [fetchOrders, activeTab]);

  // Xem chi tiết đơn hàng
  const handleViewOrderDetail = async (orderId) => {
    setLoadingOrderDetail(true);
    setIsOrderModalOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      } else {
        toast.error('Cannot fetch order details. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while fetching order details');
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // Lọc danh sách đơn hàng
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toString().includes(orderSearch) ||
      order.user_id?.toString().includes(orderSearch);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Utility định dạng
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Render Badge trạng thái
  const renderStatusBadge = (status) => {
    const styles = {
      PAID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      CANCELLED: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
        {status}
      </span>
    );
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

      {/* ===================================================================
 1. LEFT NAVIGATION SIDEBAR
 =================================================================== */}
      <aside className={`w-full min-[950px]:w-64 bg-slate-800/80 border-r border-slate-700/60 p-4 flex-col justify-between shrink-0 ${isSidebarOpen ? 'flex' : 'hidden min-[950px]:flex'}`}>
        <div className="space-y-6">
          {/* Dashboard Header */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-700/50 pb-4">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Admin Portal</h2>
              <p className="text-[11px] text-slate-400">Management System</p>
            </div>
          </div>

          {/* Navigation Menu */}
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

            {/* 🟢 MỚI: Menu Quản Lý Đơn Hàng */}
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

        {/* Info Footer */}
        <div className="pt-4 border-t border-slate-700/50 text-[11px] text-slate-500 text-center">
          Shopping System v2.0
        </div>
      </aside>

      {/* ===================================================================
 2. MAIN CONTENT AREA
 =================================================================== */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* -----------------------------------------------------------------
 TAB 1: QUẢN LÝ SẢN PHẨM
 ----------------------------------------------------------------- */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
              <div>
                <h1 className="text-2xl font-bold text-white">Product Management</h1>
                <p className="text-xs text-slate-400">Create, edit, view inventory, and delete products</p>
              </div>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Thanh Tìm kiếm & Bộ lọc */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 flex gap-2">
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

              <div className="md:col-span-4 flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-slate-300"
                >
                  <option value="created_at">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50"
                >
                  <ArrowUpDown className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={fetchProducts}
                  className="p-2 bg-slate-900/60 border border-slate-700 rounded-xl hover:bg-slate-700/50"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-300 ${loadingProducts ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Bảng Dữ Liệu Sản Phẩm */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-x-auto shadow-xl">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-700/60">
                  <tr>
                    <th className="p-4 w-16">Picture</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Loading product list...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-800/80 transition">
                        <td className="p-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-contain p-0.5"
                                style={{ objectFit: 'contain' }}
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
                        <td className="p-4 font-medium text-white">{product.name}</td>
                        <td className="p-4 text-emerald-400 font-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                        </td>
                        <td className="p-4 text-slate-300">{product.stock}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
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

              {/* Phân trang */}
              <div className="p-4 bg-slate-900/40 border-t border-slate-700/60 flex justify-between items-center text-xs text-slate-400">
                <span>Total: {pagination.total} products</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>Page {pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
 TAB 2: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (ROLE PERMISSIONS)
 ----------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
              <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-xs text-slate-400">List of accounts and access permissions (Admin / Customer)</p>
              </div>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs rounded-xl"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} /> Reload
              </button>
            </div>

            {/* BỘ LỌC VÀ TÌM KIẾM NGƯỜI DÙNG */}
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row gap-4 items-center justify-between">

              {/* Thanh Tìm Kiếm */}
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name or Email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* NÚT LỌC THEO ROLE (ALL / ADMIN / CUSTOMER) */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 w-full sm:w-auto">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${roleFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  All ({users.length})
                </button>

                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${roleFilter === 'admin'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Admin ({users.filter(u => u.role === 'admin').length})
                </button>

                <button
                  onClick={() => setRoleFilter('customer')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${roleFilter === 'customer'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Customer ({users.filter(u => u.role === 'customer').length})
                </button>
              </div>

            </div>

            {/* Bảng Phân Quyền Người Dùng */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-x-auto shadow-xl">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase border-b border-slate-700/60">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Loading user list...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/80 transition">
                        <td className="p-4 text-xs font-mono text-slate-400">#{user.id}</td>
                        <td className="p-4 font-medium text-white flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                          {user.full_name}
                        </td>
                        <td className="p-4 text-slate-300 text-xs">{user.email}</td>
                        <td className="p-4">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <ShieldAlert className="w-3 h-3" /> ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              <ShieldCheck className="w-3 h-3" /> CUSTOMER
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <select
                            disabled={updatingRoleId === user.id}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.full_name)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="customer">Assign Customer Role</option>
                            <option value="admin">Assign Admin Role</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
 TAB 3: QUẢN LÝ ĐƠN HÀNG (MỚI)
 ----------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
              <div>
                <h1 className="text-2xl font-bold text-white">Order Management</h1>
                <p className="text-xs text-slate-400">View and check all orders in the system</p>
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs rounded-xl"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} /> Reload
              </button>
            </div>

            {/* Bộ lọc đơn hàng */}
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
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

              <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 w-full sm:w-auto">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('CANCELLED')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'CANCELLED'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Cancelled
                </button>
              </div>
            </div>

            {/* Bảng đơn hàng */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-x-auto shadow-xl">
              <table className="w-full min-w-[650px] text-left text-sm">
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
                            onClick={() => handleViewOrderDetail(order.id)}
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
        )}

      </main>

      {/* ===================================================================
 3. MODAL THÊM / SỬA SẢN PHẨM
 =================================================================== */}
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  {editingProduct ? 'Update' : 'Create New'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
 4. MODAL CHI TIẾT ĐƠN HÀNG (MỚI)
 =================================================================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Order Details #{selectedOrder?.id}
              </h2>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {loadingOrderDetail || !selectedOrder ? (
                <div className="py-12 text-center text-slate-400">Loading detail information...</div>
              ) : (
                <div className="space-y-6">

                  {/* Thông tin chung */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs text-slate-400">Customer</p>
                        <p className="font-semibold text-white">User #{selectedOrder.user_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs text-slate-400">Status</p>
                        <div style={{ paddingTop: '5px' }}>{renderStatusBadge(selectedOrder.status)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs text-slate-400">Created At</p>
                        <p className="font-semibold text-white text-xs">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bảng sản phẩm trong đơn */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Product List</h3>
                    <div className="border border-slate-700 rounded-xl overflow-x-auto">
                      <table className="w-full min-w-[500px] text-left text-sm">
                        <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3">Product</th>
                            <th className="py-2.5 px-3 text-center">Quantity</th>
                            <th className="py-2.5 px-3 text-right">Unit Price</th>
                            <th className="py-2.5 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {selectedOrder.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-3 px-3">
                                {/* Hiển thị Tên sản phẩm chính + ID nhỏ ở dưới */}
                                <div className="font-medium text-white">
                                  {item.product_name || `Product #${item.product_id}`}
                                </div>
                                <div className="text-xs text-slate-400">
                                  ID: #{item.product_id}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center text-slate-300">x{item.quantity}</td>
                              <td className="py-3 px-3 text-right text-slate-300">{formatCurrency(item.price)}</td>
                              <td className="py-3 px-3 text-right font-medium text-emerald-400">
                                {formatCurrency(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Tổng tiền */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                    <span className="font-bold text-white">Total Order Amount:</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-xl shadow-sm transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}