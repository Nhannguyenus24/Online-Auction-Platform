import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Container,
  Typography,
  Card,
  Skeleton,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  Error as ErrorIcon,
  AccessTime,
  LocalShipping,
  Visibility,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate, normalizeTimestamp } from '../../utils/formatTime';
import { sellerApi } from '../../services/sellerApi';

const SellerOrdersPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
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
  const [statusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pageSize, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await sellerApi.getOrders(pagination.currentPage, pageSize, statusFilter);
      if (response.success) {
        const mappedOrders = (response.orders || []).map((order) => ({
          id: order.id,
          productId: order.productId,
          productTitle: order.productTitle || 'Unknown Product',
          buyerId: order.buyerId,
          buyerName: order.buyerName || 'Unknown Buyer',
          amount: order.amount || 0,
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: order.paymentMethod || '',
          createdAt: order.createdAt ? normalizeTimestamp(order.createdAt) : new Date(),
          productImage: null,
        }));
        setOrders(mappedOrders);
        setPagination((prev) => ({
          ...prev,
          totalItems: response.totalCount || mappedOrders.length,
          totalPages: Math.ceil((response.totalCount || mappedOrders.length) / pageSize) || 1,
          currentSize: mappedOrders.length,
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // Ensure status is lowercase to match database expectations
    const normalizedStatus = newStatus.toLowerCase().trim();
    
    setUpdatingStatus((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await sellerApi.updateOrderStatus(orderId, normalizedStatus);
      if (response.success) {
        enqueueSnackbar('Order status updated successfully', { variant: 'success' });
        await fetchOrders();
      } else {
        throw new Error(response.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update order status';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getPaymentStatusChip = (paymentStatus) => {
    if (paymentStatus === 'completed') {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Paid"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    } else if (paymentStatus === 'failed') {
      return (
        <Chip
          icon={<ErrorIcon />}
          label="Failed"
          color="error"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    } else {
      return (
        <Chip
          icon={<AccessTime />}
          label="Pending"
          color="warning"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
  };

  const getOrderStatusChip = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'warning', icon: <AccessTime /> },
      processing: { label: 'Processing', color: 'info', icon: <AccessTime /> },
      shipped: { label: 'Shipped', color: 'primary', icon: <LocalShipping /> },
      delivered: { label: 'Delivered', color: 'success', icon: <CheckCircle /> },
      cancelled: { label: 'Cancelled', color: 'error', icon: <ErrorIcon /> },
    };
    const statusInfo = statusMap[status?.toLowerCase()] || { label: status, color: 'default', icon: null };
    return (
      <Chip
        icon={statusInfo.icon}
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const getNextStatusOptions = (currentStatus, paymentStatus) => {
    const statusFlow = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    
    const options = statusFlow[currentStatus?.toLowerCase()] || [];
    
    if (paymentStatus !== 'completed') {
      return options.filter(opt => !['shipped', 'delivered'].includes(opt));
    }
    
    return options;
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const paginatedOrders = (() => {
    const startIndex = (pagination.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return orders.slice(startIndex, endIndex);
  })();

  return (
    <Page title="Orders - Seller Dashboard">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your sales and transactions
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ShoppingCart sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight={700}>
                My Orders
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              View and manage all your orders
            </Typography>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={400} />
              </Box>
            ) : orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <ShoppingCart sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Orders Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders will appear here once buyers complete their purchases
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Buyer</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Amount</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Payment Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Order Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOrders.map((order) => {
                        const nextStatusOptions = getNextStatusOptions(order.status, order.paymentStatus);
                        const canUpdateStatus = nextStatusOptions.length > 0;
                        const isUpdating = updatingStatus[order.id];

                        return (
                          <TableRow
                            key={order.id}
                            hover
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                  component="img"
                                  src={order.productImage || '/logo.png'}
                                  alt={order.productTitle}
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
                                    {order.productTitle}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Order #{order.id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{order.buyerName}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color="primary"
                              >
                                {formatPrice(order.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {getPaymentStatusChip(order.paymentStatus)}
                            </TableCell>
                            <TableCell align="center">
                              {getOrderStatusChip(order.status)}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" color="text.secondary">
                                {order.createdAt ? fVNDate(order.createdAt) : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Tooltip title="View Product">
                                  <IconButton
                                    size="small"
                                    onClick={() => navigate(`/product/${order.productId}`)}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {canUpdateStatus && (
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <Select
                                      value={order.status?.toLowerCase() || 'pending'}
                                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                      disabled={isUpdating}
                                      sx={{ fontSize: '0.875rem' }}
                                    >
                                      <MenuItem value={order.status?.toLowerCase() || 'pending'} disabled>
                                        {getOrderStatusChip(order.status).props.label}
                                      </MenuItem>
                                      {nextStatusOptions.map((status) => (
                                        <MenuItem key={status} value={status.toLowerCase()}>
                                          {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                )}
                                {!canUpdateStatus && (
                                  <Typography variant="caption" color="text.secondary">
                                    {order.status === 'delivered' || order.status === 'cancelled' ? 'Final' : 'No actions'}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {orders.length > 0 && (
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

export default SellerOrdersPage;
