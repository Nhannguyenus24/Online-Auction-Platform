/**
 * Authentication API utilities
 * 
 * This file exports authApi object containing all authentication-related API calls.
 * Used by: JWTContext, Header, Login, Register, ProfilePage, ResetPassword, ForgotPassword
 * 
 * DO NOT DELETE - This file is actively used throughout the application
 */

import axiosInstance from './axios';
import { fSQLDate } from './formatTime';

const appendToFormData = (formData, prefix, value) => {
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        Object.keys(item).forEach((itemKey) => {
          appendToFormData(formData, `${prefix}[${index}][${itemKey}]`, item[itemKey]);
        });
      });
    } else if (value instanceof Date) {
      const formattedValue = fSQLDate(value);
      formData.append(prefix, formattedValue);
    } else if (value instanceof File) {
      formData.append(prefix, value);
    } else if (value !== undefined && value !== null) {
      // eslint-disable-next-line no-prototype-builtins
      if (value.hasOwnProperty('value')) {
        formData.append(prefix, value.value);
      } else {
        const isAddressProperty = prefix.toLowerCase().includes('address');
        // Convert object to JSON string if it's an address property
        if (isAddressProperty) {
          const jsonValue = JSON.stringify(value);
          formData.append(prefix, jsonValue);
        } else {
          Object.keys(value).forEach((key) => {
            appendToFormData(formData, `${prefix}[${key}]`, value[key]);
          });
        }
      }
    }
  } else {
    formData.append(prefix, value);
  }
};

const convertObjectToFormData = (obj) => {
  const formData = new FormData();

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      appendToFormData(formData, key, value);
    }
  });

  return formData;
};

// ===================== AUTHENTICATION APIS =====================

export const authApi = {
  /**
   * Register a new user
   * @param {Object} data - { email, password, fullName, phoneNumber, address }
   * @returns {Promise} - { success, message, email, userId, otp, otpExpiryMinutes }
   */
  register: (data) => axiosInstance.post('/api/auth/register', data),

  /**
   * Login user
   * @param {Object} data - { email, password }
   * @returns {Promise} - { accessToken, user: { id, email, fullName, roles } }
   */
  login: (data) => {
    return axiosInstance.post('/api/auth/login', data).then((response) => {
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      return response.data;
    });
  },

  /**
   * Login with Google
   * @param {Object} data - { googleIdToken, email, fullName, profilePicture }
   * @returns {Promise} - { accessToken, user: { id, email, fullName, roles } }
   */
  loginWithGoogle: (data) => {
    return axiosInstance.post('/api/auth/google', data).then((response) => {
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      return response.data;
    });
  },

  /**
   * Verify OTP
   * @param {Object} data - { email, otp }
   * @returns {Promise} - { success, message }
   */
  verifyOTP: (data) => axiosInstance.post('/api/auth/verify-otp', data),

  /**
   * Reproduce OTP (resend OTP)
   * @param {Object} data - { email }
   * @returns {Promise} - { success, message }
   */
  reproduceOTP: (data) => axiosInstance.post('/api/auth/reproduce-otp', data),

  /**
   * Refresh access token
   * @returns {Promise} - { accessToken, expiresIn }
   */
  refreshToken: () => {
    return axiosInstance.post('/api/auth/refresh').then((response) => {
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      return response.data;
    });
  },

  /**
   * Logout user
   * @returns {Promise} - { success, message }
   */
  logout: () => {
    return axiosInstance.post('/api/auth/logout').then((response) => {
      localStorage.removeItem('accessToken');
      return response.data;
    }).catch(() => {
      localStorage.removeItem('accessToken');
    });
  },

  /**
   * Validate token
   * @param {string} token - Access token to validate
   * @returns {Promise} - { valid, userId, roles, error }
   */
  validateToken: (token) => axiosInstance.get(`/api/auth/validate?token=${token}`),

  /**
   * Get user profile
   * @returns {Promise} - { profile: { userId, email, fullName, phoneNumber, address, roles, isVerified, createdAt }, message }
   */
  getProfile: () => axiosInstance.get('/api/auth/profile'),

  /**
   * Update user profile
   * @param {Object} data - { fullName, phoneNumber, address }
   * @returns {Promise} - { success, message, profile }
   */
  updateProfile: (data) => axiosInstance.post('/api/auth/profile', data),

  /**
   * Change password
   * @param {Object} data - { oldPassword, newPassword }
   * @returns {Promise} - { success, message }
   */
  changePassword: (data) => axiosInstance.post('/api/auth/change-password', data),

  /**
   * Forgot password - Send OTP to email
   * @param {Object} data - { email }
   * @returns {Promise} - { success, message }
   */
  forgotPassword: (data) => axiosInstance.post('/api/auth/forgot-password', data),

  /**
   * Reset password with OTP
   * @param {Object} data - { email, otp, newPassword }
   * @returns {Promise} - { success, message }
   */
  resetPassword: (data) => axiosInstance.post('/api/auth/reset-password', data),

  /**
   * Get authorization header
   * @returns {Object} - { Authorization: "Bearer <token>" }
   */
  getAuthHeader: () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  /**
   * Get access token
   * @returns {string} - Access token or null
   */
  getAccessToken: () => localStorage.getItem('accessToken'),

  /**
   * Set access token
   * @param {string} token - Access token
   */
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  },
};

export default authApi;