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
};

export default productApi;

