/**
 * Mock data for Watch List
 * This file contains sample product data for testing the Watch List UI
 * before connecting to the real API
 */

// Generate a future date (N days from now)
const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + Math.floor(Math.random() * 24));
  date.setMinutes(date.getMinutes() + Math.floor(Math.random() * 60));
  return date.toISOString();
};

// Generate a past date (N days ago)
const getPastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const mockWatchListProducts = [
  {
    id: 1,
    title: 'Luxury Swiss Automatic Watch - Rose Gold',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
    currentPrice: 25000000,
    buyNowPrice: 35000000,
    bidCount: 12,
    endTime: getFutureDate(2),
    condition: 'New',
  },
  {
    id: 2,
    title: 'MacBook Pro 16" M3 Max - Space Gray',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    currentPrice: 65000000,
    buyNowPrice: 75000000,
    bidCount: 28,
    endTime: getFutureDate(5),
    condition: 'New',
  },
  {
    id: 3,
    title: 'Vintage Rolex Submariner - 1985',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    currentPrice: 120000000,
    buyNowPrice: null,
    bidCount: 45,
    endTime: getFutureDate(1),
    condition: 'Used',
  },
  {
    id: 4,
    title: 'Sony Alpha 7R V Mirrorless Camera',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
    currentPrice: 45000000,
    buyNowPrice: 55000000,
    bidCount: 8,
    endTime: getFutureDate(7),
    condition: 'New',
  },
  {
    id: 5,
    title: 'Designer Leather Handbag - Hermès Style',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    currentPrice: 8500000,
    buyNowPrice: 12000000,
    bidCount: 19,
    endTime: getFutureDate(3),
    condition: 'Used',
  },
  {
    id: 6,
    title: 'Gaming Laptop ASUS ROG Strix G18',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    currentPrice: 38000000,
    buyNowPrice: 45000000,
    bidCount: 15,
    endTime: getFutureDate(4),
    condition: 'New',
  },
  {
    id: 7,
    title: 'Vintage Vinyl Record Collection - 50 Albums',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    currentPrice: 3200000,
    buyNowPrice: null,
    bidCount: 6,
    endTime: getFutureDate(6),
    condition: 'Used',
  },
  {
    id: 8,
    title: 'Canon EOS R5 Professional Camera Body',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400',
    currentPrice: 52000000,
    buyNowPrice: 60000000,
    bidCount: 22,
    endTime: getFutureDate(2),
    condition: 'New',
  },
];

export const mockEmptyWatchList = [];

/**
 * Mock API response structure
 * This simulates what the real API might return
 */
export const mockWatchListResponse = {
  success: true,
  data: mockWatchListProducts,
  total: mockWatchListProducts.length,
  message: 'Watch list retrieved successfully',
};

/**
 * Mock API function to simulate fetching watch list
 * @param {boolean} empty - Set to true to return empty list
 * @param {number} delay - Simulate network delay in ms
 * @returns {Promise} Promise that resolves with watch list data
 */
export const mockGetWatchList = (empty = false, delay = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (empty) {
        resolve({
          success: true,
          data: [],
          total: 0,
          message: 'Watch list is empty',
        });
      } else {
        resolve(mockWatchListResponse);
      }
    }, delay);
  });
};

/**
 * Mock API function to simulate removing product from watch list
 * @param {number} productId - Product ID to remove
 * @param {number} delay - Simulate network delay in ms
 * @returns {Promise} Promise that resolves with success response
 */
export const mockRemoveFromWatchList = (productId, delay = 300) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Product ${productId} removed from watch list`,
      });
    }, delay);
  });
};

/**
 * Mock API function to simulate adding product to watch list
 * @param {number} productId - Product ID to add
 * @param {number} delay - Simulate network delay in ms
 * @returns {Promise} Promise that resolves with success response
 */
export const mockAddToWatchList = (productId, delay = 300) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Product ${productId} added to watch list`,
      });
    }, delay);
  });
};

