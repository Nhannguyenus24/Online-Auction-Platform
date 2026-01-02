import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Stack,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CreditCard,
  Delete,
  LocalShipping,
  Payment,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate, useParams } from 'react-router-dom';
import { formatPrice } from '../../utils/formatNumber';
import Page from '../../components/Page';
import { orderApi } from '../../services/orderApi';
import { bidderApi } from '../../services/bidderApi';

// Initialize Stripe (replace with your publishable key from .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY');

const CheckoutForm = ({ cartItems, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  // Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price + item.shippingFee, 0);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await orderApi.createPaymentIntent(totalAmount, 'usd');
        setClientSecret(response.clientSecret);
      } catch (err) {
        setError('Failed to initialize payment. Please try again.');
        console.error('Error creating payment intent:', err);
      }
    };

    if (totalAmount > 0) {
      createPaymentIntent();
    }
  }, [totalAmount]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please wait...');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Payment succeeded, confirm with backend
      if (paymentIntent.status === 'succeeded') {
        try {
          await orderApi.confirmPayment(paymentIntent.id);
          onSuccess();
        } catch (confirmError) {
          setError('Payment succeeded but failed to confirm. Please contact support.');
          console.error('Error confirming payment:', confirmError);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 2,
          bgcolor: 'grey.50',
        }}
      >
        <CardElement options={cardElementOptions} />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={!stripe || !elements || !clientSecret || processing}
        sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
      >
        {processing ? 'Processing...' : `Pay ${formatPrice(totalAmount)}`}
      </Button>
    </form>
  );
};

const BidderCheckoutPage = () => {
  const navigate = useNavigate();
  const { id: orderIdFromRoute } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [orderId, setOrderId] = useState('');
  
  // React Hook Form for shipping information
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    },
    mode: 'onBlur',
  });

  const shippingInfo = watch();

  // Load cart items from API (won items that need payment) or fetch order if orderId provided
  useEffect(() => {
    const loadCartItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If orderId is provided in route, fetch order details
        if (orderIdFromRoute) {
          const response = await orderApi.getOrder(orderIdFromRoute);
          if (response.success && response.order) {
            const order = response.order;
            // Convert order to cart item format
            setCartItems([{
              id: order.productId || order.id,
              title: order.productTitle || 'Product',
              image: order.productImage || 'https://via.placeholder.com/300',
              price: order.winningPrice || order.totalAmount || 0,
              seller: order.seller?.name || 'Seller',
              shippingFee: order.shippingFee || 0,
              productId: order.productId,
            }]);
            setOrderId(order.id || orderIdFromRoute);
            // Pre-fill shipping info if available
            if (order.shippingAddress) {
              reset({
                fullName: order.shippingAddress.fullName || '',
                phone: order.shippingAddress.phone || '',
                address: order.shippingAddress.address || '',
                city: order.shippingAddress.city || '',
                postalCode: order.shippingAddress.postalCode || '',
              });
            }
          }
        } else {
          // Load won items that need payment (cart items)
          const wonRes = await bidderApi.getWonItems(1, 100);
          const wonItems = wonRes.data || [];
          
          // Map won items to cart item format
          // In auction system, cart = won items that haven't been paid yet
          const cartItemsData = wonItems.map((item) => ({
            id: item.productId,
            productId: item.productId,
            title: item.productTitle,
            image: item.productPrimaryImage || 'https://via.placeholder.com/300',
            price: item.currentPrice || 0, // Winning price
            seller: 'Seller', // Not available in API response, can be fetched separately if needed
            shippingFee: 0, // Default shipping fee, can be updated
          }));
          
          setCartItems(cartItemsData);
        }
      } catch (err) {
        console.error('Error loading cart items:', err);
        setError('Failed to load cart items. Please try again.');
        // Fallback to localStorage if API fails
        const savedCartItems = localStorage.getItem('checkoutCartItems');
        if (savedCartItems) {
          try {
            const parsed = JSON.parse(savedCartItems);
            setCartItems(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            console.error('Error parsing cart items from localStorage:', e);
            setCartItems([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [orderIdFromRoute, reset]);

  const steps = ['Shopping Cart', 'Shipping Info', 'Payment', 'Confirmation'];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const shippingTotal = cartItems.reduce((sum, item) => sum + item.shippingFee, 0);
  const total = subtotal + shippingTotal;

  const handleRemoveItem = (id) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    // Update localStorage
    if (updatedItems.length > 0) {
      localStorage.setItem('checkoutCartItems', JSON.stringify(updatedItems));
    } else {
      localStorage.removeItem('checkoutCartItems');
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Validation will be handled by form submit
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const onShippingSubmit = () => {
    // Shipping form is valid, proceed to next step
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePaymentSuccess = () => {
    const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    setOrderId(newOrderId);
    setActiveStep(3);
  };


  if (loading) {
    return (
      <Page title="Checkout - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Page>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <Page title="Checkout - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </Box>
        </Container>
      </Page>
    );
  }

  if (cartItems.length === 0 && activeStep === 0) {
    return (
      <Page title="Checkout - Online Auction Platform">
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Browse our auctions to find great deals
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Checkout - Online Auction Platform">
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mb: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete your purchase securely
            </Typography>
          </Box>

          {/* Stepper */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ px: { xs: 2, md: 4 } }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2}>
            {/* Main Content */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  {/* Step 0: Cart Items */}
                  {activeStep === 0 && (
                    <Box>
                      {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                      )}
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Shopping Cart ({cartItems.length} items)
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      
                      {cartItems.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            No items in cart
                          </Typography>
                        </Box>
                      ) : (
                        <Stack spacing={2}>
                          {cartItems.map((item) => (
                            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box
                                  component="img"
                                  src={item.image || 'https://via.placeholder.com/300'}
                                  alt={item.title}
                                  sx={{
                                    width: 100,
                                    height: 100,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                  }}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {item.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Seller: {item.seller || 'N/A'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                    <Chip label={`Item: ${formatPrice(item.price || 0)}`} color="primary" size="small" />
                                    <Chip label={`Shipping: ${formatPrice(item.shippingFee || 0)}`} size="small" />
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <Delete />
                                  </IconButton>
                                  <Typography variant="h6" fontWeight="bold" color="primary">
                                    {formatPrice((item.price || 0) + (item.shippingFee || 0))}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          ))}
                        </Stack>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleNext}
                          disabled={cartItems.length === 0}
                          sx={{ minWidth: 200 }}
                        >
                          Continue to Shipping
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 1: Shipping Information */}
                  {activeStep === 1 && (
                    <Box component="form" onSubmit={handleSubmit(onShippingSubmit)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <LocalShipping color="primary" />
                        <Typography variant="h5" fontWeight="bold">
                          Shipping Information
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3 }} />

                      <Stack spacing={2}>
                        <Controller
                          name="fullName"
                          control={control}
                          rules={{
                            required: 'Full name is required',
                            minLength: {
                              value: 2,
                              message: 'Full name must be at least 2 characters',
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Full Name"
                              required
                              error={!!errors.fullName}
                              helperText={errors.fullName?.message}
                            />
                          )}
                        />
                        <Controller
                          name="phone"
                          control={control}
                          rules={{
                            required: 'Phone number is required',
                            pattern: {
                              value: /^[0-9+\-\s()]+$/,
                              message: 'Please enter a valid phone number',
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Phone Number"
                              required
                              error={!!errors.phone}
                              helperText={errors.phone?.message}
                            />
                          )}
                        />
                        <Controller
                          name="city"
                          control={control}
                          rules={{
                            required: 'City is required',
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="City"
                              required
                              error={!!errors.city}
                              helperText={errors.city?.message}
                            />
                          )}
                        />
                        <Controller
                          name="address"
                          control={control}
                          rules={{
                            required: 'Address is required',
                            minLength: {
                              value: 5,
                              message: 'Address must be at least 5 characters',
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Address"
                              required
                              multiline
                              rows={3}
                              error={!!errors.address}
                              helperText={errors.address?.message}
                            />
                          )}
                        />
                        <Controller
                          name="postalCode"
                          control={control}
                          rules={{
                            pattern: {
                              value: /^[0-9A-Za-z\s-]+$/,
                              message: 'Please enter a valid postal code',
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Postal Code"
                              error={!!errors.postalCode}
                              helperText={errors.postalCode?.message}
                            />
                          )}
                        />
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button onClick={handleBack}>
                          Back
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          sx={{ minWidth: 200 }}
                        >
                          Continue to Payment
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 2: Payment */}
                  {activeStep === 2 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Payment color="primary" />
                        <Typography variant="h5" fontWeight="bold">
                          Payment Method
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3 }} />

                      <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                        <FormLabel component="legend">Select Payment Method</FormLabel>
                        <RadioGroup
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <FormControlLabel
                            value="stripe"
                            control={<Radio />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CreditCard />
                                <Typography>Credit/Debit Card (Stripe)</Typography>
                              </Box>
                            }
                          />
                        </RadioGroup>
                      </FormControl>

                      {paymentMethod === 'stripe' && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Enter your card details
                          </Typography>
                          <Elements stripe={stripePromise}>
                            <CheckoutForm 
                              cartItems={cartItems} 
                              onSuccess={handlePaymentSuccess}
                            />
                          </Elements>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button onClick={handleBack}>
                          Back
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 3: Confirmation */}
                  {activeStep === 3 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Order Confirmed!
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Thank you for your purchase. Your order has been successfully placed.
                      </Typography>
                      <Alert severity="success" sx={{ mb: 3 }}>
                        Order ID: #{orderId}
                      </Alert>
                      <Stack direction="row" spacing={2} justifyContent="center">
                        <Button variant="outlined" onClick={() => navigate('/bidder')}>
                          Back to Home
                        </Button>
                        <Button variant="contained" onClick={() => navigate('/bidder/auction-history')}>
                          View Order History
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Order Summary */}
            <Box sx={{ width: 400, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Order Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal ({cartItems.length} items)
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatPrice(subtotal)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Shipping
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatPrice(shippingTotal)}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatPrice(total)}
                    </Typography>
                  </Box>

                  {activeStep === 1 && shippingInfo.fullName && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Shipping To:
                      </Typography>
                      <Typography variant="body2">{shippingInfo.fullName}</Typography>
                      <Typography variant="body2">{shippingInfo.phone}</Typography>
                      <Typography variant="body2">{shippingInfo.address}</Typography>
                      <Typography variant="body2">
                        {shippingInfo.city} {shippingInfo.postalCode}
                      </Typography>
                    </Box>
                  )}

                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Page>
  );
};

export default BidderCheckoutPage;

