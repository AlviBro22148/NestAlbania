import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe, Search, MessageSquare, Heart, Trash2, X,
  Users, Lightbulb, HelpCircle, Sparkles, Eye
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, StatsCard } from "../components/ui/Card";
import { Input, SearchInput } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Modal, ConfirmDialog } from "../components/ui/Modal";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";

interface Post {
  id: number;
  username: string;
  userProfilePicture?: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  commentCount: number;
  createdAt: string;
}

interface Comment {
  id: number;
  userId: string;
  username: string;
  userProfilePicture?: string;
  comment: string;
  createdAt: string;
}

interface PostDetail extends Post {
  comments?: Comment[];
}

interface AdminCommunityManagerProps {
  token: string;
}

const AdminCommunityManager = ({ token }: AdminCommunityManagerProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState<boolean>(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState<boolean>(false);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const categories = [
    { id: "all", label: t("community.categories.all", "All"), icon: Globe },
    { id: "Tips", label: t("community.categories.tips", "Tips"), icon: Lightbulb },
    { id: "Questions", label: t("community.categories.questions", "Questions"), icon: HelpCircle },
    { id: "Experiences", label: t("community.categories.experiences", "Experiences"), icon: Sparkles },
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === "all" ? null : selectedCategory;
      const data = await api.getCommunityPosts(token, category);
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error(t("community.errors.loadFailed", "Failed to load posts"));
    } finally {
      setLoading(false);
    }
  };

  const loadPostDetails = async (postId: number) => {
    try {
      const data = await api.getCommunityPostById(token, postId);
      const mappedPost: PostDetail = {
        id: data.id,
        username: data.username,
        userProfilePicture: data.userProfilePicture,
        title: data.title,
        content: data.content,
        category: data.category,
        likes: data.likes,
        commentCount: data.comments?.length || 0,
        createdAt: data.createdAt,
        comments: data.comments || [],
      };
      setSelectedPost(mappedPost);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading post details:", error);
      toast.error(t("community.errors.loadDetailsFailed", "Failed to load post details"));
    }
  };

  const deletePost = async () => {
    if (!selectedPost) return;
    setProcessing(true);
    try {
      await api.deleteCommunityPost(token, selectedPost.id);
      toast.success(t("community.postDeleted", "Post deleted successfully"));
      loadPosts();
      setShowDetailModal(false);
      setShowDeletePostModal(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(t("community.errors.deleteFailed", "Failed to delete post"));
    } finally {
      setProcessing(false);
    }
  };

  const deleteComment = async () => {
    if (!deleteCommentId) return;
    setProcessing(true);
    try {
      await api.deleteCommunityComment(token, deleteCommentId);
      toast.success(t("community.commentDeleted", "Comment deleted successfully"));
      if (selectedPost) {
        await loadPostDetails(selectedPost.id);
      }
      setShowDeleteCommentModal(false);
      setDeleteCommentId(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(t("community.errors.deleteCommentFailed", "Failed to delete comment"));
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Tips": return Lightbulb;
      case "Questions": return HelpCircle;
      case "Experiences": return Sparkles;
      default: return MessageSquare;
    }
  };

  const getCategoryVariant = (category: string): "blue" | "purple" | "green" | "default" => {
    switch (category) {
      case "Tips": return "blue";
      case "Questions": return "purple";
      case "Experiences": return "green";
      default: return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sq-AL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: posts.length,
    tips: posts.filter((p) => p.category === "Tips").length,
    questions: posts.filter((p) => p.category === "Questions").length,
    experiences: posts.filter((p) => p.category === "Experiences").length,
  };

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
            <Globe className="w-6 h-6 text-primary-600" />
          </div>
          {t("community.title", "Community Manager")}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {t("community.subtitle", "Manage community posts and comments")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("community.stats.totalPosts", "Total Posts")}
          value={stats.total}
          icon={MessageSquare}
          gradient="primary"
        />
        <StatsCard
          title={t("community.stats.tips", "Tips")}
          value={stats.tips}
          icon={Lightbulb}
          gradient="blue"
        />
        <StatsCard
          title={t("community.stats.questions", "Questions")}
          value={stats.questions}
          icon={HelpCircle}
          gradient="purple"
        />
        <StatsCard
          title={t("community.stats.experiences", "Experiences")}
          value={stats.experiences}
          icon={Sparkles}
          gradient="success"
        />
      </div>

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
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${selectedCategory === cat.id
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">
              {t("community.noPosts", "No posts found")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => {
            const CategoryIcon = getCategoryIcon(post.category);
            return (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-700"
                onClick={() => loadPostDetails(post.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={post.username}
                      src={post.userProfilePicture}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {post.username}
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                        <Badge variant={getCategoryVariant(post.category)} icon={CategoryIcon}>
                          {t(`community.categories.${post.category.toLowerCase()}`, post.category)}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                        {post.title}
                      </h3>
                      <p className="text-[var(--text-secondary)] line-clamp-2 mb-4">
                        {post.content}
                      </p>

                      <div className="flex items-center gap-6 pt-4 border-t border-[var(--border-primary)]">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Heart className="w-5 h-5 text-error-500" />
                          <span className="font-medium">{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <MessageSquare className="w-5 h-5 text-primary-500" />
                          <span className="font-medium">
                            {post.commentCount} {t("community.comments", "comments")}
                          </span>
                        </div>
                        <div className="ml-auto">
                          <Button variant="ghost" size="sm" icon={Eye}>
                            {t("common.view", "View")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Post Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t("community.postDetails", "Post Details")}
        size="lg"
      >
        {selectedPost && (
          <div className="space-y-6">
            {/* Post Header */}
            <div className="flex items-start gap-4">
              <Avatar
                name={selectedPost.username}
                src={selectedPost.userProfilePicture}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-lg text-[var(--text-primary)]">
                      {selectedPost.username}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatDate(selectedPost.createdAt)}
                    </p>
                  </div>
                  <Badge variant={getCategoryVariant(selectedPost.category)}>
                    {t(`community.categories.${selectedPost.category.toLowerCase()}`, selectedPost.category)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                {selectedPost.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {selectedPost.content}
              </p>
            </div>

            {/* Likes */}
            <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <Heart className="w-6 h-6 text-error-500" />
              <span className="font-semibold text-[var(--text-primary)]">
                {selectedPost.likes} {t("community.likes", "Likes")}
              </span>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                {t("community.commentsTitle", "Comments")} ({selectedPost.comments?.length || 0})
              </h4>

              {selectedPost.comments && selectedPost.comments.length > 0 ? (
                <div className="space-y-3">
                  {selectedPost.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-[var(--bg-tertiary)] rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar
                            name={comment.username}
                            src={comment.userProfilePicture}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--text-primary)]">
                              {comment.username}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mb-2">
                              {formatDate(comment.createdAt)}
                            </p>
                            <p className="text-[var(--text-secondary)]">
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteCommentId(comment.id);
                            setShowDeleteCommentModal(true);
                          }}
                          className="text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[var(--text-muted)] py-8">
                  {t("community.noComments", "No comments yet")}
                </p>
              )}
            </div>

            {/* Delete Post Button */}
            <Button
              variant="danger"
              className="w-full"
              icon={Trash2}
              onClick={() => setShowDeletePostModal(true)}
            >
              {t("community.deletePost", "Delete Post")}
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Post Confirmation */}
      <ConfirmDialog
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={deletePost}
        title={t("community.deletePost", "Delete Post")}
        message={t("community.deletePostConfirm", "Are you sure you want to delete this post? All comments and likes will be removed.")}
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
        variant="danger"
        loading={processing}
      />

      {/* Delete Comment Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteCommentModal}
        onClose={() => {
          setShowDeleteCommentModal(false);
          setDeleteCommentId(null);
        }}
        onConfirm={deleteComment}
        title={t("community.deleteComment", "Delete Comment")}
        message={t("community.deleteCommentConfirm", "Are you sure you want to delete this comment?")}
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
        variant="danger"
        loading={processing}
      />
    </div>
  );
};

export default AdminCommunityManager;
