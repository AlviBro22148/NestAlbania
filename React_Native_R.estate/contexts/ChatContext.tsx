import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Check if user is an agent/admin
  const isAgent = user?.role === "Agent" || user?.role === "Admin";

  // Fetch conversations from API
  const fetchConversations = async () => {
    if (!isAuthenticated || !user) {
      setConversations([]);
      setTotalUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/api/chat/conversations?filter=active');
      const allConvos: ChatConversation[] = response.data || [];
      setConversations(allConvos);

      // Calculate total unread count
      const unread = allConvos.reduce((sum: number, c: ChatConversation) => sum + c.unreadCount, 0);
      setTotalUnreadCount(unread);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Chat API not implemented yet');
      } else {
        console.error('Error fetching conversations:', error);
      }
      setConversations([]);
      setTotalUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load conversations on auth change or role change
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 30000);
      return () => clearInterval(interval);
    } else {
      setConversations([]);
      setTotalUnreadCount(0);
    }
  }, [isAuthenticated, user?.id, user?.role]);

  const refreshConversations = async () => {
    await fetchConversations();
  };

  const getConversation = (conversationId: number) => {
    return conversations.find(c => c.id === conversationId);
  };

  // Fetch a single conversation directly from API
  const fetchConversation = async (conversationId: number): Promise<ChatConversation | null> => {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  };

  const getMessages = async (conversationId: number): Promise<ChatMessage[]> => {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const sendMessage = async (conversationId: number, content: string): Promise<ChatMessage> => {
    try {
      const response = await api.post(`/api/chat/conversations/${conversationId}/messages`, {
        content,
      });
      await fetchConversations();
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const startConversation = async (
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
      await fetchConversations();
      return response.data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  };

  const markAsRead = async (conversationId: number) => {
    try {
      await api.put(`/api/chat/conversations/${conversationId}/read`);
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      setTotalUnreadCount(prev => {
        const conv = conversations.find(c => c.id === conversationId);
        return Math.max(0, prev - (conv?.unreadCount || 0));
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const hasExistingConversation = (propertyId: number): ChatConversation | undefined => {
    // Only check for existing conversations where the current user is the "user" party
    // (Agents don't start conversations, users do)
    if (!user || isAgent) return undefined;
    const userId = user.id?.toString().toLowerCase();
    return conversations.find(c => c.propertyId === propertyId && c.userId?.toString().toLowerCase() === userId);
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await api.delete(`/api/chat/conversations/${conversationId}`);
      // Remove from local state immediately
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
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
