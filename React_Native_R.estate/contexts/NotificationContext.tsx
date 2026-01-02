import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/axios-config';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  decrementCount: () => void;
  setCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get('/api/notifications/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error: any) {
      console.log('Notification count fetch error:', error.message);
      setUnreadCount(0);
    }
  };

  const refreshCount = async () => {
    await fetchUnreadCount();
  };

  const decrementCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const setCount = (count: number) => {
    setUnreadCount(Math.max(0, count));
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll every 5 seconds for real-time notification updates
    if (isAuthenticated) {
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refreshCount, decrementCount, setCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
