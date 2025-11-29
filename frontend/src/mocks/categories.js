// Mock categories data (2-level structure)
export const mockCategories = [
  {
    id: 'electronics',
    name: 'Electronics',
    children: [
      { id: 'watches', name: 'Watches' },
      { id: 'laptops', name: 'Laptops' },
      { id: 'smartphones', name: 'Smartphones' },
      { id: 'headphones', name: 'Headphones' },
      { id: 'cameras', name: 'Cameras' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    children: [
      { id: 'mens-clothing', name: "Men's Clothing" },
      { id: 'womens-clothing', name: "Women's Clothing" },
      { id: 'shoes', name: 'Shoes' },
      { id: 'accessories', name: 'Accessories' },
    ],
  },
  {
    id: 'home',
    name: 'Home & Living',
    children: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'decor', name: 'Decor' },
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'garden', name: 'Garden' },
    ],
  },
  {
    id: 'collectibles',
    name: 'Collectibles',
    children: [
      { id: 'art', name: 'Art' },
      { id: 'coins', name: 'Coins' },
      { id: 'stamps', name: 'Stamps' },
      { id: 'antiques', name: 'Antiques' },
    ],
  },
  {
    id: 'sports',
    name: 'Sports & Outdoors',
    children: [
      { id: 'fitness', name: 'Fitness Equipment' },
      { id: 'outdoor', name: 'Outdoor Gear' },
      { id: 'sports-memorabilia', name: 'Sports Memorabilia' },
    ],
  },
  {
    id: 'books',
    name: 'Books & Media',
    children: [
      { id: 'books', name: 'Books' },
      { id: 'comics', name: 'Comics & Manga' },
      { id: 'music', name: 'Music & Vinyl' },
    ],
  },
];

// Mock API function to get categories
export const mockGetCategories = async (delay = 300) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return {
    data: mockCategories,
    success: true,
  };
};

