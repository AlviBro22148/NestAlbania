import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, User, LogOut, ChevronDown, Bell, Check, Trash2, X, Search } from 'lucide-react';
import { api } from '../services/api';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ui/Toggle';
import { Avatar } from './ui/Avatar';
import { Spinner } from './ui/ProgressBar';

export const Navbar = ({ onMenuClick, user, onLogout, token, activePage }) => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread count on mount and periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getUnreadCount(token);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getNotifications(token);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(token, notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead(token);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.deleteNotification(token, notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NewAgentRequest': return '👤';
      case 'NewFeedback': return '📝';
      case 'AgentRequestApproved': return '✅';
      case 'AgentRequestRejected': return '❌';
      case 'FeedbackResolved': return '🎉';
      case 'PriceChange': return '💰';
      case 'StatusChange': return '🔔';
      case 'NewProperty': return '🏠';
      default: return '📬';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('time.now', 'Just now');
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('time.minAgo', 'min ago')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('time.hoursAgo', 'hours ago')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${t('time.daysAgo', 'days ago')}`;
    return date.toLocaleDateString();
  };

  const getDisplayName = () => {
    if (!user) return 'Administrator';
    return user.username || user.email || 'Administrator';
  };

  return (
    <header
      className={`
        sticky top-0 z-30
        bg-[var(--bg-card)]/80 backdrop-blur-md
        border-b border-[var(--border-primary)]
        transition-all duration-200
        ${isScrolled ? 'shadow-md' : ''}
      `}
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Side - Mobile Menu & Search */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t('navbar.search', 'Search...')}
                className="
                  w-64 pl-10 pr-4 py-2 text-sm
                  bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                  border border-transparent rounded-lg
                  placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                  transition-all duration-200
                "
              />
            </div>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle size="md" />

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setDropdownOpen(false);
              }}
              className={`
                relative p-2 rounded-lg transition-all duration-200
                ${notificationsOpen
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-shake' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-error-500 rounded-full animate-pulse-soft">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-primary)] z-20 max-h-[480px] overflow-hidden flex flex-col animate-fade-in-down">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {t('navbar.notifications', 'Notifications')}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                          {unreadCount} {t('navbar.new', 'new')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {t('navbar.markAllRead', 'Mark all read')}
                        </button>
                      )}
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto flex-1">
                    {loading ? (
                      <div className="p-8 flex justify-center">
                        <Spinner size="lg" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                          <Bell className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[var(--text-secondary)]">
                          {t('navbar.noNotifications', 'No notifications yet')}
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`
                            px-4 py-3 border-b border-[var(--border-primary)] last:border-0
                            transition-colors hover:bg-[var(--bg-hover)]
                            ${!notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''} text-[var(--text-primary)]`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-[var(--text-muted)]">
                                  {getTimeAgo(notification.createdAt)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification.id);
                                      }}
                                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                                      title={t('navbar.markAsRead', 'Mark as read')}
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(notification.id);
                                    }}
                                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                                    title={t('navbar.delete', 'Delete')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 10 && (
                    <div className="px-4 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-center">
                      <span className="text-xs text-[var(--text-muted)]">
                        {t('navbar.showingNotifications', 'Showing 10 of {{count}} notifications', { count: notifications.length })}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Divider */}
          <div className="hidden md:block h-6 w-px bg-[var(--border-primary)]" />

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setNotificationsOpen(false);
              }}
              className={`
                flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-200
                ${dropdownOpen
                  ? 'bg-[var(--bg-hover)]'
                  : 'hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              <Avatar
                name={getDisplayName()}
                src={user?.profilePicture}
                size="sm"
                status="online"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <ChevronDown
                className={`
                  hidden md:block w-4 h-4 text-[var(--text-muted)]
                  transition-transform duration-200
                  ${dropdownOpen ? 'rotate-180' : ''}
                `}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-primary)] py-2 z-20 animate-fade-in-down">
                  <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{getDisplayName()}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || 'admin@restate.com'}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('navbar.profile', 'Profile')}
                    </button>
                  </div>

                  <div className="border-t border-[var(--border-primary)] py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navbar.logout', 'Logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
