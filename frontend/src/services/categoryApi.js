/**
 * Category API utilities
 * 
 * This file exports categoryApi object containing all category-related API calls.
 * Used by: CategorySelector, CreateAuctionPage, CategoryPage
 */

import axiosInstance from '../utils/axios';

/**
 * Category API response structure:
 * {
 *   success: boolean,
 *   message: string,
 *   categories: [
 *     {
 *       id: number,
 *       name: string,
 *       createdAt: number,
 *       children: [
 *         {
 *           id: number,
 *           name: string,
 *           createdAt: number
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

export const categoryApi = {
  /**
   * Get all categories with 2 levels (parent and children)
   * No authentication required
   * @returns {Promise} - { success, message, categories: [{ id, name, createdAt, children: [...] }] }
   */
  getCategories: () => {
    return axiosInstance.get('/api/guest/categories').then((response) => {
      // Backend returns { success, message, categories }
      // We'll return the data in a consistent format
      if (response.data.success) {
        const categories = response.data.categories || [];
        return {
          success: true,
          data: categories,
          message: response.data.message || 'Categories retrieved successfully',
        };
      } else {
        throw new Error(response.data.message || 'Failed to get categories');
      }
    }).catch((error) => {
      console.error('Categories API Error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    });
  },
};

export default categoryApi;

