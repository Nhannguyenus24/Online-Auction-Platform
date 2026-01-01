/**
 * Product API utilities
 * 
 * This file exports productApi object containing all product-related API calls.
 * Used by: HomePage, CategoryPage, ProductDetailPage
 */

import axiosInstance from '../utils/axios';

/**
 * Product API response structure from backend:
 * {
 *   success: boolean,
 *   message: string,
 *   products: [
 *     {
 *       id, title, currentPrice, startingPrice, stepPrice, buyNowPrice,
 *       images: [{ id, productId, url, isPrimary, createdAt }],
 *       sellerName, sellerRatingPercent,
 *       bidsCount, viewsCount,
 *       endsAt, status, timeRemaining,
 *       highestBidderMasked
 *     }
 *   ]
 * }
 */

export const productApi = {
  /**
   * Get top products ending soon
   * No authentication required
   * @param {number} limit - Number of products to return (max 20, default 5)
   * @returns {Promise} - { success, message, products: [...] }
   */
  getTopEndingProducts: (limit = 5) => {
    return axiosInstance
      .get('/api/guest/products/top-ending', {
        params: { limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Top ending products retrieved successfully',
            products: response.data.products || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get top ending products');
        }
      })
      .catch((error) => {
        console.error('Get top ending products error:', error);
        throw error;
      });
  },

  /**
   * Get top products with most bids
   * No authentication required
   * @param {number} limit - Number of products to return (max 20, default 5)
   * @returns {Promise} - { success, message, products: [...] }
   */
  getTopBidCountProducts: (limit = 5) => {
    return axiosInstance
      .get('/api/guest/products/top-bids', {
        params: { limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Top bid count products retrieved successfully',
            products: response.data.products || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get top bid count products');
        }
      })
      .catch((error) => {
        console.error('Get top bid count products error:', error);
        throw error;
      });
  },

  /**
   * Get top products with highest price
   * No authentication required
   * @param {number} limit - Number of products to return (max 20, default 5)
   * @returns {Promise} - { success, message, products: [...] }
   */
  getTopPriceProducts: (limit = 5) => {
    return axiosInstance
      .get('/api/guest/products/top-price', {
        params: { limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Top price products retrieved successfully',
            products: response.data.products || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get top price products');
        }
      })
      .catch((error) => {
        console.error('Get top price products error:', error);
        throw error;
      });
  },

  /**
   * Get product details
   * Requires authentication (bidder endpoint)
   * @param {number} productId - Product ID
   * @returns {Promise} - { success, message, product: {...} }
   */
  getProductDetails: (productId) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}`)
      .then((response) => {
        if (response.data.success && response.data.product) {
          return {
            success: true,
            message: response.data.message || 'Product details retrieved successfully',
            product: response.data.product,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get product details');
        }
      })
      .catch((error) => {
        console.error('Get product details error:', error);
        throw error;
      });
  },

  /**
   * Get product bid history
   * Requires authentication
   * @param {number} productId - Product ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @returns {Promise} - { success, message, bids: [...], pageInfo: {...} }
   */
  getProductBids: (productId, page = 1, limit = 20) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}/bids`, {
        params: { page, limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Product bids retrieved successfully',
            bids: response.data.bids || [],
            pageInfo: response.data.pageInfo || {},
          };
        } else {
          throw new Error(response.data.message || 'Failed to get product bids');
        }
      })
      .catch((error) => {
        console.error('Get product bids error:', error);
        throw error;
      });
  },

  /**
   * Get product questions
   * Requires authentication
   * @param {number} productId - Product ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @returns {Promise} - { success, message, questions: [...], pageInfo: {...} }
   */
  getProductQuestions: (productId, page = 1, limit = 20) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}/questions`, {
        params: { page, limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Product questions retrieved successfully',
            questions: response.data.questions || [],
            pageInfo: response.data.pageInfo || {},
          };
        } else {
          throw new Error(response.data.message || 'Failed to get product questions');
        }
      })
      .catch((error) => {
        console.error('Get product questions error:', error);
        throw error;
      });
  },

  /**
   * Get related products
   * Requires authentication
   * @param {number} productId - Product ID
   * @param {number} limit - Number of products to return (default: 5, max: 20)
   * @returns {Promise} - { success, message, products: [...] }
   */
  getRelatedProducts: (productId, limit = 5) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}/related`, {
        params: { limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Related products retrieved successfully',
            products: response.data.products || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get related products');
        }
      })
      .catch((error) => {
        console.error('Get related products error:', error);
        throw error;
      });
  },
};

export default productApi;

