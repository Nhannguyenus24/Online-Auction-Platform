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
   * @param {number} amount - Amount in dollars
   * @param {string} currency - Currency code (default: 'usd')
   * @returns {Promise} - { success, clientSecret, paymentIntentId }
   */
  createPaymentIntent: (amount, currency = 'usd') => {
    return axiosInstance
      .post('/api/payment/create-payment-intent', { amount, currency })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            clientSecret: response.data.clientSecret,
            paymentIntentId: response.data.paymentIntentId,
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
   * @param {string} paymentIntentId - Payment intent ID from Stripe
   * @returns {Promise} - { success, message }
   */
  confirmPayment: (paymentIntentId) => {
    return axiosInstance
      .post('/api/payment/confirm-payment', { paymentIntentId })
      .then((response) => {
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'Payment confirmed successfully',
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


