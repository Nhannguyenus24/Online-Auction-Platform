/**
 * Watchlist API utilities
 * 
 * This file exports watchlistApi object containing all watchlist-related API calls.
 * Used by: Header, ShoppingCartMenu, WatchlistPage
 */

import axiosInstance from '../utils/axios';

export const watchlistApi = {
  /**
   * Get user's watchlist with pagination
   * Requires authentication
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @param {string} status - Filter by status (active, ended, all)
   * @returns {Promise} - { success, message, products: [...], pageInfo }
   */
  getWatchlist: (page = 1, limit = 20, status = 'active') => {
    return axiosInstance.get('/api/bidder/watchlist', {
      params: { page, limit, status }
    }).then((response) => {
      
      const hasSuccess = 'success' in response.data;
      const isSuccess = hasSuccess ? response.data.success : (response.data.products !== undefined);
      
      if (isSuccess) {
        return {
          success: true,
          data: response.data.products || [],
          pageInfo: response.data.pageInfo || {},
          message: response.data.message || 'Watchlist retrieved successfully',
        };
      } else {
        throw new Error(response.data.message || 'Failed to get watchlist');
      }
    }).catch((error) => {
      console.error('Watchlist API Error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    });
  },

  /**
   * Add a product to watchlist
   * Requires authentication
   * @param {number} productId - The product ID to add
   * @returns {Promise} - { success, message, watchlistId }
   */
  addToWatchlist: (productId) => {
    return axiosInstance.post('/api/bidder/watchlist', { productId }).then((response) => {
      
      if (response.data.success) {
        return {
          success: true,
          watchlistId: response.data.watchlistId,
          message: response.data.message || 'Product added to watchlist',
        };
      } else {
        throw new Error(response.data.message || 'Failed to add to watchlist');
      }
    }).catch((error) => {
      console.error('Add to watchlist API Error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    });
  },

  /**
   * Remove a product from watchlist
   * Requires authentication
   * @param {number} productId - The product ID to remove
   * @returns {Promise} - { success, message }
   */
  removeFromWatchlist: (productId) => {
    return axiosInstance.delete(`/api/bidder/watchlist/${productId}`).then((response) => {
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Product removed from watchlist',
        };
      } else {
        throw new Error(response.data.message || 'Failed to remove from watchlist');
      }
    }).catch((error) => {
      console.error('Remove from watchlist API Error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    });
  },
};

export default watchlistApi;
