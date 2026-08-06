import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL, getAuthHeaders } from '../../config';

export default function ProfilePage({ user, onBack, onUserUpdate }) {
  const [profile, setProfile] = useState(user);
  const [nameForm, setNameForm] = useState({ full_name: user?.full_name || '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
                value={user?.email || profile?.email || ''}
                readOnly
                autoComplete="username"
                className="hidden"
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
