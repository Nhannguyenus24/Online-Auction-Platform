import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Home,
  NavigateNext,
  AccessTime,
  Visibility,
  Gavel,
  Search,
  Bolt,
} from '@mui/icons-material';
import Page from '../components/Page';
import { formatPrice } from '../utils/formatNumber';
import { normalizeTimestamp } from '../utils/formatTime';
import { productApi } from '../services/productApi';

// Check if product is newly listed (within 30 minutes)
const isNewlyListed = (createdAt) => {
  if (!createdAt) return false;
  const created = normalizeTimestamp(createdAt);
  const now = new Date();
  const diffMinutes = (now - created) / (1000 * 60);
  return diffMinutes <= 30;
};

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  
  // Get search parameters from URL
  const searchQuery = searchParams.get('q') || '';
  const [searchKeyword, setSearchKeyword] = useState(searchQuery);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'ENDING_SOON_DESC');
  const [status, setStatus] = useState(searchParams.get('status') || 'active');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const itemsPerPage = 20;

  // Fetch products when search parameters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await productApi.searchProducts(
          searchQuery,
          page,
          itemsPerPage,
          sortBy,
          status,
          minPrice ? parseFloat(minPrice) : null,
          maxPrice ? parseFloat(maxPrice) : null
        );
        
        setProducts(response.products || []);
        setTotalProducts(response.total || 0);
        setPageInfo(response.pageInfo || {});
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, page, sortBy, status, minPrice, maxPrice]);

  // Calculate pagination
  const totalPages = pageInfo.totalPages || Math.ceil(totalProducts / itemsPerPage);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    if (!endTime) return 'N/A';
    const end = normalizeTimestamp(endTime);
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

  // Handle sort change
  const handleSortChange = (event) => {
    const newSort = event.target.value;
    setSortBy(newSort);
    setPage(1);
    updateURL({ sort: newSort, page: 1 });
  };

  // Handle status change
  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setStatus(newStatus);
    setPage(1);
    updateURL({ status: newStatus, page: 1 });
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    updateURL({ page: value });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    updateURL({ q: searchKeyword, page: 1 });
  };

  // Handle price filter
  const handlePriceFilter = () => {
    setPage(1);
    updateURL({ 
      minPrice: minPrice || undefined, 
      maxPrice: maxPrice || undefined, 
      page: 1 
    });
  };

  // Update URL with new parameters
  const updateURL = (newParams) => {
    const params = {
      q: searchQuery,
      page: page.toString(),
      sort: sortBy,
      status: status,
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...newParams,
    };
    
    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });
    
    setSearchParams(params);
  };

  // Get product image URL
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return 'https://via.placeholder.com/400';
  };

  return (
    <Page title={`Search Results - ${searchQuery || 'All Products'}`}>
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            separator={<NavigateNext fontSize="small" />} 
            sx={{ mb: 3 }}
          >
            <Link
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 20 }} />
              Home
            </Link>
            <Typography color="text.primary" fontWeight="600">
              Search Results
            </Typography>
          </Breadcrumbs>

          {/* Search Bar */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box component="form" onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="Search for products..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" color="primary">
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Paper>

          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
            </Typography>
          </Box>

          {/* Filters and Sort */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Price Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={handlePriceFilter}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Max Price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={handlePriceFilter}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    onChange={handleStatusChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="ended">Ended</MenuItem>
                    <MenuItem value="all">All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Sort By"
                  >
                    <MenuItem value="ENDING_SOON_DESC">Ending Soon</MenuItem>
                    <MenuItem value="ENDING_SOON_ASC">Ending Latest</MenuItem>
                    <MenuItem value="PRICE_ASC">Price: Low to High</MenuItem>
                    <MenuItem value="PRICE_DESC">Price: High to Low</MenuItem>
                    <MenuItem value="NEWEST_FIRST">Newest First</MenuItem>
                    <MenuItem value="OLDEST_FIRST">Oldest First</MenuItem>
                    <MenuItem value="MOST_BIDS">Most Bids</MenuItem>
                    <MenuItem value="MOST_VIEWS">Most Views</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Loading State */}
          {loading && (
            <Grid container spacing={3}>
              {[...Array(20)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Skeleton variant="rectangular" width="100%" height={200} />
                    <CardContent>
                      <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                      <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <Skeleton variant="text" width="100%" height={16} />
                        <Skeleton variant="text" width="100%" height={16} />
                        <Skeleton variant="text" width="70%" height={16} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 8, 
                textAlign: 'center', 
                borderRadius: 2,
                bgcolor: 'white',
              }}
            >
              <Search sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h5" fontWeight="600" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {searchQuery 
                  ? `We couldn't find any products matching "${searchQuery}"`
                  : 'Try adjusting your filters or search for something else'
                }
              </Typography>
            </Paper>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div>
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {/* Product Image */}
                      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.50', overflow: 'hidden' }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={getProductImage(product)}
                          alt={product.title}
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover' 
                          }}
                        />
                        {isNewlyListed(product.createdAt) && (
                          <Chip
                            icon={<Bolt />}
                            label="New"
                            size="small"
                            variant="filled"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                              color: 'white',
                              animation: 'pulse 2s infinite',
                              zIndex: 10,
                              '@keyframes pulse': {
                                '0%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.7)' },
                                '70%': { boxShadow: '0 0 0 6px rgba(255, 107, 107, 0)' },
                                '100%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0)' },
                              },
                            }}
                          />
                        )}
                      </Box>

                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        {/* Title */}
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          gutterBottom
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '3.5em',
                          }}
                        >
                          {product.title}
                        </Typography>

                        {/* Current Price */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Current Bid
                          </Typography>
                          <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {formatPrice(product.currentPrice)}
                          </Typography>
                        </Box>

                        {/* Stats */}
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {getTimeLeft(product.endsAt)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Gavel sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {product.bidsCount || 0} bids
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {product.viewsCount || 0} views
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Status Badge */}
                        {(() => {
                          const status = product.status?.toLowerCase() || 'active';
                          const statusMap = {
                            'active': { label: 'Active', color: 'success' },
                            'ended': { label: 'Ended', color: 'default' },
                            'pending': { label: 'Pending', color: 'warning' },
                            'cancelled': { label: 'Cancelled', color: 'error' },
                          };
                          const statusInfo = statusMap[status] || { label: status, color: 'default' };
                          return (
                            <Chip
                              label={statusInfo.label}
                              size="small"
                              color={statusInfo.color}
                              sx={{ fontWeight: 'bold' }}
                            />
                          );
                        })()}
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
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </div>
          )}
        </Container>
      </Box>
    </Page>
  );
};

export default SearchResultsPage;
