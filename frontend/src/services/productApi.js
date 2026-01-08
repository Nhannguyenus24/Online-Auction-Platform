import axiosInstance from '../utils/axios';

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
   * Get bid history for a product
   * No authentication required
   * @param {number|string} productId - Product ID
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @returns {Promise} - { success, message, bids: [...], total, page, limit }
   */
  getBidHistory: (productId, page = 1, limit = 20) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}/bids`, {
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
   * Get top bidders for a product from Redis
   * No authentication required
   * @param {number|string} productId - Product ID
   * @param {number} limit - Number of top bidders to return (default 5, max 10)
   * @returns {Promise} - { success, message, topBidders: [...] }
   */
  getTopBidders: (productId, limit = 5) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}/top-bidders`, {
        params: { limit },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Top bidders retrieved successfully',
            topBidders: response.data.topBidders || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to get top bidders');
        }
      })
      .catch((error) => {
        console.error('Get top bidders error:', error);
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
   * Get questions for a product
   * No authentication required
   * @param {number|string} productId - Product ID
   * @returns {Promise} - { success, message, questions: [...] }
   */
  getQuestions: (productId) => {
    return axiosInstance
      .get(`/api/bidder/products/${productId}/questions`)
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

  /**
   * Place a bid on a product
   * Requires bidder authentication
   * @param {number|string} productId - Product ID
   * @param {number} amount - Bid amount
   * @returns {Promise} - { success, message, bidId, currentPrice, nextMinBid, isHighestBidder, createdAt }
   */
  placeBid: (productId, amount) => {
    return axiosInstance
      .post(`/api/bidder/products/${productId}/bids`, { bidAmount: amount })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Bid placed successfully',
            bidId: response.data.bidId,
            currentPrice: response.data.currentPrice,
            nextMinBid: response.data.nextMinBid,
            isHighestBidder: response.data.isHighestBidder,
            createdAt: response.data.createdAt,
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
   * @returns {Promise} - { success, message, updatedDescription }
   */
  appendDescription: (productId, description) => {
    return axiosInstance
      .put(`/api/seller/products/${productId}/description`, { additionalDescription: description })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Description appended successfully',
            updatedDescription: response.data.updatedDescription,
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
   * @param {string} reason - Reason for rejection (optional)
   * @returns {Promise} - { success, message }
   */
  rejectBid: (productId, bidderId, reason = '') => {
    return axiosInstance
      .post(`/api/seller/products/${productId}/reject-bidder`, {
        bidderId,
        reason
      })
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

  /**
   * Get products by category
   * No authentication required
   * @param {number|string} categoryId - Category ID (level 2 category)
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @param {string} sort - Sort option (default 'ending-soon')
   *   Options: 'ending-soon', 'newly-listed', 'price-low', 'price-high', 'most-bids'
   *   Maps to: 'ENDING_SOON_DESC', 'NEWEST_FIRST', 'PRICE_ASC', 'PRICE_DESC', 'MOST_BIDS'
   * @returns {Promise} - { success, message, products: [...], total, page, limit }
   */
  getProductsByCategory: (categoryId, page = 1, limit = 20, sort = 'ending-soon') => {
    // Map frontend sort values to backend sortOrder values
    const sortOrderMap = {
      'ending-soon': 'ENDING_SOON_DESC',
      'newly-listed': 'NEWEST_FIRST',
      'price-low': 'PRICE_ASC',
      'price-high': 'PRICE_DESC',
      'most-bids': 'MOST_BIDS',
    };
    const sortOrder = sortOrderMap[sort] || 'ENDING_SOON_DESC';

    return axiosInstance
      .get('/api/guest/products/by-category', {
        params: { 
          categoryId, 
          page, 
          limit, 
          sortOrder,
          status: 'active', // Only show active products
        },
      })
      .then((response) => {
        if (response.data.success) {
          // Backend returns pageInfo object, extract values
          const pageInfo = response.data.pageInfo || {};
          return {
            success: true,
            message: response.data.message || 'Products retrieved successfully',
            products: response.data.products || [],
            total: pageInfo.totalItems || 0,
            page: pageInfo.currentPage || page,
            limit: pageInfo.pageSize || limit,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get products by category');
        }
      })
      .catch((error) => {
        console.error('Get products by category error:', error);
        throw error;
      });
  },

  /**
   * Search products by name
   * No authentication required
   * @param {string} searchKeyword - Search keyword
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @param {string} sortOrder - Sort order (default: 'ENDING_SOON_DESC')
   * @param {string} status - Product status filter (default: 'active')
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Promise} - { success, message, products: [...], total, page, limit }
   */
  searchProducts: (searchKeyword = '', page = 1, limit = 20, sortOrder = 'ENDING_SOON_DESC', status = 'active', minPrice = null, maxPrice = null) => {
    const params = {
      searchKeyword,
      page,
      limit,
      sortOrder,
      status,
    };

    // Add optional price filters if provided
    if (minPrice !== null && minPrice !== undefined) {
      params.minPrice = minPrice;
    }
    if (maxPrice !== null && maxPrice !== undefined) {
      params.maxPrice = maxPrice;
    }

    return axiosInstance
      .get('/api/guest/products/search', { params })
      .then((response) => {
        if (response.data.success) {
          const pageInfo = response.data.pageInfo || {};
          return {
            success: true,
            message: response.data.message || 'Products retrieved successfully',
            products: response.data.products || [],
            total: pageInfo.totalItems || 0,
            page: pageInfo.currentPage || page,
            limit: pageInfo.pageSize || limit,
            pageInfo: pageInfo,
          };
        } else {
          throw new Error(response.data.message || 'Failed to search products');
        }
      })
      .catch((error) => {
        console.error('Search products error:', error);
        throw error;
      });
  },

  /**
   * Buy now product
   * Requires authentication
   * @param {number} productId - Product ID
   * @returns {Promise} - { success, message, orderId, price, createdAt }
   */
  buyNowProduct: (productId) => {
    return axiosInstance
      .post(`/api/bidder/products/${productId}/buy-now`)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Product purchased successfully',
            orderId: response.data.orderId,
            price: response.data.price,
            createdAt: response.data.createdAt,
          };
        } else {
          throw new Error(response.data.message || 'Failed to purchase product');
        }
      })
      .catch((error) => {
        console.error('Buy now product error:', error);
        throw error;
      });
  },
};

export default productApi;

