import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';

import Navbar from './components/common/Navbar';
import AuthScreen from './components/auth/AuthScreen';
import ProfilePage from './components/profile/ProfilePage';
import CustomerStorefront from './components/customer/CustomerStorefront';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState('main'); // 'main' | 'profile'

  const handleUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveView('main');
    toast.info('👋 Logged out of account successfully');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {!user ? (
        <AuthScreen onLoginSuccess={(loggedUser) => setUser(loggedUser)} />
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            user={user}
            activeView={activeView}
            setActiveView={setActiveView}
            onLogout={handleLogout}
          />

          {/* Main View Router */}
          <div className="flex-1">
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
          </div>
        </>
      )}
    </div>
  );
}