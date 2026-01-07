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
   * @param {string} filter - Filter (all, winning, outbid, won, lost) (default 'all')
   * @returns {Promise} - { success, message, data: [...], pageInfo: {...} }
   */
  getBiddingHistory: (page = 1, limit = 20, filter = 'all') => {
    return axiosInstance
      .get('/api/bidder/bids', {
        params: { page, limit, filter },
      })
      .then((response) => {
        if (response.data.success) {
          console.log('Bidding history response data:', response.data);
          return {
            success: true,
            message: response.data.message || 'Bidding history retrieved successfully',
            data: response.data.bids || [],
            pageInfo: response.data.pageInfo || {},
            page: response.data.pageInfo?.currentPage || page,
            limit: response.data.pageInfo?.pageSize || limit,
            total: response.data.pageInfo?.totalItems || 0,
            totalPages: response.data.pageInfo?.totalPages || 1,
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
   * @returns {Promise} - { success, message, data: [...], pageInfo: {...} }
   */
  getWonItems: (page = 1, limit = 20) => {
    return axiosInstance
      .get('/api/bidder/bids', {
        params: { page, limit, filter: 'won' },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Won items retrieved successfully',
            data: response.data.bids || [],
            pageInfo: response.data.pageInfo || {},
            page: response.data.pageInfo?.currentPage || page,
            limit: response.data.pageInfo?.pageSize || limit,
            total: response.data.pageInfo?.totalItems || 0,
            totalPages: response.data.pageInfo?.totalPages || 1,
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
   * Get bidder ratings and reviews
   * Requires bidder authentication
   * @param {number} page - Page number (default 1)
   * @param {number} pageSize - Items per page (default 20)
   * @returns {Promise} - { success, reviews: [...], positiveReviews, negativeReviews, ratingPercent, totalCount }
   */
  getRatings: (page = 1, pageSize = 20) => {
    return axiosInstance
      .get('/api/bidder/ratings', {
        params: { page, pageSize },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            reviews: response.data.reviews || [],
            positiveReviews: response.data.positiveReviews || 0,
            negativeReviews: response.data.negativeReviews || 0,
            ratingPercent: response.data.ratingPercent || 0,
            totalCount: response.data.totalCount || 0,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get ratings');
        }
      })
      .catch((error) => {
        console.error('Get ratings error:', error);
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

  /**
   * Request role upgrade to seller
   * Requires bidder authentication
   * @returns {Promise} - { success, message, requestId }
   */
  requestRoleUpgrade: () => {
    return axiosInstance
      .post('/api/bidder/upgrade-request')
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Upgrade request submitted successfully',
            requestId: response.data.requestId || 0,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit upgrade request');
        }
      })
      .catch((error) => {
        console.error('Request role upgrade error:', error);
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      });
  },

  /**
   * Get role upgrade request status
   * Requires bidder authentication
   * @returns {Promise} - { success, hasRequest, status, createdAt, updatedAt, adminComment, message }
   */
  getRoleUpgradeStatus: () => {
    return axiosInstance
      .get('/api/bidder/role-upgrade-status')
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            hasRequest: response.data.hasRequest || false,
            status: response.data.status || 'not_found',
            createdAt: response.data.createdAt || 0,
            updatedAt: response.data.updatedAt || 0,
            adminComment: response.data.adminComment || '',
            message: response.data.message || 'Status retrieved successfully',
          };
        } else {
          throw new Error(response.data.message || 'Failed to get upgrade status');
        }
      })
      .catch((error) => {
        console.error('Get role upgrade status error:', error);
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      });
  },
};

export default bidderApi;

