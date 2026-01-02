import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare, Search, Bug, Lightbulb, MessageCircle,
  Clock, CheckCircle, Eye, Trash2, User, Mail, Calendar
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, StatsCard } from "../components/ui/Card";
import { SearchInput } from "../components/ui/Input";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Modal, ConfirmDialog } from "../components/ui/Modal";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";

interface Feedback {
  id: number;
  userId: string;
  username: string;
  userEmail: string;
  feedbackType: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalFeedback: number;
  pendingCount: number;
  reviewedCount: number;
  resolvedCount: number;
  bugCount: number;
  featureCount: number;
  generalCount: number;
  recentCount: number;
}

interface AdminFeedbackManagerProps {
  token: string;
}

const AdminFeedbackManager = ({ token }: AdminFeedbackManagerProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  const filters = [
    { id: "all", label: t("feedback.filters.all", "All"), icon: MessageSquare },
    { id: "Pending", label: t("feedback.filters.pending", "Pending"), icon: Clock },
    { id: "Reviewed", label: t("feedback.filters.reviewed", "Reviewed"), icon: Eye },
    { id: "Resolved", label: t("feedback.filters.resolved", "Resolved"), icon: CheckCircle },
    { id: "Bug", label: t("feedback.filters.bugs", "Bugs Only"), icon: Bug },
  ];

  useEffect(() => {
    loadData();
  }, [selectedFilter]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadFeedbacks(), loadStats()]);
    setLoading(false);
  };

  const loadFeedbacks = async () => {
    try {
      let status = null;
      let type = null;

      if (selectedFilter !== "all" && selectedFilter !== "Bug") {
        status = selectedFilter;
      } else if (selectedFilter === "Bug") {
        type = "Bug";
      }

      const data = await api.getFeedbacks(token, status, type);
      setFeedbacks(data);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      toast.error(t("feedback.errors.loadFailed", "Failed to load feedback"));
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getFeedbackStats(token);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const updateStatus = async (feedbackId: number, newStatus: string) => {
    setProcessing(true);
    try {
      await api.updateFeedbackStatus(token, feedbackId, newStatus);
      if (newStatus === "Resolved") {
        toast.success(t("feedback.resolved", "Feedback marked as resolved! User has been notified."));
      } else {
        toast.success(t("feedback.statusUpdated", "Status updated successfully"));
      }
      loadData();
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("feedback.errors.updateFailed", "Failed to update status"));
    } finally {
      setProcessing(false);
    }
  };

  const deleteFeedback = async () => {
    if (!selectedFeedback) return;
    setProcessing(true);
    try {
      await api.deleteFeedback(token, selectedFeedback.id);
      toast.success(t("feedback.deleted", "Feedback deleted successfully"));
      loadData();
      setShowDetailModal(false);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error(t("feedback.errors.deleteFailed", "Failed to delete feedback"));
    } finally {
      setProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Bug": return Bug;
      case "Feature Request": return Lightbulb;
      default: return MessageCircle;
    }
  };

  const getTypeVariant = (type: string): "error" | "warning" | "blue" => {
    switch (type) {
      case "Bug": return "error";
      case "Feature Request": return "warning";
      default: return "blue";
    }
  };

  const getStatusVariant = (status: string): "warning" | "blue" | "success" => {
    switch (status) {
      case "Pending": return "warning";
      case "Reviewed": return "blue";
      case "Resolved": return "success";
      default: return "warning";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sq-AL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("sq-AL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
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
            <MessageSquare className="w-6 h-6 text-primary-600" />
          </div>
          {t("feedback.title", "Feedback Manager")}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {t("feedback.subtitle", "Manage user feedback and bug reports")}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t("feedback.stats.total", "Total Feedback")}
            value={stats.totalFeedback}
            icon={MessageSquare}
            gradient="primary"
          />
          <StatsCard
            title={t("feedback.stats.pending", "Pending")}
            value={stats.pendingCount}
            icon={Clock}
            gradient="warning"
          />
          <StatsCard
            title={t("feedback.stats.bugs", "Bug Reports")}
            value={stats.bugCount}
            icon={Bug}
            gradient="error"
          />
          <StatsCard
            title={t("feedback.stats.resolved", "Resolved")}
            value={stats.resolvedCount}
            icon={CheckCircle}
            gradient="success"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder={t("common.search", "Search...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${selectedFilter === filter.id
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">
              {t("feedback.noFeedback", "No feedback found")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeedbacks.map((feedback) => {
            const TypeIcon = getTypeIcon(feedback.feedbackType);
            return (
              <Card
                key={feedback.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-700"
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDetailModal(true);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-1">
                        {feedback.subject}
                      </h3>
                      <p className="text-[var(--text-secondary)] line-clamp-2">
                        {feedback.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                      <Badge variant={getTypeVariant(feedback.feedbackType)} icon={TypeIcon}>
                        {t(`feedback.types.${feedback.feedbackType.toLowerCase().replace(" ", "")}`, feedback.feedbackType)}
                      </Badge>
                      <StatusBadge status={feedback.status.toLowerCase() as "pending" | "reviewed" | "resolved"} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Calendar className="w-4 h-4" />
                      {formatDate(feedback.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-primary)]">
                    <Avatar name={feedback.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {feedback.username}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {feedback.userEmail}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" icon={Eye}>
                      {t("common.view", "View")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t("feedback.details", "Feedback Details")}
        size="lg"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            {/* Type & Status Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge
                variant={getTypeVariant(selectedFeedback.feedbackType)}
                icon={getTypeIcon(selectedFeedback.feedbackType)}
                size="lg"
              >
                {t(`feedback.types.${selectedFeedback.feedbackType.toLowerCase().replace(" ", "")}`, selectedFeedback.feedbackType)}
              </Badge>
              <StatusBadge status={selectedFeedback.status.toLowerCase() as "pending" | "reviewed" | "resolved"} />
            </div>

            {/* User Info */}
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">
                {t("feedback.sentBy", "Sent by")}
              </h3>
              <div className="flex items-center gap-4">
                <Avatar name={selectedFeedback.username} size="lg" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {selectedFeedback.username}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Mail className="w-4 h-4" />
                    {selectedFeedback.userEmail}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(selectedFeedback.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">
                {t("feedback.subject", "Subject")}
              </h3>
              <p className="text-lg font-medium text-[var(--text-primary)]">
                {selectedFeedback.subject}
              </p>
            </div>

            {/* Message */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">
                {t("feedback.message", "Message")}
              </h3>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>
            </div>

            {/* Status Update Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">
                {t("feedback.updateStatus", "Update Status")}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "Pending", label: t("feedback.statuses.pending", "Pending"), variant: "warning" as const },
                  { value: "Reviewed", label: t("feedback.statuses.reviewed", "Reviewed"), variant: "secondary" as const },
                  { value: "Resolved", label: t("feedback.statuses.resolved", "Resolved"), variant: "success" as const },
                ].map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedFeedback.status === status.value ? "primary" : status.variant}
                    onClick={() => updateStatus(selectedFeedback.id, status.value)}
                    disabled={selectedFeedback.status === status.value || processing}
                    loading={processing}
                    className={selectedFeedback.status === status.value ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Delete Button */}
            <Button
              variant="danger"
              className="w-full"
              icon={Trash2}
              onClick={() => setShowDeleteModal(true)}
            >
              {t("feedback.delete", "Delete Feedback")}
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteFeedback}
        title={t("feedback.delete", "Delete Feedback")}
        message={t("feedback.deleteConfirm", "Are you sure you want to delete this feedback?")}
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
        variant="danger"
        loading={processing}
      />
    </div>
  );
};

export default AdminFeedbackManager;
