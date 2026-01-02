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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import {
  ShoppingCart,
  Block,
  Visibility,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';
import { sellerApi } from '../../services/sellerApi';

const SellerOrdersPage = () => {
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
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await sellerApi.getOrders(1, 500, 'all');
        // Map the response to match the expected format
        const mappedOrders = (response.orders || []).map((order) => ({
          id: order.id,
          orderId: order.id,
          productId: order.productId,
          productTitle: order.productTitle || 'Unknown Product',
          buyerId: order.buyerId,
          buyerName: order.buyerName || 'Unknown Buyer',
          amount: order.amount || 0,
          status: order.status || 'pending',
          paymentMethod: order.paymentMethod || '',
          orderDate: order.createdAt ? new Date(parseInt(order.createdAt)).toISOString() : new Date().toISOString(),
          productImage: null, // Not available in orders endpoint
        }));
        setOrders(mappedOrders);
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

  const handleOpenCancelDialog = (order) => {
    setOrderToCancel(order);
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setOrderToCancel(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setCancellingOrder(true);
    try {
      // Mock API call - replace with actual API
      // await axiosInstance.post(`/orders/${orderToCancel.id}/cancel`, {
      //   reason: 'Người thắng không thanh toán',
      // });
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update order status
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderToCancel.id
            ? { ...order, status: 'cancelled' }
            : order
        )
      );

      handleCloseCancelDialog();
    } catch (err) {
      console.error('Error cancelling order:', err);
    } finally {
      setCancellingOrder(false);
    }
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
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
                        <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Buyer</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {order.orderId}
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
                                }}
                              />
                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                {order.productTitle}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{order.buyerName}</Typography>
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
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              {(order.status === 'pending_payment' || order.status === 'paid') && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCancelDialog(order)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Block fontSize="small" />
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

        {/* Cancel Order Confirmation Dialog */}
        <Dialog open={openCancelDialog} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to cancel this order?
            </Typography>
            {orderToCancel && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Order ID:</strong> {orderToCancel.orderId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Product:</strong> {orderToCancel.productTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Buyer:</strong> {orderToCancel.buyerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Amount:</strong> {formatPrice(orderToCancel.amount)}
                </Typography>
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Reason:</strong> Người thắng không thanh toán
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This action will cancel the order and automatically -1 the winner's rating.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCancelDialog} disabled={cancellingOrder}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCancelOrder}
              variant="contained"
              color="error"
              disabled={cancellingOrder}
              startIcon={cancellingOrder ? <CircularProgress size={16} color="inherit" /> : <Block />}
            >
              {cancellingOrder ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
};

export default SellerOrdersPage;

