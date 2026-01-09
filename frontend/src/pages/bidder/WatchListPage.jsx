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
  Button,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  AccessTime,
  Gavel,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  Visibility,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { normalizeTimestamp } from '../../utils/formatTime';
import { watchlistApi } from '../../services/watchlistApi';

const BidderWatchListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [watchList, setWatchList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    currentSize: 10,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('active'); // active, ended, all

  useEffect(() => {
    const fetchWatchList = async () => {
      try {
        setLoading(true);
        const response = await watchlistApi.getWatchlist(
          pagination.currentPage,
          pageSize,
          statusFilter
        );
        
        if (response.success) {
          setWatchList(response.data || []);
          // Update pagination from API response
          if (response.pageInfo) {
            setPagination({
              currentPage: response.pageInfo.currentPage || 1,
              currentSize: response.pageInfo.pageSize || response.data?.length || 0,
              totalPages: response.pageInfo.totalPages || 1,
              totalItems: response.pageInfo.totalItems || 0,
              hasNext: response.pageInfo.hasNext || false,
              hasPrevious: response.pageInfo.hasPrevious || false,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching watch list:', err);
        setWatchList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchList();
  }, [pagination.currentPage, pageSize, statusFilter]);

  // Remove the old useEffect that recalculates pagination

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Calculate time left
  const getTimeLeft = (endTime) => {
    const end = normalizeTimestamp(endTime);
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

  const handleRemoveFromWatchList = async (productId, event) => {
    event.stopPropagation();
    try {
      await watchlistApi.removeFromWatchlist(productId);
      // Remove from local state
      setWatchList((prev) => prev.filter((item) => item.id !== productId));
      // Update total items count
      setPagination((prev) => ({
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1),
      }));
    } catch (error) {
      console.error('Error removing from watch list:', error);
      // Optionally show error notification to user
    }
  };

  return (
    <Page title="Watch List - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            My Watch List
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Products you've saved for later
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FavoriteIcon /> Watch List ({watchList.length})
            </Typography>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : watchList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <FavoriteIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Your Watch List is Empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start exploring products and add them to your watch list to keep track of auctions you're interested in.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/')}>
                  Browse Products
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Current Price
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Buy Now Price
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Bids
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
                    {watchList.map((product) => {
                      const endTime = normalizeTimestamp(product.endsAt || product.endTime);
                      const now = new Date();
                      const isEnded = endTime <= now || product.status === 'ended';

                      return (
                        <TableRow
                          key={product.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                component="img"
                                src={product.images?.[0]?.url || product.image || '/placeholder-image.jpg'}
                                alt={product.title}
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
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {formatPrice(product.currentPrice)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {product.buyNowPrice ? (
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {formatPrice(product.buyNowPrice)}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<Gavel sx={{ fontSize: 12 }} />}
                              label={product.bidsCount || product.bidCount || 0}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {isEnded ? (
                              <Typography variant="caption" color="text.secondary">
                                Ended
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                <AccessTime sx={{ fontSize: 14, color: 'error.main' }} />
                                <Typography variant="caption" color="error.main" fontWeight="bold">
                                  {getTimeLeft(product.endsAt || product.endTime)}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/product/${product.id}`);
                                }}
                                title="View Product"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleRemoveFromWatchList(product.id, e)}
                                title="Remove from Watch List"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {!loading && watchList.length > 0 && (
              <Box
                sx={{
                  p: 3,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {pagination.currentSize} of {pagination.totalItems} items
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Page Size</InputLabel>
                    <Select
                      value={pageSize}
                      label="Page Size"
                      onChange={handlePageSizeChange}
                    >
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
                    shape="rounded"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderWatchListPage;
