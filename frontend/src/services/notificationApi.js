/**
 * Notification API utilities
 * 
 * This file exports notificationApi object containing all notification-related API calls.
 * Used by: Header, NotificationMenu
 */

import axiosInstance from '../utils/axios';

/**
 * Helper functions to format notifications
 */
const formatNotificationTitle = (type) => {
  const titles = {
    'new_bid': 'New Bid Placed',
    'outbid': 'You Have Been Outbid',
    'auction_won': 'Congratulations! You Won',
    'auction_lost': 'Auction Ended',
    'auction_ending_soon': 'Auction Ending Soon',
    'new_question': 'New Question',
    'question_answered': 'Question Answered',
    'auto_bid_activated': 'Auto-Bid Activated',
  };
  return titles[type] || 'Notification';
};

const formatNotificationMessage = (notif) => {
  // Try to extract meaningful message from payload
  try {
    if (notif.payload) {
      const payload = typeof notif.payload === 'string' 
        ? JSON.parse(notif.payload) 
        : notif.payload;
      
      // You can customize message based on type and payload
      return `Activity on product ${payload.product_id || 'item'}`;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 'You have a new notification';
};

const extractProductIdFromPayload = (payload) => {
  try {
    if (payload) {
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
      return parsed.product_id || parsed.productId || null;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
};

/**
 * Notification API response structure:
 * {
 *   success: boolean,
 *   message: string,
 *   notifications: [
 *     {
 *       id: number,
 *       userId: number,
 *       type: string,
 *       title: string,
 *       message: string,
 *       relatedProductId: number,
 *       relatedProductTitle: string,
 *       isRead: boolean,
 *       createdAt: number,
 *       readAt: number
 *     }
 *   ],
 *   unreadCount: number
 * }
 */

export const notificationApi = {
  /**
   * Get all notifications for the authenticated user
   * Requires authentication
   * @returns {Promise} - { success, message, notifications: [...], unreadCount }
   */
  getUserNotifications: () => {
    return axiosInstance.get('/api/bidder/notifications').then((response) => {
      
      // Backend returns { notifications: [...], unreadCount: number } or { success, notifications, unreadCount }
      const hasSuccess = 'success' in response.data;
      const isSuccess = hasSuccess ? response.data.success : (response.data.notifications !== undefined);
      
      if (isSuccess) {
        const notifications = response.data.notifications || [];
        
        // Transform notification format if needed
        const transformedNotifications = notifications.map(notif => ({
          id: notif.id,
          userId: notif.userId,
          type: notif.type,
          title: notif.title || formatNotificationTitle(notif.type),
          message: notif.message || formatNotificationMessage(notif),
          relatedProductId: notif.relatedProductId || extractProductIdFromPayload(notif.payload),
          relatedProductTitle: notif.relatedProductTitle || '',
          isRead: notif.isRead || false,
          createdAt: notif.createdAt,
          readAt: notif.readAt || null,
        }));
        
        return {
          success: true,
          data: transformedNotifications,
          unreadCount: response.data.unreadCount || 0,
          message: response.data.message || 'Notifications retrieved successfully',
        };
      } else {
        throw new Error(response.data.message || 'Failed to get notifications');
      }
    }).catch((error) => {
      console.error('Notifications API Error:', error);
      console.error('Error response:', error);
      throw error;
    });
  },

  /**
   * Mark a notification as read
   * Requires authentication
   * @param {number} notificationId - The notification ID to mark as read
   * @returns {Promise} - { success, message }
   */
  markAsRead: (notificationId) => {
    return axiosInstance.put(`/api/bidder/notifications/${notificationId}/read`).then((response) => {
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Notification marked as read',
        };
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    }).catch((error) => {
      console.error('Mark as read API Error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    });
  },
};

export default notificationApi;
