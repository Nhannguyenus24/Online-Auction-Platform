/**
 * Seller API utilities
 * 
 * This file exports sellerApi object containing all seller-related API calls.
 * Used by: Seller HomePage, ProductsPage, OrdersPage, ProfilePage
 */

import axiosInstance from '../utils/axios';

/**
 * Seller API response structure from backend:
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

export const sellerApi = {
  /**
   * Get active listings
   * Requires seller authentication
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @param {string} status - Status filter (default 'active')
   * @returns {Promise} - { success, message, data: [...], page, limit, total, totalPages }
   */
  getActiveListings: (page = 1, limit = 20, status = 'active') => {
    return axiosInstance
      .get('/api/seller/profile/products', {
        params: { page, limit, status },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Active listings retrieved successfully',
            data: response.data.data || response.data.products || [],
            page: response.data.page || page,
            limit: response.data.limit || limit,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 1,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get active listings');
        }
      })
      .catch((error) => {
        console.error('Get active listings error:', error);
        throw error;
      });
  },

  /**
   * Get winner items
   * Requires seller authentication
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @returns {Promise} - { success, message, data: [...], page, limit, total, totalPages }
   */
  getWinnerItems: (page = 1, limit = 20) => {
    return axiosInstance
      .get('/api/seller/profile/products/wins', {
        params: { page, limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Winner items retrieved successfully',
            data: response.data.data || response.data.products || [],
            page: response.data.page || page,
            limit: response.data.limit || limit,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 1,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get winner items');
        }
      })
      .catch((error) => {
        console.error('Get winner items error:', error);
        throw error;
      });
  },

  /**
   * Get orders
   * Requires seller authentication
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @param {string} status - Status filter (optional)
   * @returns {Promise} - { success, message, data: [...], page, limit, total, totalPages }
   */
  getOrders: (page = 1, limit = 20, status = null) => {
    const params = { page, limit };
    if (status) {
      params.status = status;
    }
    return axiosInstance
      .get('/api/seller/orders', {
        params,
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Orders retrieved successfully',
            data: response.data.data || response.data.orders || [],
            page: response.data.page || page,
            limit: response.data.limit || limit,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 1,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get orders');
        }
      })
      .catch((error) => {
        console.error('Get orders error:', error);
        throw error;
      });
  },

  /**
   * Get ratings received
   * Requires seller authentication
   * @returns {Promise} - { success, message, data: [...] }
   */
  getRatingsReceived: () => {
    return axiosInstance
      .get('/api/seller/profile/ratings/received')
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
   * Requires seller authentication
   * @returns {Promise} - { success, message, data: [...] }
   */
  getRatingsGiven: () => {
    return axiosInstance
      .get('/api/seller/profile/ratings/given')
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
   * Requires seller authentication
   * @returns {Promise} - { success, message, data: [...] }
   */
  getItemsNeedingRating: () => {
    return axiosInstance
      .get('/api/seller/profile/ratings/pending')
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
   * Confirm payment receipt
   * Requires seller authentication
   * @param {string|number} orderId - Order ID
   * @param {string} invoice - Invoice number or proof
   * @returns {Promise} - { success, message }
   */
  confirmPaymentReceipt: (orderId, invoice) => {
    return axiosInstance
      .put(`/api/seller/orders/${orderId}/confirm-payment`, { invoice })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Payment receipt confirmed successfully',
            data: response.data.data || response.data.order,
          };
        } else {
          throw new Error(response.data.message || 'Failed to confirm payment receipt');
        }
      })
      .catch((error) => {
        console.error('Confirm payment receipt error:', error);
        throw error;
      });
  },

  /**
   * Rate bidder
   * Requires seller authentication
   * @param {string|number} orderId - Order ID
   * @param {number} rating - Rating value (1 or -1)
   * @param {string} comment - Optional comment
   * @returns {Promise} - { success, message }
   */
  rateBidder: (orderId, rating, comment = '') => {
    return axiosInstance
      .post(`/api/seller/orders/${orderId}/rate`, { rating, comment })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Rating submitted successfully',
            data: response.data.data || response.data.rating,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit rating');
        }
      })
      .catch((error) => {
        console.error('Rate bidder error:', error);
        throw error;
      });
  },
};

export default sellerApi;

