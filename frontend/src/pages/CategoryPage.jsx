import { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
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
import { categoryApi } from '../services/categoryApi';
import { productApi } from '../services/productApi';

const CategoryPage = () => {
  const navigate = useNavigate();
  const { parentCategory, childCategory } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState('ending-soon');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Find current parent and child categories from API data
  const currentParent = categories.find(
    (cat) => String(cat.id) === String(parentCategory)
  );
  const currentChild = currentParent?.children?.find(
    (child) => String(child.id) === String(childCategory)
  );

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      }
    };

    fetchCategories();
  }, []);

  // Fetch products when category or filters change
  useEffect(() => {
    const fetchProducts = async () => {
      if (!childCategory && !parentCategory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Use childCategory if available, otherwise use parentCategory
        const categoryId = childCategory || parentCategory;
        const response = await productApi.getProductsByCategory(
          categoryId,
          page,
          itemsPerPage,
          sortBy
        );
        
        setProducts(response.products || []);
        setTotalProducts(response.total || 0);
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
  }, [parentCategory, childCategory, page, sortBy, itemsPerPage]);

  // Calculate pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    if (!endTime) return 'N/A';
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

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1); // Reset to first page when sort changes
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get product image URL
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return 'https://via.placeholder.com/400';
  };

  if (loading && categories.length === 0) {
    return (
      <Page title="Categories - Auction">
        <Container maxWidth="xl" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Page>
    );
  }

  if (error && categories.length === 0) {
    return (
      <Page title="Categories - Auction">
        <Container maxWidth="xl" sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Page>
    );
  }

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
                  📦
                </Typography>
                <Box>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {currentChild?.name || currentParent.name}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {totalProducts} active auctions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            {/* Sidebar - Subcategories */}
            <div style={{ width: "30%" }}>
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
                    {currentParent?.children?.map((subcat) => (
                      <Button
                        key={subcat.id}
                        onClick={() => navigate(`/category/${parentCategory}/${subcat.id}`)}
                        sx={{
                          justifyContent: 'space-between',
                          px: 3,
                          py: 2,
                          borderRadius: 0,
                          bgcolor: String(subcat.id) === String(childCategory) ? 'primary.lighter' : 'transparent',
                          color: String(subcat.id) === String(childCategory) ? 'primary.main' : 'text.primary',
                          fontWeight: String(subcat.id) === String(childCategory) ? 'bold' : 'normal',
                          borderLeft: String(subcat.id) === String(childCategory) ? 3 : 0,
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'grey.100',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography>{subcat.name}</Typography>
                        </Box>
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Products */}
            <div style={{ width: "70%" }}>
              {/* Toolbar */}
              <Card elevation={0} sx={{ 
                mb: 3,
                width:350,
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
                    Showing <strong>{(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, totalProducts)}</strong> of <strong>{totalProducts}</strong> items
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => handleSortChange(e.target.value)}
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
<<<<<<< HEAD
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
              ) : products.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No products found in this category
                  </Typography>
                </Box>
              ) : (
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
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.50' }}>
                          <CardMedia
                            component="img"
                            image={getProductImage(product)}
                            alt={product.title}
=======
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {products.map((product) => (
                  <div style={{ width: '32.33%', key: product.id }}>
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
                      onClick={() => navigate(`/product/${product.id}`)}
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
>>>>>>> 4908400446e374216968da11da063a748a693559
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
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
                              {product.bidsCount || 0} bids
                            </Typography>
                          </Box>
                        </Box>
<<<<<<< HEAD
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
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
                                {getTimeLeft(product.endsAt || product.timeRemaining)} left
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
=======
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
>>>>>>> 4908400446e374216968da11da063a748a693559

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
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
            </div>
          </div>
        </Container>
      </Box>
    </Page>
  );
};

export default CategoryPage;
