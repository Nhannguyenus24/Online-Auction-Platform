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

