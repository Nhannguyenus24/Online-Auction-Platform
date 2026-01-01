/**
 * Admin API utilities
 * 
 * This file exports adminApi object containing all admin-related API calls.
 * Used by: Admin Dashboard, Category Management, Product Management
 */

import axiosInstance from '../utils/axios';

/**
 * Admin API response structure from backend:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   ...other specific fields
 * }
 */

export const adminApi = {
  /**
   * Get all users with pagination and search
   * Requires admin authentication
   * @param {string} searchQuery - Search query (name, email, or phone)
   * @param {string} roleFilter - Role filter (bidder, seller, admin)
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Promise} - Users data
   */
  getAllUsers: async (searchQuery = '', roleFilter = '', page = 1, pageSize = 20) => {
    try {
      const response = await axiosInstance.get('/api/admin/users', {
        params: { searchQuery, roleFilter, page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  },

  /**
   * Get user statistics
   * Requires admin authentication
   * @param {string} roleFilter - Role filter (bidder, seller, admin)
   * @returns {Promise} - User statistics data
   */
  getUserStatistics: async (roleFilter = '') => {
    try {
      const response = await axiosInstance.get('/api/admin/statistics/users', {
        params: { roleFilter }
      });
      return response.data;
    } catch (error) {
      console.error('Get user statistics error:', error);
      throw error;
    }
  },

  /**
   * Get registration statistics
   * Requires admin authentication
   * @param {string} period - Period type (daily, monthly, yearly)
   * @param {number} limit - Number of periods to return
   * @returns {Promise} - Registration statistics data
   */
  getRegistrationStatistics: async (period, limit = 30) => {
    try {
      const response = await axiosInstance.get('/api/admin/statistics/registrations', {
        params: { period, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get registration statistics error:', error);
      throw error;
    }
  },

  /**
   * Get profit statistics
   * Requires admin authentication
   * @param {string} month - Month in format YYYY-MM
   * @param {string} year - Year in format YYYY
   * @returns {Promise} - Profit statistics data
   */
  getProfitStatistics: async (month = '', year = '') => {
    try {
      const response = await axiosInstance.get('/api/admin/statistics/profit', {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      console.error('Get profit statistics error:', error);
      throw error;
    }
  },

  /**
   * Get upgrade requests
   * Requires admin authentication
   * @param {string} statusFilter - Status filter (pending, approved, rejected)
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Promise} - Upgrade requests data
   */
  getUpgradeRequests: async (statusFilter = '', page = 1, pageSize = 20) => {
    try {
      const response = await axiosInstance.get('/api/admin/upgrade-requests', {
        params: { statusFilter, page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Get upgrade requests error:', error);
      throw error;
    }
  },

  /**
   * Process upgrade request (approve or reject)
   * Requires admin authentication
   * @param {number} requestId - Request ID
   * @param {string} action - Action to perform (approve, reject)
   * @param {string} reason - Reason for rejection (optional)
   * @returns {Promise} - Standard response
   */
  processUpgradeRequest: async (requestId, action, reason = '') => {
    try {
      const response = await axiosInstance.post(`/api/admin/upgrade-requests/${requestId}`, {
        action,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Process upgrade request error:', error);
      throw error;
    }
  },

  /**
   * Create category
   * Requires admin authentication
   * @param {string} name - Category name
   * @param {number} parentId - Parent category ID (0 for root category)
   * @returns {Promise} - Create category response
   */
  createCategory: async (name, parentId = 0) => {
    try {
      const response = await axiosInstance.post('/api/admin/categories', {
        name,
        parentId
      });
      return response.data;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  },

  /**
   * Update category
   * Requires admin authentication
   * @param {number} categoryId - Category ID
   * @param {string} name - Category name
   * @param {number} parentId - Parent category ID (0 for root category)
   * @returns {Promise} - Standard response
   */
  updateCategory: async (categoryId, name, parentId = 0) => {
    try {
      const response = await axiosInstance.put(`/api/admin/categories/${categoryId}`, {
        name,
        parentId
      });
      return response.data;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  },

  /**
   * Delete category
   * Requires admin authentication
   * @param {number} categoryId - Category ID
   * @returns {Promise} - Delete category response
   */
  deleteCategory: async (categoryId) => {
    try {
      const response = await axiosInstance.delete(`/api/admin/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  },

  /**
   * Remove product
   * Requires admin authentication
   * @param {number} productId - Product ID
   * @param {string} reason - Reason for removing the product
   * @returns {Promise} - Remove product response
   */
  removeProduct: async (productId, reason) => {
    try {
      const response = await axiosInstance.delete(`/api/admin/products/${productId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Remove product error:', error);
      throw error;
    }
  }
};

export default adminApi;
