import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './contexts/ThemeContext';

// i18n
import './i18n';

// Pages
import { DashboardPage } from './pages/Dashboard';
import { PropertiesPage } from './pages/Properties';
import { UsersPage } from './pages/Users';
import { LoginPage } from './pages/Login';
import AdminFeedbackManager from './pages/Feedback';
import AdminCommunityManager from './pages/Community';
import { PropertyDetailPage } from './pages/PropertyDetails';
import AgentRequestsPage from './pages/AgentRequest';
import { SettingsPage } from './pages/Settings';
import { BlogPage } from './pages/Blog';
import { HelpCenterPage } from './pages/HelpCenter';
import { PropertyCreatePage } from './pages/PropertyCreate';
import { ChatPage } from './pages/Chat';

// Layout Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastProvider } from './components/Toast';

function AppContent() {
  const { auth, login, logout } = useAuthStore();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showPropertyCreate, setShowPropertyCreate] = useState(false);
  const [propertiesRefreshKey, setPropertiesRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  // Listen for sidebar collapse changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };

    // Check periodically for changes (since storage event doesn't fire in same window)
    const interval = setInterval(handleStorageChange, 100);
    return () => clearInterval(interval);
  }, []);

  // If user is not logged in show login page
  if (!auth) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={logout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        userRole={auth?.role || auth?.Role}
      />

      {/* Main Content Container */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Navbar
          onMenuClick={() => setIsMobileOpen(true)}
          user={auth.user || auth}
          onLogout={logout}
          token={auth.accessToken}
        />

        <main className="p-6">
          {selectedPropertyId ? (
            <PropertyDetailPage
              propertyId={selectedPropertyId}
              token={auth.accessToken}
              onBack={() => setSelectedPropertyId(null)}
            />
          ) : (
            <>
              {activePage === 'dashboard' && <DashboardPage token={auth.accessToken} auth={auth} />}
              {activePage === 'properties' && (
                <PropertiesPage
                  key={propertiesRefreshKey}
                  token={auth.accessToken}
                  onViewProperty={setSelectedPropertyId}
                  onCreateProperty={() => setShowPropertyCreate(true)}
                />
              )}
              {activePage === 'users' && <UsersPage token={auth.accessToken} userRole={auth?.role || auth?.Role} />}
              {activePage === 'feedback' && <AdminFeedbackManager token={auth.accessToken} />}
              {activePage === 'community' && <AdminCommunityManager token={auth.accessToken} />}
              {activePage === 'agentrequest' && <AgentRequestsPage token={auth.accessToken} />}
              {activePage === 'blog' && <BlogPage token={auth.accessToken} />}
              {activePage === 'helpcenter' && <HelpCenterPage token={auth.accessToken} />}
              {activePage === 'chat' && <ChatPage token={auth.accessToken} />}
              {activePage === 'settings' && <SettingsPage token={auth.accessToken} user={auth.user || auth} />}
            </>
          )}

          {/* Property Create Modal */}
          {showPropertyCreate && (
            <PropertyCreatePage
              token={auth.accessToken}
              onBack={() => setShowPropertyCreate(false)}
              onSuccess={() => {
                setShowPropertyCreate(false);
                setPropertiesRefreshKey(prev => prev + 1);
                setActivePage('properties');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}