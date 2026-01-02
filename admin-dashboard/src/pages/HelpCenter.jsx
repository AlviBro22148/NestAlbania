import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle, Plus, Search, Edit, Trash2, X,
  ChevronDown, ChevronUp, Save, GripVertical
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';

export const HelpCenterPage = ({ token }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'gettingStarted',
    order: 0
  });

  const categories = ['all', 'gettingStarted', 'account', 'properties', 'payments'];

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await api.getFaqs(token);
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      // Use default FAQs from mobile app translations
      setFaqs([
        {
          id: 1,
          question: 'How do I create an account?',
          answer: "Tap 'Sign Up' on the login screen, fill in your username, email, phone number, and password. Your account will be created instantly!",
          category: 'gettingStarted',
          order: 1
        },
        {
          id: 2,
          question: 'How do I list a property?',
          answer: "Go to the 'Add Property' tab, fill in the property details including photos, price, location, and amenities. Your listing will be reviewed and published within 24 hours.",
          category: 'properties',
          order: 2
        },
        {
          id: 3,
          question: 'How do I search for properties?',
          answer: "Use the 'Explore' tab to browse all properties. You can filter by price, location, property type, bedrooms, and more to find your perfect match.",
          category: 'properties',
          order: 3
        },
        {
          id: 4,
          question: 'How do I change my password?',
          answer: 'Go to Profile -> Edit Profile -> Change Password. Enter your current password and your new password to update it.',
          category: 'account',
          order: 4
        },
        {
          id: 5,
          question: 'How do I enable two-factor authentication?',
          answer: "Go to Profile -> Security -> Enable Two-Factor Authentication. You'll receive a verification code via email each time you log in for added security.",
          category: 'account',
          order: 5
        },
        {
          id: 6,
          question: 'Is listing a property free?',
          answer: "Yes! Creating and listing properties on NestAlbania is completely free. We don't charge any listing fees.",
          category: 'payments',
          order: 6
        },
        {
          id: 7,
          question: 'How do I contact a property owner?',
          answer: "View any property listing and you'll see the owner's contact information including phone number and email. You can reach out to them directly.",
          category: 'properties',
          order: 7
        },
        {
          id: 8,
          question: 'How do I delete my account?',
          answer: 'Go to Profile -> Edit Profile -> Delete Account. Warning: This action is permanent and will delete all your properties and data.',
          category: 'account',
          order: 8
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error(t('validation.required'));
      return;
    }

    setProcessing(true);
    try {
      if (editingFaq) {
        await api.updateFaq(token, editingFaq.id, formData);
        toast.success(t('helpCenter.faqUpdated'));
      } else {
        await api.createFaq(token, formData);
        toast.success(t('helpCenter.faqCreated'));
      }
      setShowModal(false);
      resetForm();
      loadFaqs();
    } catch (error) {
      // Demo mode - update locally
      if (editingFaq) {
        setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...formData } : f));
        toast.success(t('helpCenter.faqUpdated'));
      } else {
        const newFaq = {
          id: Date.now(),
          ...formData,
          order: faqs.length + 1
        };
        setFaqs([...faqs, newFaq]);
        toast.success(t('helpCenter.faqCreated'));
      }
      setShowModal(false);
      resetForm();
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setProcessing(true);
    try {
      await api.deleteFaq(token, deleteId);
      toast.success(t('helpCenter.faqDeleted'));
      loadFaqs();
    } catch (error) {
      // Demo mode - delete locally
      setFaqs(faqs.filter(f => f.id !== deleteId));
      toast.success(t('helpCenter.faqDeleted'));
    } finally {
      setProcessing(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'gettingStarted',
      order: faqs.length + 1
    });
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.order - b.order);

  const getCategoryColor = (category) => {
    const colors = {
      gettingStarted: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      account: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      properties: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      payments: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
    };
    return colors[category] || 'bg-[var(--bg-hover)] text-[var(--text-secondary)]';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-primary-600" />
            {t('helpCenter.title')}
          </h1>
          <p className="text-[var(--text-muted)] mt-1">{faqs.length} {t('helpCenter.faqs').toLowerCase()}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-5 h-5" />
          {t('helpCenter.createFaq')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-primary)] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {t(`helpCenter.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs List */}
      {filteredFaqs.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-primary)] p-12 text-center">
          <HelpCircle className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)] text-lg">{t('helpCenter.noFaqs')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map(faq => (
            <div key={faq.id} className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition"
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div className="flex-shrink-0 text-[var(--text-muted)]">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(faq.category)}`}>
                      {t(`helpCenter.categories.${faq.category}`)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">#{faq.order}</span>
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] truncate">{faq.question}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(faq); }}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(faq.id); setShowDeleteModal(true); }}
                    className="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
              </div>

              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 pt-0 ml-9">
                  <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border-primary)]">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingFaq ? t('helpCenter.editFaq') : t('helpCenter.createFaq')}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('helpCenter.question')} *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder={t('helpCenter.placeholders.question')}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('helpCenter.answer')} *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder={t('helpCenter.placeholders.answer')}
                  rows={6}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    {t('helpCenter.category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{t(`helpCenter.categories.${cat}`)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    {t('helpCenter.order')}
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {processing ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-md w-full border border-[var(--border-primary)]">
            <div className="bg-gradient-to-r from-error-500 to-error-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{t('helpCenter.deleteFaq')}</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[var(--text-secondary)] mb-6">{t('helpCenter.deleteConfirm')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition disabled:opacity-50"
                >
                  {processing ? t('common.loading') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpCenterPage;
