import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText, Plus, Search, Edit, Trash2, Eye, X,
  Calendar, Clock, Tag, CheckCircle, XCircle, Save
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, StatsCard } from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

export const BlogPage = ({ token }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'tips',
    imageUrl: '',
    tags: [],
    isPublished: true,  // Default to published so blogs show in phone app
    isFeatured: false,
    readTimeMinutes: 5
  });

  const categories = ['all', 'buying', 'selling', 'investing', 'tips', 'market'];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getBlogPosts(token);
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Show empty list instead of fake data - let the API provide real data
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t('validation.required'));
      return;
    }

    setProcessing(true);
    try {
      if (editingPost) {
        await api.updateBlogPost(token, editingPost.id, formData);
        toast.success(t('blog.postUpdated'));
      } else {
        await api.createBlogPost(token, formData);
        toast.success(t('blog.postCreated'));
      }
      setShowModal(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setProcessing(true);
    try {
      await api.deleteBlogPost(token, deleteId);
      toast.success(t('blog.postDeleted'));
      loadPosts();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setProcessing(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const togglePublish = async (post) => {
    try {
      const updateData = {
        title: post.title,
        content: post.content,
        summary: post.summary || '',
        category: post.category,
        imageUrl: post.imageUrl || post.thumbnail,
        tags: post.tags || [],
        readTimeMinutes: post.readTimeMinutes || post.readTime || 5,
        isFeatured: post.isFeatured || false,
        isPublished: !post.isPublished
      };
      await api.updateBlogPost(token, post.id, updateData);
      loadPosts();
      toast.success(post.isPublished ? t('common.unpublish') : t('common.publish'));
    } catch (error) {
      console.error('Error toggling publish:', error);
      setPosts(posts.map(p => p.id === post.id ? { ...p, isPublished: !p.isPublished } : p));
      toast.success(post.isPublished ? t('common.unpublish') : t('common.publish'));
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      summary: post.summary || '',
      category: post.category,
      imageUrl: post.imageUrl || post.thumbnail || '',
      tags: post.tags || [],
      isPublished: post.isPublished,
      isFeatured: post.isFeatured || false,
      readTimeMinutes: post.readTimeMinutes || post.readTime || 5
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      summary: '',
      category: 'tips',
      imageUrl: '',
      tags: [],
      isPublished: true,  // Default to published
      isFeatured: false,
      readTimeMinutes: 5
    });
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.isPublished).length,
    drafts: posts.filter(p => !p.isPublished).length,
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            {t('blog.title')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {posts.length} {t('blog.posts').toLowerCase()}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} icon={Plus}>
          {t('blog.createPost')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title={t('blog.totalPosts', 'Total Posts')}
          value={stats.total}
          icon={FileText}
          gradient="primary"
        />
        <StatsCard
          title={t('blog.published', 'Published')}
          value={stats.published}
          icon={CheckCircle}
          gradient="success"
        />
        <StatsCard
          title={t('blog.drafts', 'Drafts')}
          value={stats.drafts}
          icon={Edit}
          gradient="warning"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t(`blog.categories.${cat}`)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <FileText className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">
              {t('blog.noPosts')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
              {/* Thumbnail */}
              <div className="relative h-48 bg-[var(--bg-tertiary)]">
                {(post.imageUrl || post.thumbnail) ? (
                  <img
                    src={post.imageUrl || post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <StatusBadge status={post.isPublished ? 'published' : 'draft'} />
                  {post.isFeatured && <Badge variant="warning">Featured</Badge>}
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-primary-600 font-medium">
                    {t(`blog.categories.${post.category}`)}
                  </span>
                </div>

                <h3 className="font-bold text-[var(--text-primary)] mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm line-clamp-2 mb-4">{post.content}</p>

                <div className="flex items-center justify-between text-sm text-[var(--text-muted)] mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTimeMinutes || post.readTime || 5} {t('blog.minutes')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-primary)]">
                  <Button
                    variant={post.isPublished ? 'warning' : 'success'}
                    size="sm"
                    className="flex-1"
                    onClick={() => togglePublish(post)}
                    icon={post.isPublished ? XCircle : CheckCircle}
                  >
                    {post.isPublished ? t('common.unpublish') : t('common.publish')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(post)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                    onClick={() => { setDeleteId(post.id); setShowDeleteModal(true); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPost ? t('blog.editPost') : t('blog.createPost')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('blog.postTitle')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('blog.placeholders.title')}
              className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('blog.summary', 'Summary')}
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder={t('blog.placeholders.summary', 'Brief summary of the article...')}
              rows={2}
              className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('blog.content')} *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={t('blog.placeholders.content')}
              rows={8}
              className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                {t('blog.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{t(`blog.categories.${cat}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                {t('blog.readTime')} ({t('blog.minutes')})
              </label>
              <input
                type="number"
                value={formData.readTimeMinutes}
                onChange={(e) => setFormData({ ...formData, readTimeMinutes: parseInt(e.target.value) || 5 })}
                min="1"
                max="60"
                className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('blog.tags', 'Tags')}
            </label>
            <input
              type="text"
              value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
              placeholder={t('blog.placeholders.tags', 'real estate, albania, tips (comma separated)')}
              className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {t('blog.thumbnail')}
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder={t('blog.placeholders.thumbnail')}
              className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {formData.imageUrl && (
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="mt-2 h-32 w-full object-cover rounded-xl"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-[var(--border-primary)] bg-[var(--bg-secondary)]"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-[var(--text-secondary)]">
                {t('blog.publishPost')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-[var(--border-primary)] bg-[var(--bg-secondary)]"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-[var(--text-secondary)]">
                {t('blog.featured', 'Featured')}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={processing}
              icon={Save}
              className="flex-1"
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('blog.deletePost')}
        message={t('blog.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={processing}
      />
    </div>
  );
};

export default BlogPage;
