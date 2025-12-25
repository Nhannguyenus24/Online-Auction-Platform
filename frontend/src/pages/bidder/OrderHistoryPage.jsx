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
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Button,
} from '@mui/material';
import {
  ShoppingCart,
  Visibility,
  Receipt,
  Chat,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';

// Mock order data - replace with API call
const mockBidderOrders = [
  {
    id: 1,
    orderId: '69BTBLZK1',
    productId: 101,
    productTitle: 'Vintage Rolex Submariner',
    productImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300',
    sellerName: 'Luxury Watch Store',
    amount: 245800000,
    status: 'completed',
    orderDate: new Date('2024-01-15'),
    shippingAddress: '123 Main St, Ho Chi Minh City',
  },
  {
    id: 2,
    orderId: 'ORD-002',
    productId: 102,
    productTitle: 'MacBook Pro 16" M3 Max',
    productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
    sellerName: 'Tech Hub',
    amount: 65300000,
    status: 'shipping',
    orderDate: new Date('2024-01-20'),
    shippingAddress: '456 Park Ave, Hanoi',
  },
  {
    id: 3,
    orderId: 'ORD-003',
    productId: 103,
    productTitle: 'Antique Persian Rug',
    productImage: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300',
    sellerName: 'Vintage Collection',
    amount: 12000000,
    status: 'paid',
    orderDate: new Date('2024-01-22'),
    shippingAddress: '789 Ocean Blvd, Da Nang',
  },
];

const mockGetBidderOrders = (delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: mockBidderOrders,
        total: mockBidderOrders.length,
      });
    }, delay);
  });
};

const BidderOrderHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
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
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await mockGetBidderOrders(500);
        setOrders(response.data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Update pagination when data or page size changes
  useEffect(() => {
    const totalItems = orders.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = Math.min(pagination.currentPage, totalPages) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = orders.slice(startIndex, endIndex);

    setPagination({
      currentPage: currentPage,
      currentSize: paginatedData.length,
      totalPages: totalPages,
      totalItems: totalItems,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    });
  }, [orders.length, pageSize]);

  // Get paginated orders
  const paginatedOrders = (() => {
    const startIndex = (pagination.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return orders.slice(startIndex, endIndex);
  })();

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending_payment':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'paid':
      case 'shipping':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'paid':
        return 'Paid';
      case 'shipping':
        return 'Shipping';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Page title="Order History - Bidder Dashboard">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Order History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your purchase history and track your orders
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
              <Receipt sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight={700}>
                My Orders
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              View all your completed purchases
            </Typography>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <ShoppingCart sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Orders Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your order history will appear here once you complete a purchase
                </Typography>
                <Button variant="contained" onClick={() => navigate('/bidder/home')}>
                  Browse Products
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Seller</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Order Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              #{order.orderId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                component="img"
                                src={order.productImage}
                                alt={order.productTitle}
                                sx={{
                                  width: 50,
                                  height: 50,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              />
                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                {order.productTitle}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{order.sellerName}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {formatPrice(order.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(order.status)}
                              size="small"
                              color={getStatusColor(order.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {fVNDate(order.orderDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/product/${order.productId}`)}
                                sx={{ color: 'primary.main' }}
                                title="View Product"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              {order.status === 'completed' && (
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/bidder/chat/${order.orderId}`)}
                                  sx={{ color: 'primary.main' }}
                                  title="Chat with Seller"
                                >
                                  <Chat fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {orders.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 3,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {pagination.currentSize} of {pagination.totalItems} orders
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
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderOrderHistoryPage;

