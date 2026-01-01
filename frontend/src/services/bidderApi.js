/**
 * Bidder API utilities
 * 
 * This file exports bidderApi object containing all bidder-related API calls.
 * Used by: Bidder HomePage, AuctionHistory, ProfilePage
 */

import axiosInstance from '../utils/axios';

/**
 * Bidder API response structure from backend:
 * {
 *   success: boolean,
 *   message: string,
 *   data: [...],
 *   page?: number,
 *   limit?: number,
 *   total?: number,
 *   totalPages?: number
 * }
 */

export const bidderApi = {
  /**
   * Get bidding history
   * Requires bidder authentication
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @returns {Promise} - { success, message, data: [...], page, limit, total, totalPages }
   */
  getBiddingHistory: (page = 1, limit = 20) => {
    return axiosInstance
      .get('/api/bidder/profile/bids', {
        params: { page, limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Bidding history retrieved successfully',
            data: response.data.data || response.data.bids || [],
            page: response.data.page || page,
            limit: response.data.limit || limit,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 1,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get bidding history');
        }
      })
      .catch((error) => {
        console.error('Get bidding history error:', error);
        throw error;
      });
  },

  /**
   * Get won items
   * Requires bidder authentication
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @returns {Promise} - { success, message, data: [...], page, limit, total, totalPages }
   */
  getWonItems: (page = 1, limit = 20) => {
    return axiosInstance
      .get('/api/bidder/profile/wins', {
        params: { page, limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Won items retrieved successfully',
            data: response.data.data || response.data.wins || [],
            page: response.data.page || page,
            limit: response.data.limit || limit,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 1,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get won items');
        }
      })
      .catch((error) => {
        console.error('Get won items error:', error);
        throw error;
      });
  },

  /**
   * Get ratings received
   * Requires bidder authentication
   * @returns {Promise} - { success, message, data: [...] }
   */
  getRatingsReceived: () => {
    return axiosInstance
      .get('/api/bidder/profile/ratings/received')
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Ratings received retrieved successfully',
            data: response.data.data || response.data.ratings || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get ratings received');
        }
      })
      .catch((error) => {
        console.error('Get ratings received error:', error);
        throw error;
      });
  },

  /**
   * Get ratings given
   * Requires bidder authentication
   * @returns {Promise} - { success, message, data: [...] }
   */
  getRatingsGiven: () => {
    return axiosInstance
      .get('/api/bidder/profile/ratings/given')
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Ratings given retrieved successfully',
            data: response.data.data || response.data.ratings || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get ratings given');
        }
      })
      .catch((error) => {
        console.error('Get ratings given error:', error);
        throw error;
      });
  },

  /**
   * Get items needing rating
   * Requires bidder authentication
   * @returns {Promise} - { success, message, data: [...] }
   */
  getItemsNeedingRating: () => {
    return axiosInstance
      .get('/api/bidder/profile/ratings/pending')
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Items needing rating retrieved successfully',
            data: response.data.data || response.data.items || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get items needing rating');
        }
      })
      .catch((error) => {
        console.error('Get items needing rating error:', error);
        throw error;
      });
  },
};

export default bidderApi;

