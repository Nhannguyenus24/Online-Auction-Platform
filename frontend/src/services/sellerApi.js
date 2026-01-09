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
   * Get listings
   * Requires seller authentication
   * @param {string} filter - Status filter (active, expired, all) (default 'all')
   * @param {number} page - Page number (default 1)
   * @param {number} pageSize - Items per page (default 20)
   * @returns {Promise} - { success, listings: [...], page, pageSize, totalCount }
   */
  getListings: (filter = 'all', page = 1, pageSize = 20) => {
    return axiosInstance
      .get('/api/seller/listings', {
        params: { filter, page, pageSize },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: 'Listings retrieved successfully',
            listings: response.data.listings || [],
            page: response.data.page || page,
            pageSize: response.data.pageSize || pageSize,
            totalCount: response.data.totalCount || 0,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get listings');
        }
      })
      .catch((error) => {
        console.error('Get listings error:', error);
        throw error;
      });
  },

  /**
   * Get active listings
   * Requires seller authentication
   * @param {number} page - Page number (default 1)
   * @param {number} pageSize - Items per page (default 20)
   * @returns {Promise} - { success, products: [...], page, pageSize, totalCount }
   */
  getActiveListings: (page = 1, pageSize = 20) => {
    return axiosInstance
      .get('/api/seller/active-listings', {
        params: { page, pageSize },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: 'Active listings retrieved successfully',
            products: response.data.products || [],
            page: response.data.page || page,
            pageSize: response.data.pageSize || pageSize,
            totalCount: response.data.totalCount || 0,
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
   * @param {number} pageSize - Items per page (default 20)
   * @returns {Promise} - { success, products: [...], page, pageSize, totalCount }
   */
  getWinnerItems: (page = 1, pageSize = 20) => {
    return axiosInstance
      .get('/api/seller/winner-items', {
        params: { page, pageSize },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: 'Winner items retrieved successfully',
            products: response.data.products || [],
            page: response.data.page || page,
            pageSize: response.data.pageSize || pageSize,
            totalCount: response.data.totalCount || 0,
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
   * @param {number} pageSize - Items per page (default 20)
   * @param {string} statusFilter - Status filter (pending, completed, cancelled, all) (default 'all')
   * @returns {Promise} - { success, orders: [...], page, pageSize, totalCount }
   */
  getOrders: (page = 1, pageSize = 20, statusFilter = 'all') => {
    return axiosInstance
      .get('/api/seller/orders', {
        params: { page, pageSize, statusFilter },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: 'Orders retrieved successfully',
            orders: response.data.orders || [],
            page: response.data.page || page,
            pageSize: response.data.pageSize || pageSize,
            totalCount: response.data.totalCount || 0,
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
   * Update order status
   * Requires seller authentication
   * @param {number|string} orderId - Order ID
   * @param {string} status - New status (pending, processing, shipped, delivered, cancelled)
   * @returns {Promise} - { success, message, order: {...} }
   */
  updateOrderStatus: (orderId, status) => {
    return axiosInstance
      .patch(`/api/seller/orders/${orderId}/status`, { status })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Order status updated successfully',
            order: response.data.order,
          };
        } else {
          throw new Error(response.data.message || 'Failed to update order status');
        }
      })
      .catch((error) => {
        console.error('Update order status error:', error);
        throw error;
      });
  },

  /**
   * Get seller ratings and reviews
   * Requires seller authentication
   * @param {number} page - Page number (default 1)
   * @param {number} pageSize - Items per page (default 20)
   * @returns {Promise} - { success, reviews: [...], positiveReviews, negativeReviews, ratingPercent, totalCount }
   */
  getRatings: (page = 1, pageSize = 20) => {
    return axiosInstance
      .get('/api/seller/ratings', {
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

  /**
   * Create auction listing
   * Requires seller authentication
   * @param {Object} listingData - Listing data
   * @param {string} listingData.title - Product title
   * @param {string} listingData.description - Product description (HTML)
   * @param {number|string} listingData.categoryId - Category ID (child category)
   * @param {number|string} listingData.startingPrice - Starting price
   * @param {number|string} listingData.stepPrice - Bid increment (step price)
   * @param {string} listingData.startsAt - Start date/time (format: yyyy-MM-dd'T'HH:mm:ss)
   * @param {string} listingData.endsAt - End date/time (format: yyyy-MM-dd'T'HH:mm:ss)
   * @param {number|string|null} listingData.buyNowPrice - Optional buy now price
   * @param {boolean|string} listingData.isAutoExtend - Optional auto-extend flag
   * @param {number|string|null} listingData.autoExtendSeconds - Optional auto-extend duration in seconds
   * @param {File[]} listingData.images - Array of image files (max 4)
   * @returns {Promise} - { success, message, productId, imageUrls }
   */
  createAuctionListing: (listingData) => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', listingData.title);
    formData.append('description', listingData.description);
    formData.append('categoryId', String(listingData.categoryId));
    formData.append('startingPrice', String(listingData.startingPrice));
    formData.append('stepPrice', String(listingData.stepPrice));
    formData.append('startsAt', listingData.startsAt);
    formData.append('endsAt', listingData.endsAt);
    
    // Add optional fields
    if (listingData.buyNowPrice != null && listingData.buyNowPrice !== '') {
      formData.append('buyNowPrice', String(listingData.buyNowPrice));
    }
    if (listingData.isAutoExtend != null) {
      formData.append('isAutoExtend', String(listingData.isAutoExtend));
    }
    if (listingData.autoExtendSeconds != null && listingData.autoExtendSeconds !== '') {
      formData.append('autoExtendSeconds', String(listingData.autoExtendSeconds));
    }
    
    // Add image files
    if (listingData.images && listingData.images.length > 0) {
      listingData.images.forEach((imageFile) => {
        formData.append('images', imageFile);
      });
    }
    
    return axiosInstance
      .post('/api/seller/listings', formData)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Auction listing created successfully',
            productId: response.data.productId,
            imageUrls: response.data.imageUrls || [],
          };
        } else {
          throw new Error(response.data.message || 'Failed to create auction listing');
        }
      })
      .catch((error) => {
        console.error('Create auction listing error:', error);
        throw error;
      });
  },
};

export default sellerApi;

