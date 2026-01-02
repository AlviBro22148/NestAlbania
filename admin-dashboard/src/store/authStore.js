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

  return { auth, login, logout };
};