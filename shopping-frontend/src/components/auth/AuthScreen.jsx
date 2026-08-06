import React, { useState } from 'react';
import { ShoppingBag, User, Mail, Key, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';

export default function AuthScreen({ onLoginSuccess }) {
  // mode: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState('login');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    token: '',
    new_password: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode) => {
    setAuthMode(newMode);
    setFieldErrors({});
    setGeneralError('');
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Please enter your email';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Invalid email format (Ex: example@gmail.com)';
    }

    if (authMode === 'register') {
      if (!formData.full_name.trim()) {
        errors.full_name = 'Please enter your full name';
      } else if (formData.full_name.trim().length < 2) {
        errors.full_name = 'Full name must be at least 2 characters long';
      }
    }

    if (authMode === 'login' || authMode === 'register') {
      if (!formData.password) {
        errors.password = 'Please enter your password';
      } else if (authMode === 'register' && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
    }

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
    return Object.keys(errors).length === 0;
  };

  const handleBackendErrors = (data) => {
    if (data.details && typeof data.details === 'object') {
      const mappedErrors = {};
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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (!validateForm()) return;

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
      toast.success(`🎉 Your OTP verification code is: ${otpCode}`);
      switchMode('reset');
    } catch (err) {
      setGeneralError('System error while sending recovery request.');
    } finally {
      setLoading(false);
    }
  };

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

        {generalError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs text-center font-medium">
            {generalError}
          </div>
        )}

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
