import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Crown, AlertTriangle, Ban, ShieldCheck, Users, UserCheck, UserX, Download, Mail, Phone, Calendar, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { SearchInput, Textarea } from '../components/ui/Input';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { ActionsDropdown } from '../components/ui/Dropdown';
import { Select } from '../components/ui/Select';

export const UsersPage = ({ token }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers(token);
      setUsers(data);
    } catch {
      toast.error(t('users.loadError', 'Failed to load users. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower);
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && !user.isBanned) ||
      (statusFilter === 'banned' && user.isBanned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handlePromoteClick = (user) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };

  const handleBanClick = (user) => {
    setSelectedUser(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const handleUnbanClick = (user) => {
    setSelectedUser(user);
    setShowUnbanModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await api.deleteUser(token, selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success(t('users.deleteSuccess', 'User deleted successfully!'));
    } catch {
      toast.error(t('users.deleteError', 'Failed to delete user. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const handlePromoteConfirm = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await api.promoteToAdmin(token, selectedUser.id);
      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, role: 'Admin' } : u
      ));
      setShowPromoteModal(false);
      setSelectedUser(null);
      toast.success(t('users.promoteSuccess', 'User promoted to administrator successfully!'));
    } catch {
      toast.error(t('users.promoteError', 'Failed to promote user. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleBanConfirm = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await api.banUser(token, selectedUser.id, banReason || null);
      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, isBanned: true, banReason: banReason || t('users.defaultBanReason', 'Terms of service violation') } : u
      ));
      setShowBanModal(false);
      setSelectedUser(null);
      setBanReason('');
      toast.success(t('users.banSuccess', 'User banned successfully!'));
    } catch {
      toast.error(t('users.banError', 'Failed to ban user. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbanConfirm = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await api.unbanUser(token, selectedUser.id);
      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, isBanned: false, banReason: null } : u
      ));
      setShowUnbanModal(false);
      setSelectedUser(null);
      toast.success(t('users.unbanSuccess', 'User unbanned successfully!'));
    } catch {
      toast.error(t('users.unbanError', 'Failed to unban user. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowPromoteModal(false);
    setShowBanModal(false);
    setShowUnbanModal(false);
    setSelectedUser(null);
    setBanReason('');
  };

  const getUserActions = (user) => {
    const actions = [];

    if (user.role !== 'Admin' && !user.isBanned) {
      actions.push({
        label: t('users.promoteToAdmin', 'Promote to Admin'),
        icon: Crown,
        onClick: () => handlePromoteClick(user),
      });
    }

    if (user.role !== 'Admin') {
      if (user.isBanned) {
        actions.push({
          label: t('users.unban', 'Unban User'),
          icon: ShieldCheck,
          onClick: () => handleUnbanClick(user),
        });
      } else {
        actions.push({
          label: t('users.ban', 'Ban User'),
          icon: Ban,
          onClick: () => handleBanClick(user),
        });
      }

      actions.push({ type: 'divider' });

      actions.push({
        label: t('users.delete', 'Delete User'),
        icon: Trash2,
        onClick: () => handleDeleteClick(user),
        danger: true,
      });
    }

    return actions;
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Admin': return 'purple';
      case 'Agent': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'Admin': return t('users.roleAdmin', 'Administrator');
      case 'Agent': return t('users.roleAgent', 'Agent');
      default: return t('users.roleUser', 'User');
    }
  };

  const roleOptions = [
    { value: '', label: t('users.allRoles', 'All Roles') },
    { value: 'Admin', label: t('users.roleAdmin', 'Administrator') },
    { value: 'Agent', label: t('users.roleAgent', 'Agent') },
    { value: 'User', label: t('users.roleUser', 'User') },
  ];

  const statusOptions = [
    { value: '', label: t('users.allStatuses', 'All Statuses') },
    { value: 'active', label: t('users.statusActive', 'Active') },
    { value: 'banned', label: t('users.statusBanned', 'Banned') },
  ];

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.warning(t('users.noUsersToExport', 'No users to export'));
      return;
    }

    const headers = ['Username', 'Email', 'Phone', 'Role', 'Status', 'Properties', 'Created At'];
    const rows = filteredUsers.map(u => [
      `"${u.username}"`,
      `"${u.email}"`,
      `"${u.phoneNumber || ''}"`,
      u.role,
      u.isBanned ? 'Banned' : 'Active',
      u.propertyCount || 0,
      new Date(u.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Create filename with filters applied
    let filename = 'users';
    if (roleFilter) filename += `_${roleFilter.toLowerCase()}`;
    if (statusFilter) filename += `_${statusFilter}`;
    if (searchQuery) filename += `_search`;
    filename += `_${new Date().toISOString().split('T')[0]}.csv`;

    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('users.exportSuccess', `${filteredUsers.length} users exported successfully`));
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.isBanned).length;
  const bannedUsers = users.filter(u => u.isBanned).length;
  const adminUsers = users.filter(u => u.role === 'Admin').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('users.title', 'User Management')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {t('users.subtitle', 'Manage all registered users')}
          </p>
        </div>
        <Button variant="outline" icon={Download} onClick={handleExportCSV}>
          {t('users.export', 'Export CSV')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-200 dark:border-primary-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalUsers}</p>
                <p className="text-sm text-[var(--text-secondary)]">{t('users.totalUsers', 'Total Users')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success-500/10 to-success-600/5 border-success-200 dark:border-success-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
                <UserCheck className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{activeUsers}</p>
                <p className="text-sm text-[var(--text-secondary)]">{t('users.activeUsers', 'Active Users')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-error-500/10 to-error-600/5 border-error-200 dark:border-error-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error-100 dark:bg-error-900/30">
                <UserX className="w-5 h-5 text-error-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{bannedUsers}</p>
                <p className="text-sm text-[var(--text-secondary)]">{t('users.bannedUsers', 'Banned Users')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{adminUsers}</p>
                <p className="text-sm text-[var(--text-secondary)]">{t('users.adminUsers', 'Administrators')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('users.searchPlaceholder', 'Search by name, email, or role...')}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-40"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.user', 'User')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.contact', 'Contact')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.role', 'Role')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.status', 'Status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.properties', 'Properties')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.registered', 'Registered')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('users.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[var(--text-secondary)] font-medium">
                          {t('users.noUsers', 'No users found')}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                          {searchQuery
                            ? t('users.noUsersSearch', 'No users match "{{query}}"', { query: searchQuery })
                            : t('users.noUsersHint', 'Try adjusting your filters')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`
                        hover:bg-[var(--bg-hover)] transition-colors animate-fade-in
                        ${user.isBanned ? 'bg-error-50/50 dark:bg-error-900/10' : ''}
                      `}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={user.username}
                            src={user.profilePicture}
                            size="md"
                            status={user.isBanned ? 'offline' : 'online'}
                          />
                          <span className={`font-medium ${user.isBanned ? 'text-error-600 line-through' : 'text-[var(--text-primary)]'}`}>
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                          {user.phoneNumber && (
                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phoneNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="inline-flex items-center gap-1">
                          {user.role === 'Admin' && <Crown className="w-3 h-3" />}
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.isBanned ? (
                          <StatusBadge status="error" className="inline-flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            {t('users.banned', 'Banned')}
                          </StatusBadge>
                        ) : (
                          <StatusBadge status="success" className="inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t('users.active', 'Active')}
                          </StatusBadge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <Building2 className="w-4 h-4" />
                          <span>{user.propertyCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          {getUserActions(user).length > 0 && (
                            <ActionsDropdown items={getUserActions(user)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeModals}
        title={t('users.deleteTitle', 'Delete User')}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-xl border border-error-200 dark:border-error-800">
            <div className="p-3 bg-error-100 dark:bg-error-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {t('users.deleteWarning', 'This action cannot be undone')}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('users.deleteDescription', 'The user and all their data will be permanently removed.')}
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <Avatar name={selectedUser.username} size="md" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{selectedUser.username}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={closeModals} disabled={processing} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={processing} className="flex-1">
              {t('users.deleteConfirm', 'Delete User')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Promote Confirmation Modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={closeModals}
        title={t('users.promoteTitle', 'Promote to Administrator')}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {t('users.promoteWarning', 'Grant administrator privileges')}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('users.promoteDescription', 'This user will have full access to the admin dashboard.')}
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <Avatar name={selectedUser.username} size="md" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{selectedUser.username}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={closeModals} disabled={processing} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handlePromoteConfirm} loading={processing} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {t('users.promoteConfirm', 'Promote to Admin')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ban Confirmation Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={closeModals}
        title={t('users.banTitle', 'Ban User')}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800">
            <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
              <Ban className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {t('users.banWarning', 'Restrict user access')}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('users.banDescription', 'This user will no longer be able to access the application.')}
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <Avatar name={selectedUser.username} size="md" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{selectedUser.username}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
              </div>
            </div>
          )}

          <Textarea
            label={t('users.banReasonLabel', 'Ban Reason (optional)')}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder={t('users.banReasonPlaceholder', 'Enter the reason for banning this user...')}
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={closeModals} disabled={processing} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="warning" onClick={handleBanConfirm} loading={processing} className="flex-1">
              {t('users.banConfirm', 'Ban User')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unban Confirmation Modal */}
      <Modal
        isOpen={showUnbanModal}
        onClose={closeModals}
        title={t('users.unbanTitle', 'Unban User')}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800">
            <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {t('users.unbanWarning', 'Restore user access')}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('users.unbanDescription', 'This user will be able to access the application again.')}
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <Avatar name={selectedUser.username} size="md" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{selectedUser.username}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
              </div>
            </div>
          )}

          {selectedUser?.banReason && (
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <p className="text-sm text-[var(--text-muted)] mb-1">{t('users.previousBanReason', 'Previous ban reason')}:</p>
              <p className="text-sm text-[var(--text-secondary)]">{selectedUser.banReason}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={closeModals} disabled={processing} className="flex-1">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="success" onClick={handleUnbanConfirm} loading={processing} className="flex-1">
              {t('users.unbanConfirm', 'Unban User')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
