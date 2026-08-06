import React from 'react';
import { Search, UserCheck, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';

export default function UserManagement({
  users,
  loadingUsers,
  userSearch,
  setUserSearch,
  roleFilter,
  setRoleFilter,
  updatingRoleId,
  onFetchUsers,
  onRoleChange
}) {
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/40 p-4 sm:p-6 rounded-2xl border border-slate-700/50 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>
          <p className="text-xs text-slate-400">List of accounts and access permissions (Admin / Customer)</p>
        </div>
        <button
          onClick={onFetchUsers}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs text-slate-200 rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} /> Reload
        </button>
      </div>

      {/* BỘ LỌC VÀ TÌM KIẾM NGƯỜI DÙNG */}
      <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
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
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              roleFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({users.length})
          </button>

          <button
            onClick={() => setRoleFilter('admin')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin ({users.filter(u => u.role === 'admin').length})
          </button>

          <button
            onClick={() => setRoleFilter('customer')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              roleFilter === 'customer'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Customer ({users.filter(u => u.role === 'customer').length})
          </button>
        </div>
      </div>

      {/* DANH SÁCH NGƯỜI DÙNG */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        
        {/* 📱 MOBILE VIEW: Dạng Card Thẻ (Hiển thị khi dưới màn hình md) */}
        <div className="block md:hidden divide-y divide-slate-700/50">
          {loadingUsers ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading user list...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-3 hover:bg-slate-800/80 transition">
                {/* Dòng 1: ID, Tên & Current Role Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <h3 className="font-medium text-white text-xs truncate">{user.full_name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">#{user.id}</span>
                    </div>
                  </div>

                  {user.role === 'admin' ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ShieldAlert className="w-3 h-3" /> ADMIN
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <ShieldCheck className="w-3 h-3" /> CUSTOMER
                    </span>
                  )}
                </div>

                {/* Dòng 2: Email */}
                <div className="text-xs text-slate-400 truncate">
                  <span className="text-slate-500">Email:</span> {user.email}
                </div>

                {/* Dòng 3: Select Box đổi Role */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Change Role:</span>
                  <select
                    disabled={updatingRoleId === user.id}
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value, user.full_name)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="customer">Assign Customer Role</option>
                    <option value="admin">Assign Admin Role</option>
                  </select>
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
                <th className="p-4 w-16">ID</th>
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
                      <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{user.full_name}</span>
                    </td>
                    <td className="p-4 text-slate-300 text-xs truncate max-w-[200px]">{user.email}</td>
                    <td className="p-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
                          <ShieldAlert className="w-3 h-3" /> ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                          <ShieldCheck className="w-3 h-3" /> CUSTOMER
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        disabled={updatingRoleId === user.id}
                        value={user.role}
                        onChange={(e) => onRoleChange(user.id, e.target.value, user.full_name)}
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
    </div>
  );
}