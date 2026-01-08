/**
 * Order API utilities
 * 
 * This file exports orderApi object containing all order-related API calls.
 * Used by: CheckoutPage, OrderCompletionPage, OrderHistoryPage
 */

import axiosInstance from '../utils/axios';

/**
 * Order API response structure from backend:
 * {
 *   success: boolean,
 *   message: string,
 *   order: {
 *     id, productId, productTitle, productImage,
 *     winningPrice, shippingFee, totalAmount,
 *     seller: { id, name, rating, avatar },
 *     status, paymentMethod, shippingAddress,
 *     sellerConfirmed, shippingInvoice, receivedConfirmed,
 *     buyerRating, sellerRating, wonDate
 *   }
 * }
 */

export const orderApi = {
  /**
   * Get list of orders for the authenticated bidder
   * Requires bidder authentication
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20, max: 100)
   * @param {string} status - Status filter (all, pending, completed, cancelled) (default: 'all')
   * @returns {Promise} - { success, message, orders: [...], pageInfo: {...} }
   */
  getOrders: (page = 1, limit = 20, status = 'all') => {
    return axiosInstance
      .get('/api/bidder/orders', {
        params: { page, limit, status },
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Orders retrieved successfully',
            orders: response.data.orders || [],
            pageInfo: response.data.pageInfo || {},
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
   * Get order by ID
   * Requires bidder authentication
   * @param {number|string} orderId - Order ID
   * @returns {Promise} - { success, message, order: {...} }
   */
  getOrder: (orderId) => {
    return axiosInstance
      .get(`/api/bidder/orders/${orderId}`)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Order retrieved successfully',
            order: response.data.order || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to get order');
        }
      })
      .catch((error) => {
        console.error('Get order error:', error);
        throw error;
      });
  },

  /**
   * Submit payment for an order
   * Requires bidder authentication
   * @param {number|string} orderId - Order ID
   * @param {object} paymentData - Payment data { method, ... }
   * @returns {Promise} - { success, message, order: {...} }
   */
  submitPayment: (orderId, paymentData) => {
    return axiosInstance
      .post(`/api/bidder/orders/${orderId}/pay`, paymentData)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Payment submitted successfully',
            order: response.data.order || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit payment');
        }
      })
      .catch((error) => {
        console.error('Submit payment error:', error);
        throw error;
      });
  },

  /**
   * Submit shipping address for an order
   * Requires bidder authentication
   * @param {number|string} orderId - Order ID
   * @param {object} address - Shipping address { fullName, phone, address, city, postalCode }
   * @returns {Promise} - { success, message, order: {...} }
   */
  submitShipping: (orderId, address) => {
    return axiosInstance
      .put(`/api/bidder/orders/${orderId}/shipping`, address)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Shipping address submitted successfully',
            order: response.data.order || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit shipping address');
        }
      })
      .catch((error) => {
        console.error('Submit shipping error:', error);
        throw error;
      });
  },

  /**
   * Confirm received item for an order
   * Requires bidder authentication
   * @param {number|string} orderId - Order ID
   * @returns {Promise} - { success, message, order: {...} }
   */
  confirmReceive: (orderId) => {
    return axiosInstance
      .put(`/api/bidder/orders/${orderId}/confirm-receive`)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Receive confirmed successfully',
            order: response.data.order || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to confirm receive');
        }
      })
      .catch((error) => {
        console.error('Confirm receive error:', error);
        throw error;
      });
  },

  /**
   * Rate seller for an order
   * Requires bidder authentication
   * @param {number|string} orderId - Order ID
   * @param {number} rating - Rating value (1-5)
   * @param {string} comment - Optional comment
   * @returns {Promise} - { success, message, order: {...} }
   */
  rateSeller: (orderId, rating, comment = '') => {
    return axiosInstance
      .post(`/api/bidder/orders/${orderId}/rate`, { rating, comment })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Rating submitted successfully',
            order: response.data.order || response.data,
          };
        } else {
          throw new Error(response.data.message || 'Failed to submit rating');
        }
      })
      .catch((error) => {
        console.error('Rate seller error:', error);
        throw error;
      });
  },

  /**
   * Create Stripe payment intent
   * Requires authentication
   * @param {number|string|null} orderId - Order ID (optional, if provided will fetch order amount)
   * @param {number|null} amount - Amount in dollars (required if orderId not provided)
   * @param {string} currency - Currency code (default: 'usd')
   * @param {string|null} shippingAddress - Shipping address (optional)
   * @returns {Promise} - { success, clientSecret, paymentIntentId, orderId, amount, currency }
   */
  createPaymentIntent: (orderId = null, amount = null, currency = 'usd', shippingAddress = null) => {
    const requestBody = { currency };
    if (orderId !== null && orderId !== undefined) {
      requestBody.orderId = orderId;
    }
    if (amount !== null && amount !== undefined) {
      requestBody.amount = amount;
    }
    if (shippingAddress !== null && shippingAddress !== undefined && shippingAddress.trim() !== '') {
      requestBody.shippingAddress = shippingAddress;
    }
    
    return axiosInstance
      .post('/api/create-payment-intent', requestBody)
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            clientSecret: response.data.clientSecret,
            paymentIntentId: response.data.paymentIntentId,
            orderId: response.data.orderId,
            amount: response.data.amount,
            currency: response.data.currency,
          };
        } else {
          throw new Error(response.data.message || 'Failed to create payment intent');
        }
      })
      .catch((error) => {
        console.error('Create payment intent error:', error);
        throw error;
      });
  },

  /**
   * Confirm payment after successful Stripe payment
   * Requires authentication
   * @param {number|string} orderId - Order ID
   * @param {string} paymentIntentId - Stripe Payment Intent ID
   * @returns {Promise} - { success, message, order: {...} }
   */
  confirmPayment: (orderId, paymentIntentId) => {
    return axiosInstance
      .post('/api/confirm-payment', {
        orderId,
        paymentIntentId,
      })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Payment confirmed successfully',
            order: response.data.order,
          };
        } else {
          throw new Error(response.data.message || 'Failed to confirm payment');
        }
      })
      .catch((error) => {
        console.error('Confirm payment error:', error);
        throw error;
      });
  },
};

export default orderApi;


