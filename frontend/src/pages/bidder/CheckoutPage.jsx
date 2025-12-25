import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { formatPrice } from '../../utils/formatNumber';
import Page from '../../components/Page';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Mock cart data
const mockCartItems = [
  {
    id: 1,
    title: 'Vintage Rolex Submariner',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300',
    price: 180000000,
    seller: 'Luxury Watch Store',
    shippingFee: 500000,
  },
  {
    id: 2,
    title: 'MacBook Pro 16" M3 Max',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
    price: 65000000,
    seller: 'Tech Hub',
    shippingFee: 300000,
  },
];

const CheckoutForm = ({ cartItems, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe is not ready. Please wait a moment and try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        setError('Card element not found. Please refresh the page.');
        setProcessing(false);
        return;
      }
      
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        // Filter out API key errors in development
        if (stripeError.message.includes('Invalid API Key')) {
          setError('Please configure a valid Stripe API key. This is a development placeholder.');
        } else {
          setError(stripeError.message);
        }
        setProcessing(false);
        return;
      }

      // Here you would send paymentMethod.id to your backend
      console.log('Payment Method:', paymentMethod);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess();
    } catch (err) {
      // Filter out API key errors in development
      if (err.message && err.message.includes('Invalid API Key')) {
        setError('Please configure a valid Stripe API key. This is a development placeholder.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
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

  // Don't show API key errors in development
  const shouldShowError = error && !error.includes('Invalid API Key');

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
      
      {shouldShowError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={!stripe || processing}
        sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
      >
        {processing ? 'Processing...' : `Pay ${formatPrice(cartItems.reduce((sum, item) => sum + item.price + item.shippingFee, 0))}`}
      </Button>
    </form>
  );
};

const BidderCheckoutPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [orderId, setOrderId] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    },
  });

  const steps = ['Shopping Cart', 'Shipping Info', 'Payment', 'Confirmation'];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const shippingTotal = cartItems.reduce((sum, item) => sum + item.shippingFee, 0);
  const total = subtotal + shippingTotal;

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const onSubmitShipping = () => {
    // Shipping form is valid, proceed to next step
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Trigger form validation
      handleSubmit(onSubmitShipping)();
      return;
    }
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

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
            {/* Main Content */}
            <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  {/* Step 0: Cart Items */}
                  {activeStep === 0 && (
                    <Box>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Shopping Cart ({cartItems.length} items)
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      
                      <Stack spacing={2}>
                        {cartItems.map((item) => (
                          <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Box
                                component="img"
                                src={item.image}
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
                                  Seller: {item.seller}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                  <Chip label={`Item: ${formatPrice(item.price)}`} color="primary" size="small" />
                                  <Chip label={`Shipping: ${formatPrice(item.shippingFee)}`} size="small" />
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
                                  {formatPrice(item.price + item.shippingFee)}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleNext}
                          sx={{ minWidth: 200 }}
                        >
                          Continue to Shipping
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 1: Shipping Information */}
                  {activeStep === 1 && (
                    <Box component="form" onSubmit={handleSubmit(onSubmitShipping)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <LocalShipping color="primary" />
                        <Typography variant="h5" fontWeight="bold">
                          Shipping Information
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3 }} />

                      {/* Shipping Information Fields */}
                      <Stack spacing={2}>
                        <Controller
                          name="fullName"
                          control={control}
                          rules={{
                            required: 'Full Name is required',
                            minLength: {
                              value: 2,
                              message: 'Full Name must be at least 2 characters',
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
                            required: 'Phone Number is required',
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

                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <CreditCard color="primary" />
                          <Typography variant="h6" fontWeight={600}>
                            Credit/Debit Card (Stripe)
                          </Typography>
                        </Box>
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
                        <Button variant="contained" onClick={() => navigate('/bidder/history')}>
                          View Order History
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Order Summary */}
            <Box sx={{ width: { xs: '100%', md: 400 }, position: { md: 'sticky' }, top: { md: 20 } }}>
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

                  {activeStep === 1 && getValues('fullName') && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Shipping To:
                      </Typography>
                      <Typography variant="body2">{getValues('fullName')}</Typography>
                      <Typography variant="body2">{getValues('phone')}</Typography>
                      <Typography variant="body2">{getValues('address')}</Typography>
                      <Typography variant="body2">
                        {getValues('city')} {getValues('postalCode')}
                      </Typography>
                    </Box>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      Secure payment powered by Stripe
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default BidderCheckoutPage;

