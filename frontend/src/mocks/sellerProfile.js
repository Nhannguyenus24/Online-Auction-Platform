/**
 * Mock data for Seller Profile Page
 * This file contains sample data for seller's products, won items, orders, etc.
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

// Seller's active products (currently listed)
export const mockSellerProducts = [
  {
    id: 1,
    productId: 301,
    title: 'Luxury Swiss Automatic Watch - Rose Gold',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
    currentPrice: 25000000,
    startingPrice: 20000000,
    bidCount: 12,
    endTime: getFutureDate(2),
    condition: 'New',
    status: 'active', // active, ended
    views: 156,
    createdAt: getPastDate(5),
  },
  {
    id: 2,
    productId: 302,
    title: 'MacBook Pro 16" M3 Max - Space Gray',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    currentPrice: 65000000,
    startingPrice: 60000000,
    bidCount: 28,
    endTime: getFutureDate(5),
    condition: 'New',
    status: 'active',
    views: 342,
    createdAt: getPastDate(3),
  },
  {
    id: 3,
    productId: 303,
    title: 'Sony Alpha 7R V Mirrorless Camera',
    image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
    currentPrice: 45000000,
    startingPrice: 40000000,
    bidCount: 8,
    endTime: getFutureDate(7),
    condition: 'New',
    status: 'active',
    views: 89,
    createdAt: getPastDate(2),
  },
  {
    id: 4,
    productId: 304,
    title: 'Gaming Laptop ASUS ROG Strix G18',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    currentPrice: 38000000,
    startingPrice: 35000000,
    bidCount: 15,
    endTime: getFutureDate(4),
    condition: 'New',
    status: 'active',
    views: 201,
    createdAt: getPastDate(1),
  },
];

// Seller's products that have winners
export const mockSellerWonItems = [
  {
    id: 1,
    productId: 401,
    title: 'Vintage Rolex Submariner - 1985',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    winningPrice: 120000000,
    endTime: getPastDate(5),
    condition: 'Used',
    wonDate: getPastDate(5),
    winnerName: 'Bidder A',
    winnerId: 201,
    status: 'pending_payment', // pending_payment, paid, shipping, completed
    canRate: true,
  },
  {
    id: 2,
    productId: 402,
    title: 'Designer Leather Handbag - Hermès Style',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    winningPrice: 10000000,
    endTime: getPastDate(10),
    condition: 'Used',
    wonDate: getPastDate(10),
    winnerName: 'Bidder B',
    winnerId: 202,
    status: 'completed',
    canRate: true,
  },
  {
    id: 3,
    productId: 403,
    title: 'Canon EOS R5 Professional Camera Body',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400',
    winningPrice: 55000000,
    endTime: getPastDate(15),
    condition: 'New',
    wonDate: getPastDate(15),
    winnerName: 'Bidder C',
    winnerId: 203,
    status: 'shipping',
    canRate: false,
  },
];

// Seller's orders (products sold)
export const mockSellerOrders = [
  {
    id: 1,
    orderId: 'ORD-001',
    productId: 401,
    productTitle: 'Vintage Rolex Submariner - 1985',
    productImage: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    buyerName: 'Bidder A',
    buyerId: 201,
    amount: 120000000,
    status: 'pending_payment', // pending_payment, paid, shipping, completed, cancelled
    orderDate: getPastDate(5),
    paymentDate: null,
    shippingDate: null,
    completedDate: null,
  },
  {
    id: 2,
    orderId: 'ORD-002',
    productId: 402,
    productTitle: 'Designer Leather Handbag - Hermès Style',
    productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    buyerName: 'Bidder B',
    buyerId: 202,
    amount: 10000000,
    status: 'completed',
    orderDate: getPastDate(10),
    paymentDate: getPastDate(9),
    shippingDate: getPastDate(8),
    completedDate: getPastDate(5),
  },
  {
    id: 3,
    orderId: 'ORD-003',
    productId: 403,
    productTitle: 'Canon EOS R5 Professional Camera Body',
    productImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400',
    buyerName: 'Bidder C',
    buyerId: 203,
    amount: 55000000,
    status: 'shipping',
    orderDate: getPastDate(15),
    paymentDate: getPastDate(14),
    shippingDate: getPastDate(13),
    completedDate: null,
  },
];

// Mock API functions
export const mockGetSellerProducts = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockSellerProducts,
        total: mockSellerProducts.length,
      });
    }, delay);
  });
};

export const mockGetSellerWonItems = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockSellerWonItems,
        total: mockSellerWonItems.length,
      });
    }, delay);
  });
};

export const mockGetSellerOrders = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockSellerOrders,
        total: mockSellerOrders.length,
      });
    }, delay);
  });
};

// Ratings received (from winners/bidders)
export const mockSellerRatingsReceived = [
  {
    id: 1,
    fromUser: 'Bidder A',
    fromUserId: 201,
    rating: 1, // +1
    comment: 'Great seller! Product exactly as described. Fast shipping and excellent communication.',
    date: getPastDate(5),
    productTitle: 'Vintage Rolex Submariner - 1985',
    productId: 401,
  },
  {
    id: 2,
    fromUser: 'Bidder B',
    fromUserId: 202,
    rating: 1, // +1
    comment: 'Amazing experience! Highly recommended seller.',
    date: getPastDate(10),
    productTitle: 'Designer Leather Handbag - Hermès Style',
    productId: 402,
  },
  {
    id: 3,
    fromUser: 'Bidder C',
    fromUserId: 203,
    rating: -1, // -1
    comment: 'Product arrived damaged. Poor packaging.',
    date: getPastDate(15),
    productTitle: 'Canon EOS R5 Professional Camera Body',
    productId: 403,
  },
  {
    id: 4,
    fromUser: 'Bidder D',
    fromUserId: 204,
    rating: 1, // +1
    comment: 'Perfect transaction! Will buy from again.',
    date: getPastDate(20),
    productTitle: 'Luxury Watch Collection',
    productId: 404,
  },
];

// Ratings given (to winners)
export const mockSellerRatingsGiven = [
  {
    id: 1,
    toUser: 'Bidder A',
    toUserId: 201,
    rating: 1, // +1
    comment: 'Great buyer! Fast payment and smooth transaction.',
    date: getPastDate(5),
    productTitle: 'Vintage Rolex Submariner - 1985',
    productId: 401,
  },
  {
    id: 2,
    toUser: 'Bidder B',
    toUserId: 202,
    rating: 1, // +1
    comment: 'Excellent communication. Highly recommended!',
    date: getPastDate(10),
    productTitle: 'Designer Leather Handbag - Hermès Style',
    productId: 402,
  },
];

// Won items that need rating (completed but seller hasn't rated winner yet)
export const mockSellerItemsNeedingRating = [
  {
    id: 1,
    productId: 401,
    title: 'Vintage Rolex Submariner - 1985',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    winnerName: 'Bidder A',
    winnerId: 201,
    completedDate: getPastDate(5),
  },
];

// Mock API functions for seller ratings
export const mockGetSellerRatingsReceived = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockSellerRatingsReceived,
        total: mockSellerRatingsReceived.length,
      });
    }, delay);
  });
};

export const mockGetSellerRatingsGiven = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockSellerRatingsGiven,
        total: mockSellerRatingsGiven.length,
      });
    }, delay);
  });
};

export const mockGetSellerItemsNeedingRating = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockSellerItemsNeedingRating,
        total: mockSellerItemsNeedingRating.length,
      });
    }, delay);
  });
};

