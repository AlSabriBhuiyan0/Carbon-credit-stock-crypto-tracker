// Notification Service for Frontend
// Handles all notification-related API calls and state management

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

class NotificationService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications`;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Get headers for API requests
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all notifications for the current user
  async getNotifications(options = {}) {
    try {
      const { limit = 50, offset = 0, unread_only, type, priority } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(unread_only && { unread_only: 'true' }),
        ...(type && { type }),
        ...(priority && { priority })
      });

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await fetch(`${this.baseURL}/unread-count`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data.unread_count : 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${this.baseURL}/${notificationId}/read`, {
        method: 'PATCH',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await fetch(`${this.baseURL}/mark-all-read`, {
        method: 'PATCH',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${this.baseURL}/${notificationId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create notification (admin only)
  async createNotification(notificationData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create system notification (admin only)
  async createSystemNotification(notificationData) {
    try {
      const response = await fetch(`${this.baseURL}/system`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  // Get notification statistics (admin only)
  async getNotificationStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats/overview`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // Clean up expired notifications (admin only)
  async cleanupExpiredNotifications() {
    try {
      const response = await fetch(`${this.baseURL}/cleanup/expired`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Mock data for development/testing
  getMockNotifications() {
    return [
      {
        id: 1,
        title: 'Welcome to Carbon credit tracker and stock,crypto asset prediction platform!',
        message: 'Thank you for joining our platform. Explore your dashboard to get started.',
        type: 'info',
        priority: 'normal',
        read_status: false,
        action_required: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'System Maintenance Notice',
        message: 'Scheduled maintenance will occur on Sunday at 2 AM EST. Service may be temporarily unavailable.',
        type: 'warning',
        priority: 'normal',
        read_status: false,
        action_required: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        title: 'New Feature Available',
        message: 'Check out our new reporting system! Generate comprehensive reports for your portfolio and ESG metrics.',
        type: 'success',
        priority: 'normal',
        read_status: true,
        action_required: true,
        action_url: '/reports',
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 4,
        title: 'Portfolio Update Required',
        message: 'Your portfolio data is outdated. Please update your holdings to ensure accurate reporting.',
        type: 'alert',
        priority: 'high',
        read_status: false,
        action_required: true,
        action_url: '/portfolio',
        created_at: new Date(Date.now() - 10800000).toISOString()
      }
    ];
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const iconMap = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      alert: '🚨'
    };
    return iconMap[type] || 'ℹ️';
  }

  // Get notification color based on type
  getNotificationColor(type) {
    const colorMap = {
      info: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      alert: 'red'
    };
    return colorMap[type] || 'blue';
  }

  // Get priority color
  getPriorityColor(priority) {
    const priorityColorMap = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return priorityColorMap[priority] || 'blue';
  }

  // Format notification date
  formatNotificationDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
