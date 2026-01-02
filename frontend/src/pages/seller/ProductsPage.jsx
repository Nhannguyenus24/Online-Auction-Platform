import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
} from '@mui/material';
import {
  Inventory,
  AccessTime,
  Gavel,
  Visibility,
  AddBox,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { sellerApi } from '../../services/sellerApi';

const SellerProductsPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Active (Đang bid), 2: Not Started (Chưa bid)
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    currentSize: 10,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all active listings with a large page size to get all data
        const response = await sellerApi.getListings('active', 1, 500);
        // Map the response to match the expected format
        const mappedProducts = (response.listings || []).map((listing) => {
          // Parse endsAt timestamp (can be string or number)
          let endTime = null;
          if (listing.endsAt) {
            const timestamp = typeof listing.endsAt === 'string' ? parseInt(listing.endsAt) : listing.endsAt;
            endTime = new Date(timestamp).toISOString();
          }
          
          return {
            id: listing.id,
            productId: listing.id,
            title: listing.title,
            status: listing.status,
            currentPrice: listing.currentPrice || 0,
            startingPrice: listing.currentPrice || 0, // Use currentPrice as fallback since startingPrice not in response
            bidCount: listing.bidsCount || 0,
            views: 0, // Not available in listings endpoint
            endTime: endTime,
            image: null, // Not available in listings endpoint - will show placeholder
            condition: null, // Not available in listings endpoint
          };
        });
        setAllProducts(mappedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTimeLeft = (endTime) => {
    if (!endTime) return 'N/A';
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
    if (hours > 0) return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    return `${pad(minutes)}m ${pad(seconds)}s`;
  };

  const hasStartedBidding = (product) => {
    return (product.bidCount || 0) > 0;
  };

  // Get filtered products based on tab
  const getFilteredProducts = () => {
    const now = new Date();

    switch (tabValue) {
      case 1: // Active (Đang bid) - có bids và chưa ended
        return allProducts.filter((product) => {
          const endTime = new Date(product.endTime);
          return hasStartedBidding(product) && endTime > now && product.status === 'active';
        });
      case 2: // Not Started (Chưa bid) - chưa có bids
        return allProducts.filter((product) => {
          return !hasStartedBidding(product) && product.status === 'active';
        });
      default: // All
        return allProducts.filter((product) => product.status === 'active');
    }
  };

  const filteredProducts = getFilteredProducts();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Update pagination when filtered data or page size changes
  useEffect(() => {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = Math.min(pagination.currentPage, totalPages) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredProducts.slice(startIndex, endIndex);

    setPagination({
      currentPage: currentPage,
      currentSize: paginatedData.length,
      totalPages: totalPages,
      totalItems: totalItems,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts.length, pageSize, pagination.currentPage]);

  // Get paginated products
  const paginatedProducts = (() => {
    const startIndex = (pagination.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  })();

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const getStatusChip = (product) => {
    const now = new Date();
    const endTime = new Date(product.endTime);
    const isEnded = endTime <= now;
    const hasBids = hasStartedBidding(product);

    if (isEnded) {
      return { label: 'Ended', color: 'default', icon: <Cancel /> };
    }
    if (hasBids) {
      return { label: 'Active', color: 'success', icon: <CheckCircle /> };
    }
    return { label: 'Not Started', color: 'warning', icon: <AccessTime /> };
  };

  return (
    <Page title="My Products - Seller Dashboard">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            My Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your auction listings
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Inventory sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight={700}>
                My Listings
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              View and manage all your auction products
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory /> All ({allProducts.filter((p) => p.status === 'active').length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Gavel /> Bidding Started ({allProducts.filter((p) => {
                      const now = new Date();
                      const endTime = new Date(p.endTime);
                      return hasStartedBidding(p) && endTime > now && p.status === 'active';
                    }).length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime /> Not Bid Yet ({allProducts.filter((p) => {
                      return !hasStartedBidding(p) && p.status === 'active';
                    }).length})
                  </Box>
                }
              />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <Inventory sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {tabValue === 1
                    ? 'No Active Listings with Bids'
                    : tabValue === 2
                    ? 'No Listings Waiting for Bids'
                    : 'No Active Listings'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {tabValue === 1
                    ? 'You have no active listings with bids at the moment.'
                    : tabValue === 2
                    ? 'All your listings have received bids.'
                    : 'Start selling by creating your first auction listing'}
                </Typography>
                {tabValue === 2 && (
                  <Button variant="contained" onClick={() => navigate('/seller/create-auction')} startIcon={<AddBox />}>
                    Create Auction
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Starting Price
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Current Price
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Bids
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Views
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Status
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Time Left
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedProducts.map((product) => {
                        const status = getStatusChip(product);
                        const hasBids = hasStartedBidding(product);

                        return (
                          <TableRow
                            key={product.id}
                            hover
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: hasBids ? 'rgba(76, 175, 80, 0.04)' : 'inherit',
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                  component="img"
                                  src={product.image || '/logo.png'}
                                  alt={product.title}
                                  onError={(e) => {
                                    e.target.src = '/logo.png';
                                  }}
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                />
                                <Box>
                                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    {product.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {product.condition && (
                                      <Chip
                                        label={product.condition}
                                        size="small"
                                        color={product.condition === 'New' ? 'success' : 'default'}
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={600} color="text.secondary">
                                {formatPrice(product.startingPrice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={hasBids ? 'primary' : 'text.secondary'}
                              >
                                {formatPrice(product.currentPrice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={<Gavel sx={{ fontSize: 12 }} />}
                                label={product.bidCount || 0}
                                size="small"
                                color={hasBids ? 'primary' : 'default'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary">
                                {product.views || 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={status.icon}
                                label={status.label}
                                size="small"
                                color={status.color}
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" color="error.main" fontWeight="bold">
                                {getTimeLeft(product.endTime)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/product/${product.productId || product.id}`)}
                                sx={{ color: 'primary.main' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {filteredProducts.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 3,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {pagination.currentSize} of {pagination.totalItems} products
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Page Size</InputLabel>
                        <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={20}>20</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </Typography>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default SellerProductsPage;

