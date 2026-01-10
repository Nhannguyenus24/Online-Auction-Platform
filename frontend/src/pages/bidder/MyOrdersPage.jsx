import { useState, useEffect } from 'react';
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
  Button,
  CircularProgress,
  Pagination,
  Alert,
  Avatar,
} from '@mui/material';
import {
  ShoppingBag,
  Payment,
  CheckCircle,
  Error as ErrorIcon,
  AccessTime,
  LocalShipping,
  Cancel,
  Inventory,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate, normalizeTimestamp } from '../../utils/formatTime';
import { orderApi } from '../../services/orderApi';
import { authApi } from '../../utils/api';
import PaymentModal from '../../components/PaymentModal';
import { set } from 'date-fns';

const BidderMyOrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter] = useState('all');
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchProfile = async () => {
        try {
          const profileResponse = await authApi.getProfile();
          setUser(profileResponse.data.profile);
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrders(page, pageSize, statusFilter);
      if (response.success) {
        setOrders(response.orders || []);
        setPageInfo(response.pageInfo || {
          currentPage: page,
          pageSize: pageSize,
          totalItems: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    setSelectedOrder(null);
    // Refresh orders list
    await fetchOrders();
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Modal will handle error display
  };

  const handleCloseModal = () => {
    setPaymentModalOpen(false);
    setSelectedOrder(null);
  };

  const getPaymentStatusChip = (paymentStatus) => {
    if (paymentStatus === 'completed') {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Paid"
          color="success"
          size="small"
        />
      );
    } else if (paymentStatus === 'failed') {
      return (
        <Chip
          icon={<ErrorIcon />}
          label="Failed"
          color="error"
          size="small"
        />
      );
    } else {
      return (
        <Chip
          icon={<AccessTime />}
          label="Pending"
          color="warning"
          size="small"
        />
      );
    }
  };

  const getOrderStatusChip = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    // Status mapping with colors and icons
    const statusMap = {
      pending: {
        label: 'Pending',
        color: 'warning',
        icon: <AccessTime />,
      },
      processing: {
        label: 'Processing',
        color: 'info',
        icon: <Inventory />,
      },
      shipped: {
        label: 'Shipped',
        color: 'primary',
        icon: <LocalShipping />,
      },
      delivered: {
        label: 'Delivered',
        color: 'success',
        icon: <CheckCircle />,
      },
      cancelled: {
        label: 'Cancelled',
        color: 'error',
        icon: <Cancel />,
      },
      // Legacy statuses for backward compatibility
      completed: {
        label: 'Completed',
        color: 'success',
        icon: <CheckCircle />,
      },
      paid: {
        label: 'Paid',
        color: 'info',
        icon: <Payment />,
      },
      shipping: {
        label: 'Shipping',
        color: 'primary',
        icon: <LocalShipping />,
      },
    };
    
    const statusInfo = statusMap[statusLower];
    
    if (statusInfo) {
      return (
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
        />
      );
    }
    
    // Fallback for unknown statuses - capitalize first letter
    const capitalizedStatus = status 
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : 'Unknown';
    
    return (
      <Chip
        label={capitalizedStatus}
        color="default"
        size="small"
      />
    );
  };

  if (loading && orders.length === 0) {
    return (
      <Page title="My Orders - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="My Orders - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ShoppingBag sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                My Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage your orders
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Orders Table */}
        <Card>
          <CardContent>
            {orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ShoppingBag sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No orders found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't placed any orders yet.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell>Order Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={order.productImage || 'https://via.placeholder.com/50'}
                                alt={order.productTitle}
                                variant="rounded"
                                sx={{ width: 50, height: 50 }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {order.productTitle || 'Unknown Product'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Order #{order.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {formatPrice(order.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {order.createdAt ? fVNDate(normalizeTimestamp(order.createdAt)) : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusChip(order.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {getOrderStatusChip(order.status)}
                          </TableCell>
                          <TableCell align="right">
                            {order.paymentStatus === 'completed' ? (
                              <Chip label="Paid" color="success" size="small" />
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Payment />}
                                onClick={() => handlePayNow(order)}
                                disabled={paymentModalOpen}
                              >
                                Pay Now
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {pageInfo.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={pageInfo.totalPages}
                      page={pageInfo.currentPage}
                      onChange={(event, value) => setPage(value)}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Modal */}
        {selectedOrder && (
          <PaymentModal
            open={paymentModalOpen}
            onClose={handleCloseModal}
            order={selectedOrder}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            userProfile={user}
          />
        )}
      </Container>
    </Page>
  );
};

export default BidderMyOrdersPage;
