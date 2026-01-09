import { useState } from 'react';

export const useAuthStore = () => {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('admin_auth');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (authData) => {
    localStorage.setItem('admin_auth', JSON.stringify(authData));
    setAuth(authData);
  };

  const logout = () => {
    localStorage.removeItem('admin_auth');
    setAuth(null);
  };

  // Helper to check if user is CityAdmin
  const isCityAdmin = auth?.role === 'CityAdmin';

  // Helper to check if user is full Admin
  const isAdmin = auth?.role === 'Admin';

  // Get the city for CityAdmin
  const adminCity = auth?.city || null;

  return { auth, login, logout, isCityAdmin, isAdmin, adminCity };
};