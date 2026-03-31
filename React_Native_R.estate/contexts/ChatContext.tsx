import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import api from '@/lib/axios-config';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: number | string;
  conversationId: number;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage?: string;
  propertyPrice: number;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  agentId: string;
  agentName: string;
  agentProfilePicture?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  conversations: ChatConversation[];
  loading: boolean;
  totalUnreadCount: number;
  refreshConversations: () => Promise<void>;
  getConversation: (conversationId: number) => ChatConversation | undefined;
  fetchConversation: (conversationId: number) => Promise<ChatConversation | null>;
  getMessages: (conversationId: number) => Promise<ChatMessage[]>;
  sendMessage: (conversationId: number, content: string) => Promise<ChatMessage>;
  startConversation: (propertyId: number, agentId: string, initialMessage: string) => Promise<ChatConversation>;
  markAsRead: (conversationId: number) => Promise<void>;
  hasExistingConversation: (propertyId: number) => ChatConversation | undefined;
  deleteConversation: (conversationId: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const isInitialFetch = useRef(true);

  // Check if user is an agent/admin
  const isAgent = user?.role === "Agent" || user?.role === "Admin";

  // Stable refs — these allow fetchConversations to be truly stable
  const isAuthenticatedRef = useRef(isAuthenticated);
  const userRef = useRef(user);
  isAuthenticatedRef.current = isAuthenticated;
  userRef.current = user;

  // Ref-based state for stable callbacks
  const convosRef = useRef(conversations);
  useEffect(() => {
    convosRef.current = conversations;
  }, [conversations]);

  // Fetch conversations from API — STABLE (no user/isAuthenticated in deps)
  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!isAuthenticatedRef.current || !userRef.current) {
      setConversations([]);
      setTotalUnreadCount(0);
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const response = await api.get('/api/chat/conversations?filter=active');
      const allConvos: ChatConversation[] = response.data || [];
      setConversations(allConvos);

      const unread = allConvos.reduce((sum: number, c: ChatConversation) => sum + c.unreadCount, 0);
      setTotalUnreadCount(unread);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Silent - Chat API not implemented
      } else {
        console.error('Error fetching conversations:', error);
      }
      setConversations([]);
      setTotalUnreadCount(0);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []); // Stable — reads from refs, not from closure

  // Load conversations on auth change - reduced polling to 2 minutes
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch with loading
      if (isInitialFetch.current) {
        isInitialFetch.current = false;
        fetchConversations(true);
      }
      // Background polling every 2 minutes (NOT 30 seconds) - no loading state
      const interval = setInterval(() => fetchConversations(false), 120000);
      return () => clearInterval(interval);
    } else {
      setConversations([]);
      setTotalUnreadCount(0);
      isInitialFetch.current = true;
    }
  }, [isAuthenticated, fetchConversations]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);

  const getConversation = useCallback((conversationId: number) => {
    return convosRef.current.find(c => c.id === conversationId);
  }, []); // Stable reference

  // Fetch a single conversation directly from API
  const fetchConversation = useCallback(async (conversationId: number): Promise<ChatConversation | null> => {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }, []);

  const getMessages = useCallback(async (conversationId: number): Promise<ChatMessage[]> => {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: number, content: string): Promise<ChatMessage> => {
    try {
      const response = await api.post(`/api/chat/conversations/${conversationId}/messages`, {
        content,
      });
      fetchConversations(false);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [fetchConversations]);

  const startConversation = useCallback(async (
    propertyId: number,
    agentId: string,
    initialMessage: string
  ): Promise<ChatConversation> => {
    try {
      const response = await api.post('/api/chat/conversations', {
        propertyId,
        agentId,
        initialMessage,
      });
      fetchConversations(false);
      return response.data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }, [fetchConversations]);

  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      await api.put(`/api/chat/conversations/${conversationId}/read`);
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      setTotalUnreadCount(prev => {
        const conv = convosRef.current.find(c => c.id === conversationId);
        return Math.max(0, prev - (conv?.unreadCount || 0));
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []); // Stable reference

  const hasExistingConversation = useCallback((propertyId: number): ChatConversation | undefined => {
    if (!user || isAgent) return undefined;
    const userId = user.id?.toString().toLowerCase();
    return convosRef.current.find(c => c.propertyId === propertyId && c.userId?.toString().toLowerCase() === userId);
  }, [user, isAgent]); // Only depends on user identity, not conversation list state

  const deleteConversation = useCallback(async (conversationId: number) => {
    try {
      await api.delete(`/api/chat/conversations/${conversationId}`);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }, []);

  // CRITICAL: Memoize context value to prevent cascading re-renders
  const value = useMemo(() => ({
    conversations,
    loading,
    totalUnreadCount,
    refreshConversations,
    getConversation,
    fetchConversation,
    getMessages,
    sendMessage,
    startConversation,
    markAsRead,
    hasExistingConversation,
    deleteConversation,
  }), [
    conversations,
    loading,
    totalUnreadCount,
    refreshConversations,
    getConversation,
    fetchConversation,
    getMessages,
    sendMessage,
    startConversation,
    markAsRead,
    hasExistingConversation,
    deleteConversation,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
