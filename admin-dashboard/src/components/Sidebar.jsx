import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home, Users, Building2, LogOut, X, MessageSquare,
  Globe, UserCheck, Settings, FileText, HelpCircle, MessagesSquare,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { SidebarTooltip } from './ui/Tooltip';

export const Sidebar = ({
  activePage,
  setActivePage,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
  userRole
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const isCityAdmin = userRole === 'CityAdmin';

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  // Define all menu groups
  const allMenuGroups = [
    {
      label: t('sidebar.main', 'Main'),
      items: [
        { id: 'dashboard', icon: Home, label: t('sidebar.dashboard') },
        { id: 'properties', icon: Building2, label: t('sidebar.properties') },
        { id: 'users', icon: Users, label: t('sidebar.users') },
      ],
    },
    {
      label: t('sidebar.management', 'Management'),
      items: [
        { id: 'feedback', icon: MessageSquare, label: t('sidebar.feedback') },
        { id: 'community', icon: Globe, label: t('sidebar.community') },
        { id: 'agentrequest', icon: UserCheck, label: t('sidebar.agentRequests') },
      ],
      adminOnly: true, // Hide from CityAdmin
    },
    {
      label: t('sidebar.content', 'Content'),
      items: [
        { id: 'blog', icon: FileText, label: t('sidebar.blog') },
        { id: 'helpcenter', icon: HelpCircle, label: t('sidebar.helpCenter') },
      ],
      adminOnly: true, // Hide from CityAdmin
    },
    {
      label: t('sidebar.other', 'Other'),
      items: [
        { id: 'chat', icon: MessagesSquare, label: t('sidebar.chat'), adminOnly: true },
        { id: 'settings', icon: Settings, label: t('sidebar.settings') },
      ],
    },
  ];

  // Filter menu groups for CityAdmin
  const menuGroups = isCityAdmin
    ? allMenuGroups
        .filter(group => !group.adminOnly)
        .map(group => ({
          ...group,
          items: group.items.filter(item => !item.adminOnly)
        }))
    : allMenuGroups;

  const NavItem = ({ item }) => {
    const isActive = activePage === item.id;

    const content = (
      <button
        onClick={() => {
          setActivePage(item.id);
          setIsMobileOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 group
          ${isActive
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
        {!isCollapsed && (
          <span className="text-sm font-medium truncate">{item.label}</span>
        )}
      </button>
    );

    if (isCollapsed) {
      return (
        <SidebarTooltip content={item.label} show={isCollapsed}>
          {content}
        </SidebarTooltip>
      );
    }

    return content;
  };

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-[var(--sidebar-bg)] border-r border-[var(--border-primary)]/10
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarWidth}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className={`p-4 border-b border-white/5 ${isCollapsed ? 'px-2' : ''}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">NestAlbania</h1>
                  <p className="text-xs text-[var(--sidebar-text-muted)]">Admin Panel</p>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg text-[var(--sidebar-text-muted)] hover:text-white hover:bg-[var(--sidebar-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-text-muted)]/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-white/5 ${isCollapsed ? 'px-2' : ''}`}>
          {/* Collapse Toggle - Desktop Only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="
              hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2.5
              text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]
              hover:bg-[var(--sidebar-hover)] rounded-xl
              transition-all duration-200 mb-3
            "
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">{t('sidebar.collapse', 'Collapse')}</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <SidebarTooltip content={t('sidebar.logout')} show={isCollapsed}>
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-[var(--sidebar-text-muted)] hover:text-error-400 hover:bg-error-500/10
                transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{t('sidebar.logout')}</span>
              )}
            </button>
          </SidebarTooltip>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
