import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Breadcrumbs,
  Link,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import {
  Home,
  NavigateNext,
  AccessTime,
  LocalOffer,
  TrendingUp,
} from '@mui/icons-material';
import Page from '../components/Page';
import { formatPrice } from '../utils/formatNumber';

// Mock data for 2-level categories
const mockCategories = {
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    children: [
      { id: 'watches', name: 'Watches', icon: '⌚', count: 45 },
      { id: 'laptops', name: 'Laptops', icon: '💻', count: 38 },
      { id: 'smartphones', name: 'Smartphones', icon: '📱', count: 52 },
      { id: 'headphones', name: 'Headphones', icon: '🎧', count: 29 },
      { id: 'cameras', name: 'Cameras', icon: '📷', count: 23 },
    ],
  },
  fashion: {
    id: 'fashion',
    name: 'Fashion',
    children: [
      { id: 'mens-clothing', name: "Men's Clothing", icon: '👔', count: 67 },
      { id: 'womens-clothing', name: "Women's Clothing", icon: '👗', count: 89 },
      { id: 'shoes', name: 'Shoes', icon: '👟', count: 54 },
      { id: 'accessories', name: 'Accessories', icon: '👜', count: 41 },
    ],
  },
  home: {
    id: 'home',
    name: 'Home & Living',
    children: [
      { id: 'furniture', name: 'Furniture', icon: '🛋️', count: 32 },
      { id: 'decor', name: 'Decor', icon: '🖼️', count: 28 },
      { id: 'kitchen', name: 'Kitchen', icon: '🍳', count: 45 },
      { id: 'garden', name: 'Garden', icon: '🌿', count: 19 },
    ],
  },
  collectibles: {
    id: 'collectibles',
    name: 'Collectibles',
    children: [
      { id: 'art', name: 'Art', icon: '🎨', count: 25 },
      { id: 'coins', name: 'Coins', icon: '🪙', count: 18 },
      { id: 'stamps', name: 'Stamps', icon: '📮', count: 12 },
      { id: 'antiques', name: 'Antiques', icon: '🏺', count: 34 },
    ],
  },
};

// Mock products data
const mockProducts = {
  watches: [
    {
      id: 1,
      title: 'Luxury Swiss Automatic Watch - Rose Gold',
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
      currentPrice: 25000000,
      bidCount: 23,
      endTime: '2025-11-28T15:30:00',
      condition: 'New',
      featured: true,
    },
    {
      id: 2,
      title: 'Vintage Chronograph Watch - Leather Strap',
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400',
      currentPrice: 8500000,
      bidCount: 15,
      endTime: '2025-11-27T18:00:00',
      condition: 'Used',
      featured: false,
    },
    {
      id: 3,
      title: 'Smart Watch Pro - Fitness Tracker',
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
      currentPrice: 4200000,
      bidCount: 31,
      endTime: '2025-11-29T12:00:00',
      condition: 'New',
      featured: true,
    },
    {
      id: 4,
      title: 'Diver Watch - 200m Water Resistant',
      image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400',
      currentPrice: 12000000,
      bidCount: 18,
      endTime: '2025-11-28T20:00:00',
      condition: 'New',
      featured: false,
    },
    {
      id: 5,
      title: 'Classic Dress Watch - Minimalist Design',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400',
      currentPrice: 6800000,
      bidCount: 12,
      endTime: '2025-11-27T14:00:00',
      condition: 'New',
      featured: false,
    },
    {
      id: 6,
      title: 'Pilot Watch - Aviation Collection',
      image: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=400',
      currentPrice: 15500000,
      bidCount: 27,
      endTime: '2025-11-30T10:00:00',
      condition: 'New',
      featured: true,
    },
  ],
  laptops: [
    {
      id: 7,
      title: 'Gaming Laptop RTX 4090 - 32GB RAM',
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
      currentPrice: 45000000,
      bidCount: 42,
      endTime: '2025-11-28T16:00:00',
      condition: 'New',
      featured: true,
    },
    {
      id: 8,
      title: 'MacBook Pro 16" M3 Max - Space Gray',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      currentPrice: 65000000,
      bidCount: 38,
      endTime: '2025-11-29T14:00:00',
      condition: 'New',
      featured: true,
    },
  ],
};

const CategoryPage = () => {
  const navigate = useNavigate();
  const { parentCategory, childCategory } = useParams();
  
  const [sortBy, setSortBy] = useState('ending-soon');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Get current category data
  const currentParent = mockCategories[parentCategory] || mockCategories.electronics;
  const currentChild = currentParent.children.find(c => c.id === childCategory);
  
  // Get products for current category
  const allProducts = mockProducts[childCategory] || mockProducts.watches;
  
  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const products = allProducts.slice(startIndex, endIndex);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Page title={`${currentChild?.name || currentParent.name} - Auction`}>
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          {/* Breadcrumbs */}
          <Card elevation={0} sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Breadcrumbs 
                separator={<NavigateNext fontSize="small" />}
                sx={{ 
                  '& .MuiBreadcrumbs-separator': { mx: 1 }
                }}
              >
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate('/')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    textDecoration: 'none',
                    '&:hover': { color: 'primary.main' },
                    transition: 'color 0.2s'
                  }}
                >
                  <Home fontSize="small" />
                  Home
                </Link>
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate(`/category/${parentCategory}`)}
                  sx={{
                    color: childCategory ? 'text.secondary' : 'text.primary',
                    textDecoration: 'none',
                    fontWeight: childCategory ? 400 : 600,
                    '&:hover': { color: 'primary.main' },
                    transition: 'color 0.2s'
                  }}
                >
                  {currentParent.name}
                </Link>
                {currentChild && (
                  <Typography variant="body1" color="text.primary" fontWeight={600}>
                    {currentChild.name}
                  </Typography>
                )}
              </Breadcrumbs>
            </CardContent>
          </Card>

          {/* Category Header */}
          <Card elevation={0} sx={{ 
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
            }} />
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h2" sx={{ fontSize: '3rem' }}>
                  {currentChild?.icon || '📦'}
                </Typography>
                <Box>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {currentChild?.name || currentParent.name}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {allProducts.length} active auctions • {currentChild?.count || 45} total items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Sidebar - Subcategories */}
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ 
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                position: 'sticky',
                top: 20
              }}>
                <Box sx={{ 
                  p: 2.5, 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  <Typography variant="h6" fontWeight="bold">
                    Subcategories
                  </Typography>
                </Box>
                <CardContent sx={{ p: 0 }}>
                  <Stack spacing={0}>
                    {currentParent.children.map((subcat) => (
                      <Button
                        key={subcat.id}
                        onClick={() => navigate(`/category/${parentCategory}/${subcat.id}`)}
                        sx={{
                          justifyContent: 'space-between',
                          px: 3,
                          py: 2,
                          borderRadius: 0,
                          bgcolor: subcat.id === childCategory ? 'primary.lighter' : 'transparent',
                          color: subcat.id === childCategory ? 'primary.main' : 'text.primary',
                          fontWeight: subcat.id === childCategory ? 'bold' : 'normal',
                          borderLeft: subcat.id === childCategory ? 3 : 0,
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'grey.100',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>{subcat.icon}</Typography>
                          <Typography>{subcat.name}</Typography>
                        </Box>
                        <Chip 
                          label={subcat.count} 
                          size="small" 
                          color={subcat.id === childCategory ? 'primary' : 'default'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Main Content - Products */}
            <Grid item xs={12} md={9}>
              {/* Toolbar */}
              <Card elevation={0} sx={{ 
                mb: 3,
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
              }}>
                <CardContent sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 2
                }}>
                  <Typography variant="body1" color="text.secondary">
                    Showing <strong>{startIndex + 1}-{Math.min(endIndex, allProducts.length)}</strong> of <strong>{allProducts.length}</strong> items
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="ending-soon">Ending Soon</MenuItem>
                      <MenuItem value="newly-listed">Newly Listed</MenuItem>
                      <MenuItem value="price-low">Price: Low to High</MenuItem>
                      <MenuItem value="price-high">Price: High to Low</MenuItem>
                      <MenuItem value="most-bids">Most Bids</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>

              {/* Products Grid */}
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} lg={4} key={product.id}>
                    <Card
                      elevation={0}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          transform: 'translateY(-4px)',
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.50' }}>
                        <CardMedia
                          component="img"
                          image={product.image}
                          alt={product.title}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {product.featured && (
                          <Chip
                            icon={<TrendingUp sx={{ fontSize: 16 }} />}
                            label="Featured"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              bgcolor: 'rgba(255,193,7,0.95)',
                              color: 'grey.900',
                              fontWeight: 'bold',
                              backdropFilter: 'blur(10px)',
                            }}
                          />
                        )}
                        <Box sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(10px)',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1.5,
                          boxShadow: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}>
                          <LocalOffer sx={{ fontSize: 14, color: 'primary.main' }} />
                          <Typography variant="caption" fontWeight="bold" color="primary">
                            {product.bidCount} bids
                          </Typography>
                        </Box>
                      </Box>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                          <Chip 
                            label={product.condition} 
                            size="small" 
                            color={product.condition === 'New' ? 'success' : 'default'}
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: 56,
                            fontWeight: 600,
                            lineHeight: 1.4,
                            fontSize: '1rem',
                            mb: 2,
                          }}
                        >
                          {product.title}
                        </Typography>
                        <Box sx={{ mt: 'auto' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Current Bid
                          </Typography>
                          <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
                            {formatPrice(product.currentPrice)}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              pt: 2,
                              borderTop: 1,
                              borderColor: 'divider',
                            }}
                          >
                            <AccessTime sx={{ fontSize: 18, color: 'error.main' }} />
                            <Typography variant="body2" color="error.main" fontWeight="bold">
                              {getTimeLeft(product.endTime)} left
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => {
                      setPage(value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Page>
  );
};

export default CategoryPage;
