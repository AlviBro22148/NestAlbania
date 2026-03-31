const API_BASE_URL = 'http://192.168.100.94:5175';

// Helper function to handle API responses and check for auth errors
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Clear auth and redirect to login
    localStorage.removeItem('admin_auth');
    window.location.reload();
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    // Try to get error details from response
    try {
      const errorData = await response.json();
      console.error('API Error Details:', JSON.stringify(errorData, null, 2));

      // Handle ASP.NET validation errors format
      if (errorData.errors) {
        const errorMessages = Object.entries(errorData.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(errorMessages || 'Validation failed');
      }

      const errorMessage = errorData.message || errorData.title || `Request failed: ${response.status}`;
      throw new Error(errorMessage);
    } catch (e) {
      if (e.message && !e.message.includes('Unexpected')) throw e;
      throw new Error(`Request failed: ${response.status}`);
    }
  }

  return await response.json();
};

// Helper function to make authenticated requests
const authFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  return handleResponse(response);
};

export const api = {
  // ===== AUTHENTICATION =====
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return await response.json();
  },

  getMe: async (token) => {
    return authFetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // ===== DASHBOARD STATS =====
  getDashboardStats: async (token) => {
    return authFetch(`${API_BASE_URL}/api/Properties/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== USERS =====
  getUsers: async (token, page = 1, pageSize = 100) => {
    const data = await authFetch(
      `${API_BASE_URL}/api/Properties/admin/all-users?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return data.users;
  },

  deleteUser: async (token, id) => {
    return authFetch(`${API_BASE_URL}/api/Properties/admin/delete-user/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  promoteToAdmin: async (token, id) => {
    return authFetch(`${API_BASE_URL}/api/Properties/admin/make-admin/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  makeCityAdmin: async (token, id, city) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/make-city-admin/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ city })
    });
  },

  revokeCityAdmin: async (token, id) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/revoke-city-admin/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  banUser: async (token, id, reason = null) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/ban-user/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
  },

  unbanUser: async (token, id) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/unban-user/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== PROPERTIES =====
  getProperties: async (token, page = 1, pageSize = 100) => {
    const data = await authFetch(
      `${API_BASE_URL}/api/Properties/admin/all-properties?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      properties: data.properties || [],
      totalPages: Math.ceil((data.properties?.length || 0) / pageSize),
      currentPage: page
    };
  },

  deleteProperty: async (token, id) => {
    return authFetch(`${API_BASE_URL}/api/Properties/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  updatePropertyStatus: async (token, id, status) => {
    return authFetch(`${API_BASE_URL}/api/Properties/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
  },

  getPropertyById: async (token, id) => {
    return authFetch(`${API_BASE_URL}/api/Properties/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  updateProperty: async (token, id, formData) => {
    return authFetch(`${API_BASE_URL}/api/Properties/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
  },

  getCharts: async (token) => {
    return authFetch(`${API_BASE_URL}/api/properties/charts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== FEEDBACK =====
  getFeedbacks: async (token, status = null, type = null) => {
    let url = `${API_BASE_URL}/api/feedback/admin/all`;
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (type) params.append('type', type);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return authFetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getFeedbackStats: async (token) => {
    return authFetch(`${API_BASE_URL}/api/feedback/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  updateFeedbackStatus: async (token, feedbackId, status) => {
    return authFetch(`${API_BASE_URL}/api/feedback/admin/${feedbackId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
  },

  deleteFeedback: async (token, feedbackId) => {
    return authFetch(`${API_BASE_URL}/api/feedback/admin/${feedbackId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== COMMUNITY =====
  getCommunityPosts: async (token, category = null) => {
    let url = `${API_BASE_URL}/api/community/posts`;

    if (category && category !== 'All') {
      url += `?category=${encodeURIComponent(category)}`;
    }

    return authFetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getCommunityPostById: async (token, postId) => {
    return authFetch(`${API_BASE_URL}/api/community/posts/${postId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  deleteCommunityPost: async (token, postId) => {
    return authFetch(`${API_BASE_URL}/api/community/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  deleteCommunityComment: async (token, commentId) => {
    return authFetch(`${API_BASE_URL}/api/community/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== AGENT REQUESTS =====
  getAgentRequests: async (token, status = null) => {
    let url = `${API_BASE_URL}/api/auth/admin/agent-requests`;

    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }

    return authFetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getAgentRequestStats: async (token) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/agent-requests/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  approveAgentRequest: async (token, requestId) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/agent-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  rejectAgentRequest: async (token, requestId, reason) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/agent-requests/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
  },

  deleteAgentRequest: async (token, requestId) => {
    return authFetch(`${API_BASE_URL}/api/auth/admin/agent-requests/${requestId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== NOTIFICATIONS =====
  getNotifications: async (token, unreadOnly = false) => {
    return authFetch(`${API_BASE_URL}/api/notifications?unreadOnly=${unreadOnly}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getUnreadCount: async (token) => {
    return authFetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  markNotificationAsRead: async (token, notificationId) => {
    return authFetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  markAllNotificationsAsRead: async (token) => {
    return authFetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  deleteNotification: async (token, notificationId) => {
    return authFetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== BLOG =====
  getBlogPosts: async (token) => {
    return authFetch(`${API_BASE_URL}/api/blog/posts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  createBlogPost: async (token, postData) => {
    return authFetch(`${API_BASE_URL}/api/blog/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
  },

  updateBlogPost: async (token, postId, postData) => {
    return authFetch(`${API_BASE_URL}/api/blog/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
  },

  deleteBlogPost: async (token, postId) => {
    return authFetch(`${API_BASE_URL}/api/blog/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== HELP CENTER / FAQs =====
  getFaqs: async (token) => {
    return authFetch(`${API_BASE_URL}/api/faqs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  createFaq: async (token, faqData) => {
    return authFetch(`${API_BASE_URL}/api/faqs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(faqData)
    });
  },

  updateFaq: async (token, faqId, faqData) => {
    return authFetch(`${API_BASE_URL}/api/faqs/${faqId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(faqData)
    });
  },

  deleteFaq: async (token, faqId) => {
    return authFetch(`${API_BASE_URL}/api/faqs/${faqId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // ===== PROPERTY CREATION =====
  createProperty: async (token, propertyData) => {
    return authFetch(`${API_BASE_URL}/api/Properties/admin/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });
  },

  // ===== CHAT / CONVERSATIONS =====
  // Admin endpoint - gets ALL conversations between all users
  getConversations: async (token) => {
    return authFetch(`${API_BASE_URL}/api/chat/admin/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getConversation: async (token, conversationId) => {
    return authFetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // Admin endpoint - gets messages for any conversation
  getMessages: async (token, conversationId) => {
    return authFetch(`${API_BASE_URL}/api/chat/admin/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  markConversationAsRead: async (token, conversationId) => {
    return authFetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  deleteConversation: async (token, conversationId) => {
    return authFetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
};
