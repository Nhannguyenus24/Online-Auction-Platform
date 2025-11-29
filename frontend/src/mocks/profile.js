/**
 * Mock data for Profile Page
 * This file contains sample data for bidding history, won items, etc.
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

// Products currently bidding on
export const mockBiddingHistory = [
  {
    id: 1,
    productId: 101,
    title: 'Luxury Swiss Automatic Watch - Rose Gold',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
    currentPrice: 25000000,
    myBid: 25000000,
    bidCount: 12,
    endTime: getFutureDate(2),
    condition: 'New',
    bidDate: getPastDate(1),
    isHighestBidder: true,
  },
  {
    id: 2,
    productId: 102,
    title: 'MacBook Pro 16" M3 Max - Space Gray',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    currentPrice: 68000000,
    myBid: 65000000,
    bidCount: 28,
    endTime: getFutureDate(5),
    condition: 'New',
    bidDate: getPastDate(2),
    isHighestBidder: false,
  },
  {
    id: 3,
    productId: 103,
    title: 'Sony Alpha 7R V Mirrorless Camera',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
    currentPrice: 47000000,
    myBid: 45000000,
    bidCount: 8,
    endTime: getFutureDate(7),
    condition: 'New',
    bidDate: getPastDate(3),
    isHighestBidder: false,
  },
  {
    id: 4,
    productId: 104,
    title: 'Gaming Laptop ASUS ROG Strix G18',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    currentPrice: 40000000,
    myBid: 40000000,
    bidCount: 15,
    endTime: getFutureDate(4),
    condition: 'New',
    bidDate: getPastDate(0.5),
    isHighestBidder: true,
  },
];

// Won items
export const mockWonItems = [
  {
    id: 1,
    productId: 201,
    title: 'Vintage Rolex Submariner - 1985',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    winningPrice: 120000000,
    endTime: getPastDate(5),
    condition: 'Used',
    wonDate: getPastDate(5),
    status: 'pending_payment', // pending_payment, paid, shipping, completed
    sellerName: 'Seller A',
    sellerRating: 4.8,
  },
  {
    id: 2,
    productId: 202,
    title: 'Designer Leather Handbag - Hermès Style',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    winningPrice: 10000000,
    endTime: getPastDate(10),
    condition: 'Used',
    wonDate: getPastDate(10),
    status: 'completed',
    sellerName: 'Seller B',
    sellerRating: 4.5,
  },
  {
    id: 3,
    productId: 203,
    title: 'Canon EOS R5 Professional Camera Body',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400',
    winningPrice: 55000000,
    endTime: getPastDate(15),
    condition: 'New',
    wonDate: getPastDate(15),
    status: 'shipping',
    sellerName: 'Seller C',
    sellerRating: 4.9,
  },
];

// Mock API functions
export const mockGetBiddingHistory = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockBiddingHistory,
        total: mockBiddingHistory.length,
      });
    }, delay);
  });
};

export const mockGetWonItems = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockWonItems,
        total: mockWonItems.length,
      });
    }, delay);
  });
};

// Ratings received (from others)
export const mockRatingsReceived = [
  {
    id: 1,
    fromUser: 'Seller A',
    fromUserId: 101,
    rating: 1, // +1
    comment: 'Great bidder! Fast payment and smooth transaction.',
    date: getPastDate(5),
    productTitle: 'Vintage Rolex Submariner - 1985',
    productId: 201,
  },
  {
    id: 2,
    fromUser: 'Seller B',
    fromUserId: 102,
    rating: 1, // +1
    comment: 'Excellent communication and quick response. Highly recommended!',
    date: getPastDate(10),
    productTitle: 'Designer Leather Handbag - Hermès Style',
    productId: 202,
  },
  {
    id: 3,
    fromUser: 'Seller C',
    fromUserId: 103,
    rating: -1, // -1
    comment: 'Payment was delayed. Had to wait longer than expected.',
    date: getPastDate(15),
    productTitle: 'Canon EOS R5 Professional Camera Body',
    productId: 203,
  },
  {
    id: 4,
    fromUser: 'Seller D',
    fromUserId: 104,
    rating: 1, // +1
    comment: 'Perfect buyer! Very professional and trustworthy.',
    date: getPastDate(20),
    productTitle: 'Luxury Watch Collection',
    productId: 204,
  },
  {
    id: 5,
    fromUser: 'Seller E',
    fromUserId: 105,
    rating: 1, // +1
    comment: 'Great experience. Would sell to again!',
    date: getPastDate(25),
    productTitle: 'Vintage Camera Set',
    productId: 205,
  },
];

// Ratings given (to sellers)
export const mockRatingsGiven = [
  {
    id: 1,
    toUser: 'Seller A',
    toUserId: 101,
    rating: 1, // +1
    comment: 'Amazing product! Exactly as described. Fast shipping.',
    date: getPastDate(5),
    productTitle: 'Vintage Rolex Submariner - 1985',
    productId: 201,
  },
  {
    id: 2,
    toUser: 'Seller B',
    toUserId: 102,
    rating: 1, // +1
    comment: 'Good seller, product in great condition.',
    date: getPastDate(10),
    productTitle: 'Designer Leather Handbag - Hermès Style',
    productId: 202,
  },
];

// Won items that need rating (completed but not rated yet)
export const mockItemsNeedingRating = [
  {
    id: 2,
    productId: 202,
    title: 'Designer Leather Handbag - Hermès Style',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    sellerName: 'Seller B',
    sellerId: 102,
    completedDate: getPastDate(10),
  },
];

// Mock API functions for ratings
export const mockGetRatingsReceived = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockRatingsReceived,
        total: mockRatingsReceived.length,
      });
    }, delay);
  });
};

export const mockGetRatingsGiven = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockRatingsGiven,
        total: mockRatingsGiven.length,
      });
    }, delay);
  });
};

export const mockGetItemsNeedingRating = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockItemsNeedingRating,
        total: mockItemsNeedingRating.length,
      });
    }, delay);
  });
};

