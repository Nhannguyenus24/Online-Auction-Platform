import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  Grid,
  Divider,
  Stack,
  Alert,
  Chip,
  Avatar,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Rating,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Payment,
  LocalShipping,
  CheckCircle,
  Star,
  EmojiEvents,
  ArrowBack,
  CreditCard,
  Receipt,
  ShoppingBag,
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';
import { orderApi } from '../../services/orderApi';
import StripePaymentForm from '../../components/StripePaymentForm';

// Initialize Stripe (replace with your publishable key from .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY');

const BidderOrderCompletionPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [buyerRating, setBuyerRating] = useState(0);
  const [buyerComment, setBuyerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await orderApi.getOrder(orderId);
        if (response.success && response.order) {
          const orderData = response.order;
          setOrder(orderData);

          // Pre-fill payment method if available
          if (orderData.paymentMethod) {
            setPaymentMethod(orderData.paymentMethod);
          }

          // Pre-fill shipping info if available
          if (orderData.shippingAddress) {
            setShippingInfo({
              fullName: orderData.shippingAddress.fullName || '',
              phone: orderData.shippingAddress.phone || '',
              address: orderData.shippingAddress.address || '',
              city: orderData.shippingAddress.city || '',
              postalCode: orderData.shippingAddress.postalCode || '',
            });
          }

          // Pre-fill rating if available
          if (orderData.buyerRating) {
            setBuyerRating(orderData.buyerRating);
            setBuyerComment(orderData.buyerComment || '');
          }

          // Determine active step based on order status
          if (orderData.status === 'pending_payment' || orderData.status === 'PENDING_PAYMENT') {
            setActiveStep(0);
          } else if ((orderData.status === 'paid' || orderData.status === 'PAID') && !orderData.shippingAddress) {
            setActiveStep(1);
          } else if ((orderData.status === 'paid' || orderData.status === 'PAID') && orderData.shippingAddress && !orderData.sellerConfirmed) {
            setActiveStep(2);
          } else if ((orderData.status === 'shipping' || orderData.status === 'SHIPPING') && !orderData.receivedConfirmed) {
            setActiveStep(3);
          } else if ((orderData.status === 'completed' || orderData.status === 'COMPLETED') && !orderData.buyerRating) {
            setActiveStep(4);
          } else {
            setActiveStep(5); // Completed
          }
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load order. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const steps = [
    { label: 'Payment', icon: <Payment />, description: 'Complete payment for your won item' },
    { label: 'Shipping Address', icon: <LocalShipping />, description: 'Provide shipping address' },
    { label: 'Seller Confirmation', icon: <Receipt />, description: 'Waiting for seller to confirm payment and shipping invoice' },
    { label: 'Receive Confirmation', icon: <ShoppingBag />, description: 'Confirm you received the item' },
    { label: 'Rate Transaction', icon: <Star />, description: 'Rate your transaction experience' },
  ];

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    // Stripe payment is handled by StripePaymentForm component
    if (paymentMethod === 'stripe') {
      // Payment will be handled by StripePaymentForm's onSuccess callback
      return;
    }

    if (!orderId) {
      alert('Order ID is missing');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await orderApi.submitPayment(orderId, { method: paymentMethod });
      if (response.success && response.order) {
        setOrder(response.order);
        setActiveStep(1);
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentResult) => {
    setSubmitting(true);
    setError(null);
    try {
      // Payment was successful via Stripe, update order status
      // The backend already updated the order with payment intent ID
      // We just need to refresh the order data
      const response = await orderApi.getOrder(orderId);
      if (response.success && response.order) {
        setOrder(response.order);
        setActiveStep(1);
      } else {
        throw new Error('Payment succeeded but failed to update order');
      }
    } catch (err) {
      console.error('Error updating order after payment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Payment succeeded but failed to update order. Please contact support.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripePaymentError = (error) => {
    console.error('Stripe payment error:', error);
    const errorMessage = error.message || 'Payment failed. Please try again.';
    setError(errorMessage);
  };

  const handleShippingSubmit = async () => {
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      alert('Please fill in all required fields');
      return;
    }

    if (!orderId) {
      alert('Order ID is missing');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await orderApi.submitShipping(orderId, shippingInfo);
      if (response.success && response.order) {
        setOrder(response.order);
        setActiveStep(2);
      } else {
        throw new Error(response.message || 'Failed to submit shipping address');
      }
    } catch (err) {
      console.error('Shipping error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit shipping address. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveConfirmation = async () => {
    setConfirmAction('receive');
    setOpenConfirmDialog(true);
  };

  const handleConfirmReceive = async () => {
    setOpenConfirmDialog(false);
    
    if (!orderId) {
      alert('Order ID is missing');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await orderApi.confirmReceive(orderId);
      if (response.success && response.order) {
        setOrder(response.order);
        setActiveStep(4);
      } else {
        throw new Error(response.message || 'Failed to confirm receive');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleRatingSubmit = async () => {
    if (buyerRating === 0) {
      alert('Please provide a rating');
      return;
    }

    if (!orderId) {
      alert('Order ID is missing');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await orderApi.rateSeller(orderId, buyerRating, buyerComment);
      if (response.success && response.order) {
        setOrder(response.order);
        setActiveStep(5);
      } else {
        throw new Error(response.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Rating error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit rating. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      pending_payment: { label: 'Pending Payment', color: 'warning' },
      paid: { label: 'Paid', color: 'info' },
      shipping: { label: 'Shipping', color: 'primary' },
      completed: { label: 'Completed', color: 'success' },
      rated: { label: 'Rated', color: 'success' },
    };
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  if (loading) {
    return (
      <Page title="Order Completion - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Page>
    );
  }

  if (error && !order) {
    return (
      <Page title="Order Not Found - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/bidder/profile')}>
              Back to Profile
            </Button>
          </Box>
        </Container>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page title="Order Not Found - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error">Order not found</Alert>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Order Completion - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/bidder/profile')} sx={{ mb: 2 }}>
            Back to Profile
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <EmojiEvents sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Complete Your Order
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order ID: {order.id} • {getStatusChip(order.status)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Stepper activeStep={activeStep} orientation="vertical">
                  {/* Step 0: Payment */}
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: activeStep >= 0 ? 'primary.main' : 'grey.300' }}>
                          <Payment />
                        </Avatar>
                      )}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Step 1: Payment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete payment for your won item
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {activeStep === 0 ? (
                        <Box sx={{ mt: 2 }}>
                          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                            <FormLabel component="legend">Select Payment Method</FormLabel>
                            <RadioGroup
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              disabled={submitting}
                            >
                              <FormControlLabel
                                value="momo"
                                control={<Radio />}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CreditCard /> MoMo Wallet
                                  </Box>
                                }
                              />
                              <FormControlLabel
                                value="zalopay"
                                control={<Radio />}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CreditCard /> ZaloPay
                                  </Box>
                                }
                              />
                              <FormControlLabel
                                value="vnpay"
                                control={<Radio />}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CreditCard /> VNPay QR
                                  </Box>
                                }
                              />
                              <FormControlLabel
                                value="stripe"
                                control={<Radio />}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CreditCard /> Credit/Debit Card (Stripe)
                                  </Box>
                                }
                              />
                            </RadioGroup>
                          </FormControl>

                          <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                              <strong>Total Amount:</strong> {formatPrice(order.totalAmount)}
                              <br />
                              <strong>Item Price:</strong> {formatPrice(order.winningPrice)}
                              <br />
                              <strong>Shipping Fee:</strong> {formatPrice(order.shippingFee)}
                            </Typography>
                          </Alert>

                          {paymentMethod === 'stripe' ? (
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                                Enter your card details securely
                              </Typography>
                              <Elements stripe={stripePromise}>
                                <StripePaymentForm
                                  orderId={orderId}
                                  amount={order.totalAmount}
                                  currency="usd"
                                  onSuccess={handleStripePaymentSuccess}
                                  onError={handleStripePaymentError}
                                />
                              </Elements>
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              size="large"
                              onClick={handlePayment}
                              disabled={!paymentMethod || submitting}
                              fullWidth
                              sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                              {submitting ? <CircularProgress size={24} /> : 'Complete Payment'}
                            </Button>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle color="success" />
                            <Typography variant="body2" fontWeight="bold">
                              Payment completed via {order.paymentMethod}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </StepContent>
                  </Step>

                  {/* Step 1: Shipping Address */}
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: activeStep >= 1 ? 'primary.main' : 'grey.300' }}>
                          <LocalShipping />
                        </Avatar>
                      )}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Step 2: Shipping Address
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Provide your shipping address
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {activeStep === 1 ? (
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Full Name"
                                required
                                value={shippingInfo.fullName}
                                onChange={(e) =>
                                  setShippingInfo({ ...shippingInfo, fullName: e.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Phone Number"
                                required
                                value={shippingInfo.phone}
                                onChange={(e) =>
                                  setShippingInfo({ ...shippingInfo, phone: e.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="City"
                                required
                                value={shippingInfo.city}
                                onChange={(e) =>
                                  setShippingInfo({ ...shippingInfo, city: e.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Address"
                                required
                                multiline
                                rows={3}
                                value={shippingInfo.address}
                                onChange={(e) =>
                                  setShippingInfo({ ...shippingInfo, address: e.target.value })
                                }
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Postal Code"
                                value={shippingInfo.postalCode}
                                onChange={(e) =>
                                  setShippingInfo({ ...shippingInfo, postalCode: e.target.value })
                                }
                              />
                            </Grid>
                          </Grid>

                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleShippingSubmit}
                            disabled={submitting}
                            fullWidth
                            sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
                          >
                            {submitting ? <CircularProgress size={24} /> : 'Submit Shipping Address'}
                          </Button>
                        </Box>
                      ) : order.shippingAddress ? (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircle color="success" />
                            <Typography variant="body2" fontWeight="bold">
                              Shipping Address Submitted
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {order.shippingAddress.fullName}
                            <br />
                            {order.shippingAddress.phone}
                            <br />
                            {order.shippingAddress.address}
                            <br />
                            {order.shippingAddress.city} {order.shippingAddress.postalCode}
                          </Typography>
                        </Box>
                      ) : null}
                    </StepContent>
                  </Step>

                  {/* Step 2: Seller Confirmation */}
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: activeStep >= 2 ? 'primary.main' : 'grey.300' }}>
                          <Receipt />
                        </Avatar>
                      )}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Step 3: Seller Confirmation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Waiting for seller to confirm payment and provide shipping invoice
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {order.sellerConfirmed ? (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircle color="success" />
                            <Typography variant="body2" fontWeight="bold">
                              Seller Confirmed Payment
                            </Typography>
                          </Box>
                          {order.shippingInvoice && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Shipping Invoice:</strong> {order.shippingInvoice}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                          <Typography variant="body2">
                            Waiting for seller to confirm payment and provide shipping invoice...
                          </Typography>
                        </Box>
                      )}
                    </StepContent>
                  </Step>

                  {/* Step 3: Receive Confirmation */}
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: activeStep >= 3 ? 'primary.main' : 'grey.300' }}>
                          <ShoppingBag />
                        </Avatar>
                      )}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Step 4: Receive Confirmation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confirm you received the item
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {activeStep === 3 ? (
                        <Box sx={{ mt: 2 }}>
                          <Alert severity="info" sx={{ mb: 3 }}>
                            Please confirm that you have received the item in good condition.
                          </Alert>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleReceiveConfirmation}
                            disabled={submitting}
                            fullWidth
                            sx={{ py: 1.5, fontWeight: 'bold' }}
                          >
                            {submitting ? <CircularProgress size={24} /> : 'Confirm Received'}
                          </Button>
                        </Box>
                      ) : order.receivedConfirmed ? (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle color="success" />
                            <Typography variant="body2" fontWeight="bold">
                              Item received confirmed
                            </Typography>
                          </Box>
                        </Box>
                      ) : null}
                    </StepContent>
                  </Step>

                  {/* Step 4: Rating */}
                  <Step>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar sx={{ bgcolor: activeStep >= 4 ? 'primary.main' : 'grey.300' }}>
                          <Star />
                        </Avatar>
                      )}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Step 5: Rate Transaction
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rate your transaction experience
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      {activeStep === 4 ? (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                              Rate Seller: {order.seller?.name || 'Seller'}
                            </Typography>
                            <Rating
                              value={buyerRating}
                              onChange={(e, newValue) => setBuyerRating(newValue)}
                              size="large"
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              rows={4}
                              label="Your Comment (Optional)"
                              value={buyerComment}
                              onChange={(e) => setBuyerComment(e.target.value)}
                              placeholder="Share your experience..."
                            />
                          </Box>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleRatingSubmit}
                            disabled={buyerRating === 0 || submitting}
                            fullWidth
                            sx={{ py: 1.5, fontWeight: 'bold' }}
                          >
                            {submitting ? <CircularProgress size={24} /> : 'Submit Rating'}
                          </Button>
                        </Box>
                      ) : order.buyerRating ? (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircle color="success" />
                            <Typography variant="body2" fontWeight="bold">
                              Rating Submitted
                            </Typography>
                          </Box>
                          <Rating value={order.buyerRating} readOnly sx={{ mb: 1 }} />
                          {order.buyerComment && (
                            <Typography variant="body2">{order.buyerComment}</Typography>
                          )}
                        </Box>
                      ) : null}
                    </StepContent>
                  </Step>
                </Stepper>

                {activeStep === 5 && (
                  <Box sx={{ mt: 4, p: 4, bgcolor: 'success.lighter', borderRadius: 2, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Order Completed!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Thank you for completing your order. We hope you enjoy your purchase!
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button variant="outlined" onClick={() => navigate('/bidder/profile')}>
                        Back to Profile
                      </Button>
                      <Button variant="contained" onClick={() => navigate('/bidder/auction-history')}>
                        View History
                      </Button>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Order Summary Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20, border: '1px solid', borderColor: 'divider', borderRadius: 3 }} elevation={0}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Order Summary
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box
                    component="img"
                    src={order.productImage || 'https://via.placeholder.com/80'}
                    alt={order.productTitle || 'Product'}
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      {order.productTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.wonDate ? `Won on ${fVNDate(order.wonDate)}` : 'Won item'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Winning Price
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatPrice(order.winningPrice)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Shipping Fee
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatPrice(order.shippingFee)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatPrice(order.totalAmount)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Seller Information
                  </Typography>
                  {order.seller && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                      <Avatar src={order.seller.avatar || order.seller.avatarUrl} sx={{ width: 40, height: 40 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {order.seller.name || 'Seller'}
                        </Typography>
                        {order.seller.rating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                            <Typography variant="caption">{order.seller.rating}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Confirm Receive Dialog */}
        <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Received Item</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please confirm that you have received the item in good condition. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleConfirmReceive} disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
};

export default BidderOrderCompletionPage;

