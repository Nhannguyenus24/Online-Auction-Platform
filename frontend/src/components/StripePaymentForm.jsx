import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { orderApi } from '../services/orderApi';
import { formatPrice } from '../utils/formatNumber';

/**
 * Stripe Payment Form Component
 * Handles Stripe payment processing with card input
 * 
 * @param {Object} props
 * @param {number|string|null} props.orderId - Order ID (optional)
 * @param {number|null} props.amount - Amount in dollars (required if orderId not provided)
 * @param {string} props.currency - Currency code (default: 'usd')
 * @param {string|null} props.shippingAddress - Shipping address (optional)
 * @param {Function} props.onSuccess - Callback when payment succeeds
 * @param {Function} props.onError - Callback when payment fails
 */
const StripePaymentForm = ({ orderId = null, amount = null, currency = 'usd', shippingAddress = null, onSuccess, onError }) => {
  const { enqueueSnackbar } = useSnackbar();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create payment intent when component mounts or shipping address changes
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await orderApi.createPaymentIntent(orderId, amount, currency, shippingAddress);
        setClientSecret(response.clientSecret);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        if (onError) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId || amount) {
      initializePayment();
    } else {
      setError('Either orderId or amount must be provided');
      setLoading(false);
    }
  }, [orderId, amount, currency, shippingAddress, onError, enqueueSnackbar]);

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
        const errorMessage = stripeError.message || 'Payment failed. Please try again.';
        setError(errorMessage);
        setProcessing(false);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        if (onError) {
          onError(stripeError);
        }
        return;
      }

      // Payment succeeded
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        if (orderId) {
          try {
            await orderApi.confirmPayment(orderId, paymentIntent.id);
            enqueueSnackbar('Payment successful!', { variant: 'success' });
            
            if (onSuccess) {
              onSuccess({
                paymentIntentId: paymentIntent.id,
                paymentIntent,
                orderId,
              });
            }
          } catch (confirmError) {
            // Payment succeeded but confirmation failed
            const confirmErrorMessage = confirmError.response?.data?.message || confirmError.message || 'Payment succeeded but failed to confirm. Please contact support.';
            setError(confirmErrorMessage);
            enqueueSnackbar(confirmErrorMessage, { variant: 'warning' });
            if (onError) {
              onError(confirmError);
            }
            setProcessing(false);
          }
        } else {
          // No orderId, just show success
          enqueueSnackbar('Payment successful!', { variant: 'success' });
          if (onSuccess) {
            onSuccess({
              paymentIntentId: paymentIntent.id,
              paymentIntent,
              orderId,
            });
          }
        }
      } else {
        const errorMessage = 'Payment was not completed. Please try again.';
        setError(errorMessage);
        setProcessing(false);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        if (onError) {
          onError(new Error('Payment not completed'));
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      setProcessing(false);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      if (onError) {
        onError(err);
      }
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
    hidePostalCode: true,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Initializing payment...
        </Typography>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 2,
          bgcolor: 'grey.50',
          mb: 2,
        }}
      >
        <CardElement options={cardElementOptions} />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={!stripe || !elements || !clientSecret || processing}
        sx={{ py: 1.5, fontWeight: 'bold' }}
      >
        {processing ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Processing...
          </>
        ) : (
          `Pay ${amount ? formatPrice(amount) : ''}`
        )}
      </Button>
    </form>
  );
};

export default StripePaymentForm;
