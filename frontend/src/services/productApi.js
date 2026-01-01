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
   * Get product by ID
   * Uses bidder endpoint (requires authentication if user is logged in)
   * Falls back to guest endpoint if available (currently not implemented in backend)
   * @param {number|string} productId - Product ID
   * @returns {Promise} - { success, message, product: {...} }
   */
  getProductById: (productId) => {
    // Try bidder endpoint first (works for both authenticated and unauthenticated users)
    // Note: Backend doesn't have guest endpoint for product by ID yet
    return axiosInstance
      .get(`/api/bidder/products/${productId}`)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Product retrieved successfully',
            product: response.data.product || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get product');
        }
      })
      .catch((error) => {
        // If 403/401, try guest endpoint as fallback (if it exists in future)
        if (error.response?.status === 403 || error.response?.status === 401) {
          return axiosInstance
            .get(`/api/guest/products/${productId}`)
            .then((response) => {
              if (response.data.success) {
                return {
                  success: true,
                  message: response.data.message || 'Product retrieved successfully',
                  product: response.data.product || response.data,
                };
              } else {
                throw new Error(response.data.message || 'Failed to get product');
              }
            })
            .catch((guestError) => {
              console.error('Get product by ID error (both endpoints failed):', guestError);
              throw error; // Throw original error
            });
        }
        console.error('Get product by ID error:', error);
        throw error;
      });
  },

  /**
   * Get bid history for a product
   * No authentication required
   * @param {number|string} productId - Product ID
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @returns {Promise} - { success, message, bids: [...], total, page, limit }
   */
  getBidHistory: (productId, page = 1, limit = 20) => {
    return axiosInstance
      .get(`/api/guest/products/${productId}/bids`, {
        params: { page, limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Bid history retrieved successfully',
            bids: response.data.bids || [],
            total: response.data.total || 0,
            page: response.data.page || page,
            limit: response.data.limit || limit,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get bid history');
        }
      })
      .catch((error) => {
        console.error('Get bid history error:', error);
        throw error;
      });
  },

  /**
   * Get questions for a product
   * No authentication required
   * @param {number|string} productId - Product ID
   * @returns {Promise} - { success, message, questions: [...] }
   */
  getQuestions: (productId) => {
    return axiosInstance
      .get(`/api/guest/products/${productId}/questions`)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Questions retrieved successfully',
            questions: response.data.questions || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get questions');
        }
      })
      .catch((error) => {
        console.error('Get questions error:', error);
        throw error;
      });
  },

  /**
   * Get related products
   * No authentication required
   * @param {number|string} productId - Product ID
   * @returns {Promise} - { success, message, products: [...] }
   */
  getRelatedProducts: (productId) => {
    return axiosInstance
      .get(`/api/guest/products/${productId}/related`)
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

  /**
   * Place a bid on a product
   * Requires bidder authentication
   * @param {number|string} productId - Product ID
   * @param {number} amount - Bid amount
   * @returns {Promise} - { success, message, bid: {...} }
   */
  placeBid: (productId, amount) => {
    return axiosInstance
      .post(`/api/bidder/products/${productId}/bid`, { amount })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Bid placed successfully',
            bid: response.data.bid || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to place bid');
        }
      })
      .catch((error) => {
        console.error('Place bid error:', error);
        throw error;
      });
  },

  /**
   * Ask a question about a product
   * Requires bidder authentication
   * @param {number|string} productId - Product ID
   * @param {string} question - Question text
   * @returns {Promise} - { success, message, question: {...} }
   */
  askQuestion: (productId, question) => {
    return axiosInstance
      .post(`/api/bidder/products/${productId}/questions`, { question })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Question submitted successfully',
            question: response.data.question || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit question');
        }
      })
      .catch((error) => {
        console.error('Ask question error:', error);
        throw error;
      });
  },

  /**
   * Answer a question (seller only)
   * Requires seller authentication
   * @param {number|string} productId - Product ID
   * @param {number|string} questionId - Question ID
   * @param {string} answer - Answer text
   * @returns {Promise} - { success, message, question: {...} }
   */
  answerQuestion: (productId, questionId, answer) => {
    return axiosInstance
      .post(`/api/seller/products/${productId}/questions/${questionId}/answer`, { answer })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Answer submitted successfully',
            question: response.data.question || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit answer');
        }
      })
      .catch((error) => {
        console.error('Answer question error:', error);
        throw error;
      });
  },

  /**
   * Append description to a product (seller only)
   * Requires seller authentication
   * @param {number|string} productId - Product ID
   * @param {string} description - Description text to append
   * @returns {Promise} - { success, message, product: {...} }
   */
  appendDescription: (productId, description) => {
    return axiosInstance
      .put(`/api/seller/products/${productId}`, { description })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Description appended successfully',
            product: response.data.product || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to append description');
        }
      })
      .catch((error) => {
        console.error('Append description error:', error);
        throw error;
      });
  },

  /**
   * Reject a bid from a bidder (seller only)
   * Requires seller authentication
   * @param {number|string} productId - Product ID
   * @param {number|string} bidderId - Bidder ID
   * @returns {Promise} - { success, message }
   */
  rejectBid: (productId, bidderId) => {
    return axiosInstance
      .post(`/api/seller/products/${productId}/reject-bidder/${bidderId}`)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Bid rejected successfully',
          };
        } else {
          throw new Error(response.data.message || 'Failed to reject bid');
        }
      })
      .catch((error) => {
        console.error('Reject bid error:', error);
        throw error;
      });
  },
};

export default productApi;

