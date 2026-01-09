import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThemeToggle } from '../components/ui/Toggle';
import { LanguageSelector } from '../components/LanguageSelector';

export const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      onLogin(data);
    } catch {
      setError(t('auth.invalidCredentials', 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex transition-colors duration-300">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">NestAlbania</h1>
              <p className="text-sm text-white/70">Admin Dashboard</p>
            </div>
          </div>

          {/* Center - Feature highlights */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                {t('auth.welcomeTitle', 'Manage Your Real Estate Platform')}
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-md">
                {t('auth.welcomeSubtitle', 'Access your admin dashboard to manage properties, users, and more.')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-white/70">{t('auth.properties', 'Properties')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">1.2K</div>
                <div className="text-sm text-white/70">{t('auth.users', 'Users')}</div>
              </div>
            </div>
          </div>

          {/* Bottom - Copyright */}
          <div className="text-sm text-white/60">
            © 2026 NestAlbania. {t('auth.allRightsReserved', 'All rights reserved.')}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with theme toggle and language */}
        <div className="flex items-center justify-end gap-2 p-4">
          <ThemeToggle />
          <LanguageSelector />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-lg shadow-primary-500/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">NestAlbania</h1>
              <p className="text-sm text-[var(--text-secondary)]">Admin Dashboard</p>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {t('auth.signIn', 'Sign in')}
              </h2>
              <p className="mt-2 text-[var(--text-secondary)]">
                {t('auth.signInSubtitle', 'Enter your credentials to access the admin panel')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 rounded-xl animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.username', 'Username')}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder', 'Enter your username')}
                icon={User}
                iconPosition="left"
                required
                disabled={loading}
              />

              <Input
                label={t('auth.password', 'Password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                icon={Lock}
                iconPosition="left"
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || !username || !password}
                className="w-full mt-6"
              >
                {loading ? t('auth.signingIn', 'Signing in...') : t('auth.signInButton', 'Sign in')}
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
              {t('auth.needHelp', 'Need help?')}{' '}
              <a href="mailto:support@restate.al" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.contactSupport', 'Contact Support')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;