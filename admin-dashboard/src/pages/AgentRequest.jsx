import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle, XCircle, Clock, User, Mail, Phone,
  Calendar, Trash2, AlertCircle, UserCheck, Users
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent, StatsCard } from '../components/ui/Card';
import { SearchInput, Textarea } from '../components/ui/Input';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

const AgentRequestsPage = ({ token }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const filters = [
    { key: 'All', label: t('agentRequests.filters.all', 'All'), icon: Users },
    { key: 'Pending', label: t('agentRequests.filters.pending', 'Pending'), icon: Clock },
    { key: 'Approved', label: t('agentRequests.filters.approved', 'Approved'), icon: CheckCircle },
    { key: 'Rejected', label: t('agentRequests.filters.rejected', 'Rejected'), icon: XCircle }
  ];

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [filter, token]);

  const fetchData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [requestsData, statsData] = await Promise.all([
        api.getAgentRequests(token, filter === 'All' ? null : filter),
        api.getAgentRequestStats(token)
      ]);
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('agentRequests.errors.loadFailed', 'Failed to load agent requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      await api.approveAgentRequest(token, selectedRequest.id);
      toast.success(t('agentRequests.approved', 'Agent request approved! User has been notified.'));
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t('agentRequests.errors.approveFailed', 'Failed to approve request'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning(t('agentRequests.errors.reasonRequired', 'Please provide a reason for rejection'));
      return;
    }

    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      await api.rejectAgentRequest(token, selectedRequest.id, rejectReason);
      toast.success(t('agentRequests.rejected', 'Agent request rejected. User has been notified.'));
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('agentRequests.errors.rejectFailed', 'Failed to reject request'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      await api.deleteAgentRequest(token, selectedRequest.id);
      toast.success(t('agentRequests.deleted', 'Request deleted successfully'));
      setShowDeleteModal(false);
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(t('agentRequests.errors.deleteFailed', 'Failed to delete request'));
    } finally {
      setProcessingId(null);
    }
  };

  const getFilteredRequests = () => {
    let filtered = requests;

    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <UserCheck className="w-6 h-6 text-primary-600" />
          </div>
          {t('agentRequests.title', 'Agent Requests')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {t('agentRequests.subtitle', 'Review and manage agent role requests')}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('agentRequests.stats.total', 'Total Requests')}
            value={stats.total}
            icon={Users}
            gradient="primary"
          />
          <StatsCard
            title={t('agentRequests.stats.pending', 'Pending Review')}
            value={stats.pending}
            icon={Clock}
            gradient="warning"
          />
          <StatsCard
            title={t('agentRequests.stats.approved', 'Approved')}
            value={stats.approved}
            icon={CheckCircle}
            gradient="success"
          />
          <StatsCard
            title={t('agentRequests.stats.rejected', 'Rejected')}
            value={stats.rejected}
            icon={XCircle}
            gradient="error"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((status) => (
                <button
                  key={status.key}
                  onClick={() => setFilter(status.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === status.key
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <status.icon className="w-4 h-4" />
                  {status.label}
                  {status.key !== 'All' && stats && (
                    <span className="ml-1 text-xs opacity-80">
                      ({stats[status.key.toLowerCase()]})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1">
              <SearchInput
                placeholder={t('agentRequests.searchPlaceholder', 'Search by name or email...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <User className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {t('agentRequests.noRequests', 'No Requests Found')}
            </h3>
            <p className="text-[var(--text-secondary)]">
              {filter === 'Pending'
                ? t('agentRequests.noRequestsPending', 'All agent requests have been reviewed!')
                : searchQuery
                  ? t('agentRequests.noRequestsSearch', 'No requests match your search.')
                  : t('agentRequests.noRequestsFilter', 'No requests in this category.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={request.username}
                      src={request.userProfilePicture}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                        {request.username}
                      </h3>
                      <StatusBadge status={request.status.toLowerCase()} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Mail className="w-4 h-4" />
                    <span>{request.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Phone className="w-4 h-4" />
                    <span>{request.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Calendar className="w-4 h-4" />
                    <span>{t('agentRequests.requestedAt', 'Requested')}: {formatDate(request.requestedAt)}</span>
                  </div>
                </div>

                {request.status === 'Approved' && request.reviewedAt && (
                  <div className="p-3 mb-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                    <p className="text-sm text-success-700 dark:text-success-300">
                      ✓ {t('agentRequests.approvedAt', 'Approved on')} {new Date(request.reviewedAt).toLocaleDateString('sq-AL')}
                      {request.reviewedBy && ` ${t('agentRequests.by', 'by')} ${request.reviewedBy}`}
                    </p>
                  </div>
                )}

                {request.status === 'Rejected' && request.rejectionReason && (
                  <div className="p-3 mb-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
                    <p className="text-sm font-medium text-error-700 dark:text-error-300 mb-1">
                      {t('agentRequests.rejectionReason', 'Rejection Reason')}:
                    </p>
                    <p className="text-sm text-error-600 dark:text-error-400">{request.rejectionReason}</p>
                    {request.reviewedAt && (
                      <p className="text-xs text-error-500 mt-2">
                        {t('agentRequests.rejectedAt', 'Rejected on')} {new Date(request.reviewedAt).toLocaleDateString('sq-AL')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-[var(--border-primary)]">
                  {request.status === 'Pending' && (
                    <>
                      <Button
                        variant="success"
                        className="flex-1"
                        onClick={() => { setSelectedRequest(request); setShowApproveModal(true); }}
                        disabled={processingId === request.id}
                        icon={CheckCircle}
                      >
                        {t('agentRequests.approve', 'Approve')}
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                        disabled={processingId === request.id}
                        icon={XCircle}
                      >
                        {t('agentRequests.reject', 'Reject')}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedRequest(request); setShowDeleteModal(true); }}
                    disabled={processingId === request.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <ConfirmDialog
        isOpen={showApproveModal}
        onClose={() => { setShowApproveModal(false); setSelectedRequest(null); }}
        onConfirm={handleApprove}
        title={t('agentRequests.approveTitle', 'Approve Agent Request')}
        message={t('agentRequests.approveMessage', `Are you sure you want to approve ${selectedRequest?.username}'s request to become an agent?`)}
        confirmText={t('agentRequests.approve', 'Approve')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="success"
        loading={processingId === selectedRequest?.id}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason(''); setSelectedRequest(null); }}
        title={t('agentRequests.rejectTitle', 'Reject Agent Request')}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t('agentRequests.rejectDescription', `Please provide a reason for rejecting ${selectedRequest?.username}'s agent request.`)}
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('agentRequests.rejectPlaceholder', 'Enter rejection reason...')}
            rows={4}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedRequest(null); }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processingId === selectedRequest?.id}
              loading={processingId === selectedRequest?.id}
              icon={XCircle}
            >
              {t('agentRequests.rejectConfirm', 'Reject Request')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedRequest(null); }}
        onConfirm={handleDelete}
        title={t('agentRequests.deleteTitle', 'Delete Request')}
        message={t('agentRequests.deleteMessage', 'Are you sure you want to delete this request? This action cannot be undone.')}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
        loading={processingId === selectedRequest?.id}
      />
    </div>
  );
};

export default AgentRequestsPage;
