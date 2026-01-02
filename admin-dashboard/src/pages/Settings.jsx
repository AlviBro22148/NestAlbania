import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Lock, Bell, Shield, Save, Palette, Globe, Monitor, Moon, Sun } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

export const SettingsPage = ({ token, user }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newPropertyAlerts: true,
    userRegistrationAlerts: true,
    feedbackAlerts: true,
    agentRequestAlerts: true
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast.success(t('settings.profileUpdated', 'Profile updated successfully!'));
    } catch {
      toast.error(t('settings.profileUpdateError', 'Failed to update profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordMismatch', 'New passwords do not match'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('settings.passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    setLoading(true);
    try {
      toast.success(t('settings.passwordChanged', 'Password changed successfully!'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error(t('settings.passwordChangeError', 'Failed to change password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      toast.success(t('settings.notificationsSaved', 'Notification preferences saved!'));
    } catch {
      toast.error(t('settings.notificationsSaveError', 'Failed to save preferences. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: t('settings.tabs.profile', 'Profile') },
    { id: 'security', icon: Lock, label: t('settings.tabs.security', 'Security') },
    { id: 'notifications', icon: Bell, label: t('settings.tabs.notifications', 'Notifications') },
    { id: 'appearance', icon: Palette, label: t('settings.tabs.appearance', 'Appearance') }
  ];

  const notificationItems = [
    {
      key: 'emailNotifications',
      label: t('settings.notifications.email', 'Email Notifications'),
      description: t('settings.notifications.emailDesc', 'Receive email notifications for important updates')
    },
    {
      key: 'newPropertyAlerts',
      label: t('settings.notifications.newProperty', 'New Property Alerts'),
      description: t('settings.notifications.newPropertyDesc', 'Get notified when new properties are listed')
    },
    {
      key: 'userRegistrationAlerts',
      label: t('settings.notifications.newUser', 'New User Registration'),
      description: t('settings.notifications.newUserDesc', 'Get notified when new users register')
    },
    {
      key: 'feedbackAlerts',
      label: t('settings.notifications.feedback', 'Feedback Alerts'),
      description: t('settings.notifications.feedbackDesc', 'Get notified when new feedback is submitted')
    },
    {
      key: 'agentRequestAlerts',
      label: t('settings.notifications.agentRequest', 'Agent Request Alerts'),
      description: t('settings.notifications.agentRequestDesc', 'Get notified when new agent requests are submitted')
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {t('settings.subtitle', 'Manage your account settings and preferences')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <Card className="lg:w-64 flex-shrink-0">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                    ${activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('settings.profile.title', 'Profile Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-xl">
                  <Avatar
                    name={profileForm.username}
                    src={user?.profilePicture}
                    size="xl"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {profileForm.username}
                    </h3>
                    <Badge variant="purple" className="mt-1">
                      {user?.role || 'Administrator'}
                    </Badge>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('settings.profile.username', 'Username')}
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      icon={User}
                    />
                    <Input
                      label={t('settings.profile.email', 'Email Address')}
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                    <Input
                      label={t('settings.profile.phone', 'Phone Number')}
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[var(--border-primary)]">
                    <Button type="submit" loading={loading} icon={Save}>
                      {t('settings.saveChanges', 'Save Changes')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('settings.security.title', 'Security Settings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Lock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)]">
                      {t('settings.security.changePassword', 'Change Password')}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t('settings.security.changePasswordDesc', 'Update your password to keep your account secure')}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <Input
                    label={t('settings.security.currentPassword', 'Current Password')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    icon={Lock}
                    showPasswordToggle
                    onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
                    showPassword={showCurrentPassword}
                  />
                  <Input
                    label={t('settings.security.newPassword', 'New Password')}
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    icon={Lock}
                    showPasswordToggle
                    onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                    showPassword={showNewPassword}
                    hint={t('settings.security.passwordHint', 'Must be at least 8 characters')}
                  />
                  <Input
                    label={t('settings.security.confirmPassword', 'Confirm New Password')}
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    icon={Lock}
                  />

                  <div className="flex justify-end pt-4 border-t border-[var(--border-primary)]">
                    <Button type="submit" loading={loading} icon={Lock}>
                      {t('settings.security.updatePassword', 'Update Password')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('settings.notifications.title', 'Notification Preferences')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[var(--text-secondary)]">
                  {t('settings.notifications.description', 'Choose which notifications you want to receive')}
                </p>

                <div className="space-y-3">
                  {notificationItems.map((item) => (
                    <div
                      key={item.key}
                      className={`
                        flex items-center justify-between p-4 rounded-xl border transition-colors
                        ${notifications[item.key]
                          ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                        }
                      `}
                    >
                      <div>
                        <p className={`font-medium ${notifications[item.key] ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-primary)]'}`}>
                          {item.label}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
                      </div>
                      <Toggle
                        checked={notifications[item.key]}
                        onChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-[var(--border-primary)]">
                  <Button onClick={handleNotificationUpdate} loading={loading} icon={Save}>
                    {t('settings.savePreferences', 'Save Preferences')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {t('settings.appearance.title', 'Appearance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-[var(--text-secondary)]">
                  {t('settings.appearance.description', 'Customize how the dashboard looks and feels')}
                </p>

                {/* Theme Selection */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {t('settings.appearance.theme', 'Theme')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', icon: Sun, label: t('settings.appearance.light', 'Light') },
                      { id: 'dark', icon: Moon, label: t('settings.appearance.dark', 'Dark') },
                      { id: 'system', icon: Monitor, label: t('settings.appearance.system', 'System') },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={`
                          flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all
                          ${theme === option.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20'
                            : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:border-primary-300 hover:bg-[var(--bg-hover)]'
                          }
                        `}
                      >
                        <div className={`
                          p-4 rounded-xl
                          ${theme === option.id
                            ? 'bg-primary-100 dark:bg-primary-900/40'
                            : 'bg-[var(--bg-card)]'
                          }
                        `}>
                          <option.icon className={`w-8 h-8 ${theme === option.id ? 'text-primary-600' : 'text-[var(--text-muted)]'}`} />
                        </div>
                        <span className={`font-medium ${theme === option.id ? 'text-primary-600' : 'text-[var(--text-secondary)]'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {t('settings.appearance.preview', 'Preview')}
                  </h4>
                  <div className="p-6 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">NestAlbania</p>
                        <p className="text-sm text-[var(--text-secondary)]">Admin Dashboard</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg">
                        <div className="h-2 w-8 bg-primary-500 rounded mb-2"></div>
                        <div className="h-2 w-12 bg-[var(--border-primary)] rounded"></div>
                      </div>
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg">
                        <div className="h-2 w-10 bg-success-500 rounded mb-2"></div>
                        <div className="h-2 w-8 bg-[var(--border-primary)] rounded"></div>
                      </div>
                      <div className="p-3 bg-[var(--bg-card)] rounded-lg">
                        <div className="h-2 w-6 bg-warning-500 rounded mb-2"></div>
                        <div className="h-2 w-14 bg-[var(--border-primary)] rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
