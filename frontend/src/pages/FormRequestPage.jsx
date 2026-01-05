import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Store,
  TrendingUp,
  Security,
  Support,
  ArrowBack,
  HourglassEmpty,
  CheckCircleOutline,
  Cancel,
} from '@mui/icons-material';
import Page from '../components/Page';
import { bidderApi } from '../services/bidderApi';
import {useAuth} from '../hooks/useAuth';

const SellerBenefits = [
  {
    icon: <Store />,
    title: 'Create Your Own Store',
    description: 'List and sell your products to thousands of buyers worldwide.',
  },
  {
    icon: <TrendingUp />,
    title: 'Grow Your Business',
    description: 'Access analytics and insights to optimize your sales strategy.',
  },
  {
    icon: <Security />,
    title: 'Secure Transactions',
    description: 'Our platform ensures safe and protected payment processing.',
  },
  {
    icon: <Support />,
    title: 'Dedicated Support',
    description: 'Get priority support from our seller success team.',
  },
];

const FormRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    fetchRequestStatus();
  }, []);

  const fetchRequestStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await bidderApi.getRoleUpgradeStatus();
      if (response.success && response.hasRequest) {
        setRequestStatus({
          status: response.status,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          adminComment: response.adminComment,
        });
      }
    } catch (err) {
      console.error('Error fetching request status:', err);
      // Don't show error if no request exists
    } finally {
      setLoadingStatus(false);
    }
  };

  const getStatusInfo = () => {
    if (!requestStatus) return null;
    
    switch (requestStatus.status) {
      case 'pending':
        return {
          color: 'warning',
          icon: <HourglassEmpty />,
          label: 'Pending Review',
          message: 'Your request is being reviewed by our admin team.',
        };
      case 'approved':
        return {
          color: 'success',
          icon: <CheckCircleOutline />,
          label: 'Approved',
          message: 'Your request has been approved! Your account has been upgraded to seller.',
        };
      case 'rejected':
        return {
          color: 'error',
          icon: <Cancel />,
          label: 'Rejected',
          message: 'Your request has been rejected.',
        };
      default:
        return null;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await bidderApi.requestRoleUpgrade();

      if (response.success) {
        setSuccess(true);
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting upgrade request:', err);
      setError(err.message || 'Failed to submit upgrade request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Become a Seller">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Store sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Become a Seller
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start selling on our platform and reach millions of potential buyers
            </Typography>
          </Box>

          {/* Loading Status */}
          {loadingStatus && (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          )}

          {/* Request Status Display */}
          {!loadingStatus && requestStatus && getStatusInfo() && (
            <Alert 
              severity={getStatusInfo().color} 
              icon={getStatusInfo().icon}
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {getStatusInfo().label}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {getStatusInfo().message}
                </Typography>
                <Typography variant="caption" display="block" mt={1}>
                  Submitted on: {formatDate(requestStatus.createdAt)}
                </Typography>
                {requestStatus.updatedAt > 0 && (
                  <Typography variant="caption" display="block">
                    Last updated: {formatDate(requestStatus.updatedAt)}
                  </Typography>
                )}
                {requestStatus.adminComment && (
                  <Box mt={1} p={1} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="caption" fontWeight="bold">
                      Admin comment:
                    </Typography>
                    <Typography variant="caption" display="block">
                      {requestStatus.adminComment}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Benefits Section */}
          <Typography variant="h6" gutterBottom fontWeight="bold" mb={2}>
            Why Sell With Us?
          </Typography>
          <List>
            {SellerBenefits.map((benefit, index) => (
              <ListItem key={index} sx={{ mb: 2 }}>
                <ListItemIcon>
                  <Box
                    sx={{
                      color: 'primary.main',
                      bgcolor: 'primary.lighter',
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {benefit.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {benefit.title}
                    </Typography>
                  }
                  secondary={benefit.description}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 3 }} />

          {/* Requirements Section */}
          <Typography variant="h6" gutterBottom fontWeight="bold" mb={2}>
            Requirements
          </Typography>
          <Stack spacing={1} mb={3}>
            <Box display="flex" alignItems="center">
              <CheckCircle sx={{ color: 'success.main', mr: 1 }} fontSize="small" />
              <Typography variant="body2">
                Active account in good standing
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <CheckCircle sx={{ color: 'success.main', mr: 1 }} fontSize="small" />
              <Typography variant="body2">
                Valid email address and phone number
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <CheckCircle sx={{ color: 'success.main', mr: 1 }} fontSize="small" />
              <Typography variant="body2">
                Agree to seller terms and conditions
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* User Info */}
          {user && (
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Requesting upgrade for:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {user.email}
              </Typography>
            </Box>
          )}

          {/* Alert Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your upgrade request has been submitted successfully! Our admin team will review
              your request shortly. You will be redirected to the home page...
            </Alert>
          )}

          {/* Action Buttons */}
          {!success && !loadingStatus && (
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading || (requestStatus?.status === 'pending')}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {requestStatus?.status === 'pending' 
                  ? 'Request Already Submitted' 
                  : loading 
                  ? 'Submitting...' 
                  : requestStatus?.status === 'rejected'
                  ? 'Resubmit Request'
                  : 'Submit Request'}
              </Button>
            </Stack>
          )}

          {/* Info Note */}
          <Box mt={4} p={2} bgcolor="info.lighter" borderRadius={1}>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Note:</strong> After submitting your request, an administrator will review
              your account. You will receive an email notification once your request has been
              processed. This typically takes 1-3 business days.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Page>
  );
};

export default FormRequestPage;
