import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Search, User, Building2, Clock,
  ChevronLeft, Trash2, RefreshCw, CheckCheck, Check
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export const ChatPage = ({ token }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id, true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    try {
      const data = await api.getConversations(token);
      const sortedConversations = (data || []).sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt);
        const dateB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (!silent) {
        toast.error(t('errors.loadingFailed'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMessages = async (conversationId, silent = false) => {
    if (!silent) setLoadingMessages(true);

    try {
      const data = await api.getMessages(token, conversationId);
      const sortedMessages = (data || []).sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setMessages(sortedMessages);

      if (!silent) {
        try {
          await api.markConversationAsRead(token, conversationId);
          setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ));
        } catch (e) {
          console.error('Error marking as read:', e);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!silent) {
        toast.error(t('errors.loadingFailed'));
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setProcessing(true);
    try {
      await api.deleteConversation(token, deleteId);
      toast.success(t('chat.conversationDeleted'));
      setConversations(prev => prev.filter(c => c.id !== deleteId));
      if (selectedConversation?.id === deleteId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setProcessing(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleRefresh = () => {
    loadConversations();
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('chat.yesterday');
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString('sq-AL', { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('chat.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.yesterday');
    } else {
      return date.toLocaleDateString('sq-AL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.userName?.toLowerCase().includes(searchLower) ||
      conv.agentName?.toLowerCase().includes(searchLower) ||
      conv.propertyTitle?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)]">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-r border-[var(--border-primary)] flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                  {t('chat.title')}
                  {totalUnread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-error-500 text-white text-xs font-bold rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <SearchInput
                placeholder={t('chat.searchConversations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)]">{t('chat.noConversations')}</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b border-[var(--border-primary)] cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : conv.unreadCount > 0
                          ? 'bg-primary-50/50 dark:bg-primary-900/10'
                          : 'hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] flex-shrink-0 overflow-hidden">
                        {conv.propertyImage ? (
                          <img
                            src={conv.propertyImage}
                            alt={conv.propertyTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold">
                            {(conv.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold text-[var(--text-primary)] truncate ${conv.unreadCount > 0 ? 'font-bold' : ''}`}>
                            {conv.userName || 'User'} & {conv.agentName || 'Agent'}
                          </h3>
                          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                            {formatTime(conv.lastMessageAt || conv.updatedAt)}
                          </span>
                        </div>

                        {conv.propertyTitle && (
                          <div className="flex items-center gap-1 text-xs text-primary-600 mb-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{conv.propertyTitle}</span>
                            {conv.propertyPrice && (
                              <span className="text-[var(--text-muted)] ml-1">
                                {formatPrice(conv.propertyPrice)}
                              </span>
                            )}
                          </div>
                        )}

                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                          {conv.lastMessage || t('chat.noMessages')}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center px-1.5 flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Stats Footer */}
            <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-center text-sm text-[var(--text-secondary)]">
              {conversations.length} {t('chat.conversations').toLowerCase()}
              {totalUnread > 0 && ` • ${totalUnread} ${t('notifications.unread').toLowerCase()}`}
            </div>
          </div>

          {/* Chat View */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-[var(--bg-hover)] rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
                      </button>

                      <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                        {selectedConversation.propertyImage ? (
                          <img
                            src={selectedConversation.propertyImage}
                            alt={selectedConversation.propertyTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-[var(--text-muted)]" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {selectedConversation.userName} & {selectedConversation.agentName}
                        </h3>
                        {selectedConversation.propertyTitle && (
                          <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {selectedConversation.propertyTitle}
                            {selectedConversation.propertyPrice && (
                              <span className="text-primary-600 font-medium ml-1">
                                {formatPrice(selectedConversation.propertyPrice)}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadMessages(selectedConversation.id)}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                        onClick={() => { setDeleteId(selectedConversation.id); setShowDeleteModal(true); }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Participants Info */}
                <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)] flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary-600" />
                    </div>
                    <span className="text-[var(--text-secondary)]">
                      <strong>{t('chat.user')}:</strong> {selectedConversation.userName}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-[var(--border-primary)]"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                      <User className="w-3 h-3 text-success-600" />
                    </div>
                    <span className="text-[var(--text-secondary)]">
                      <strong>{t('chat.agent')}:</strong> {selectedConversation.agentName}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-tertiary)]">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2" />
                        <p className="text-[var(--text-secondary)]">{t('chat.noMessages')}</p>
                      </div>
                    </div>
                  ) : (
                    Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                      <div key={date}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-xs text-[var(--text-muted)] shadow-sm border border-[var(--border-primary)]">
                            {formatMessageDate(dateMessages[0].createdAt)}
                          </div>
                        </div>

                        {/* Messages for this date */}
                        {dateMessages.map((msg, idx) => {
                          const isAgent = msg.senderId === selectedConversation.agentId;
                          const showSender = idx === 0 || dateMessages[idx - 1].senderId !== msg.senderId;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isAgent ? 'justify-end' : 'justify-start'} ${showSender ? 'mt-4' : 'mt-1'}`}
                            >
                              <div className={`max-w-[70%] ${isAgent ? 'order-2' : ''}`}>
                                {showSender && (
                                  <p className={`text-xs text-[var(--text-muted)] mb-1 ${isAgent ? 'text-right' : 'text-left'}`}>
                                    {msg.senderName || (isAgent ? selectedConversation.agentName : selectedConversation.userName)}
                                  </p>
                                )}
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isAgent
                                      ? 'bg-primary-600 text-white rounded-br-md'
                                      : 'bg-[var(--bg-secondary)] shadow-sm border border-[var(--border-primary)] rounded-bl-md text-[var(--text-primary)]'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {formatMessageTime(msg.createdAt)}
                                  </span>
                                  {isAgent && (
                                    msg.isRead ? (
                                      <CheckCheck className="w-3 h-3 text-primary-400" />
                                    ) : (
                                      <Check className="w-3 h-3 text-[var(--text-muted)]" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Admin View - Read Only Notice */}
                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{t('chat.title')} - Admin view (Read only)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[var(--bg-tertiary)]">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-1">{t('chat.conversations')}</h3>
                  <p className="text-sm text-[var(--text-muted)]">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('chat.deleteConversation')}
        message={t('chat.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={processing}
      />
    </div>
  );
};

export default ChatPage;
