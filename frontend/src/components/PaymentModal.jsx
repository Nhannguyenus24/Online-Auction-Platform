import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Alert,
  IconButton,
  TextField,
  Grid,
} from '@mui/material';
import { Close as CloseIcon, Payment, LocalShipping } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { formatPrice } from '../utils/formatNumber';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY');

/**
 * Payment Modal Component
 * Displays Stripe payment form in a modal for a specific order
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.order - Order object with id, amount, etc.
 * @param {Function} props.onSuccess - Callback when payment succeeds
 * @param {Function} props.onError - Callback when payment fails
 */
const PaymentModal = ({ open, onClose, order, onSuccess, onError, userProfile }) => {
  const [error, setError] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phoneNumber || '',
    address: userProfile?.address || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
    postalCode: userProfile?.postalCode || '',
    country: 'US',
  });

  const handleShippingChange = (field) => (event) => {
    setShippingInfo((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const formatShippingAddress = () => {
    const parts = [
      shippingInfo.fullName,
      shippingInfo.address,
      shippingInfo.city,
      shippingInfo.state,
      shippingInfo.postalCode,
      shippingInfo.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handlePaymentSuccess = (paymentResult) => {
    setError(null);
    if (onSuccess) {
      onSuccess(paymentResult);
    }
  };

  const handlePaymentError = (error) => {
    setError(error.message || 'Payment failed. Please try again.');
    if (onError) {
      onError(error);
    }
  };

  const handleClose = () => {
    setError(null);
    // Reset shipping info when closing
    setShippingInfo({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    });
    if (onClose) {
      onClose();
    }
  };

  if (!order) {
    return null;
  }

  const shippingAddress = formatShippingAddress();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Complete Payment
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Order #{order.id}
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {order.productTitle || 'Product'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Amount
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatPrice(order.amount)}
            </Typography>
          </Box>
        </Box>

        {/* Shipping Information */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocalShipping color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              Shipping Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={shippingInfo.fullName}
                onChange={handleShippingChange('fullName')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={shippingInfo.phone}
                onChange={handleShippingChange('phone')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={shippingInfo.postalCode}
                onChange={handleShippingChange('postalCode')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={shippingInfo.address}
                onChange={handleShippingChange('address')}
                required
                multiline
                rows={1}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={shippingInfo.city}
                onChange={handleShippingChange('city')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                value={shippingInfo.state}
                onChange={handleShippingChange('state')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Country"
                value={shippingInfo.country}
                onChange={handleShippingChange('country')}
                required
                size="small"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Payment Method
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your card details to complete the payment
          </Typography>
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              orderId={order.id}
              amount={order.amount}
              currency="usd"
              shippingAddress={shippingAddress}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
