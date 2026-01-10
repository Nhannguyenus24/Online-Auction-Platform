import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Avatar,
  Stack,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Person,
  Lock,
  Star,
  Visibility,
  VisibilityOff,
  Edit,
  Save,
  Cancel,
  AccessTime,
  LocalOffer,
  Delete as DeleteIcon,
  CheckCircle,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate, normalizeTimestamp } from '../../utils/formatTime';
import { authApi } from '../../utils/api';
import { bidderApi } from '../../services/bidderApi';
import { orderApi } from '../../services/orderApi';

// Default profile data structure
const defaultProfileData = {
  id: null,
  name: '',
  email: '',
  phone: '',
  address: '',
  avatar: 'https://i.pravatar.cc/150?img=12',
  rating: 0,
  totalRatings: 0,
  positiveRatings: 0,
  negativeRatings: 0,
};

const BidderProfilePage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data states for tabs
  const [ratingsReceived, setRatingsReceived] = useState([]);
  // ratingsGiven is used internally to check if items are already rated, not displayed
  const [itemsNeedingRating, setItemsNeedingRating] = useState([]);
  const [ratingPercent, setRatingPercent] = useState(0);
  const [loading, setLoading] = useState({
    profile: false,
    ratings: false,
    saving: false,
    changingPassword: false,
  });
  const [ratingSubTab, setRatingSubTab] = useState(0); // 0: Received, 1: Rate Sellers
  const [ratingForm, setRatingForm] = useState({}); // { productId: { like: boolean, comment: '', sellerId: number, orderId: number } }

  // Form states
  const [profileData, setProfileData] = useState(defaultProfileData);
  const [originalProfileData, setOriginalProfileData] = useState(defaultProfileData); // Store original data for cancel
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setIsEditing(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleProfileChange = (field) => (event) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value,
    });
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordData({
      ...passwordData,
      [field]: event.target.value,
    });
  };

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (tabValue === 0) {
        setLoading((prev) => ({ ...prev, profile: true }));
        try {
          const [profileResponse, ratingsResponse] = await Promise.all([
            authApi.getProfile(),
            bidderApi.getRatings(1, 99).catch(() => null), // Fetch ratings, but don't fail if it errors
          ]);
          const apiProfile = profileResponse.data?.profile || {};
          // Update profile data with ratings if available
          let ratingData = {
            rating: apiProfile.rating || 0,
            totalRatings: apiProfile.totalRatings || 0,
            positiveRatings: apiProfile.positiveRatings || 0,
            negativeRatings: apiProfile.negativeRatings || 0,
          };
          
          if (ratingsResponse && ratingsResponse.success) {
            // Calculate rating from ratingPercent (0-100) to 0-5 scale
            const ratingFromPercent = (ratingsResponse.ratingPercent || 0) / 20;
            ratingData = {
              rating: ratingFromPercent,
              totalRatings: ratingsResponse.totalCount || 0,
              positiveRatings: ratingsResponse.positiveReviews || 0,
              negativeRatings: ratingsResponse.negativeReviews || 0,
            };
          }
          
          // Map API response to UI format
          const mappedProfile = {
            id: apiProfile.userId || apiProfile.id,
            name: apiProfile.fullName || '',
            email: apiProfile.email || '',
            phone: apiProfile.phoneNumber || '',
            address: typeof apiProfile.address === 'string' 
              ? apiProfile.address 
              : apiProfile.address 
                ? `${apiProfile.address.street || ''}, ${apiProfile.address.city || ''}, ${apiProfile.address.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                : '',
            avatar: apiProfile.avatar || defaultProfileData.avatar,
            ...ratingData,
          };
          setProfileData(mappedProfile);
          setOriginalProfileData(mappedProfile);
        } catch (err) {
          console.error('Error fetching profile:', err);
          setErrorMessage('Failed to load profile. Please try again.');
          setTimeout(() => setErrorMessage(''), 5000);
        } finally {
          setLoading((prev) => ({ ...prev, profile: false }));
        }
      }
    };

    fetchProfile();
  }, [tabValue]);

  const handleSaveProfile = async () => {
    setLoading((prev) => ({ ...prev, saving: true }));
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Prepare data for API (only fields that can be updated)
      const updateData = {
        fullName: profileData.name,
        phoneNumber: profileData.phone,
        address: profileData.address,
      };

      const response = await authApi.updateProfile(updateData);
      
      if (response.data?.success) {
        // Update profile data with response if available
        const updatedProfile = response.data?.profile;
        if (updatedProfile) {
          const mappedProfile = {
            id: updatedProfile.userId || updatedProfile.id,
            name: updatedProfile.fullName || profileData.name,
            email: updatedProfile.email || profileData.email,
            phone: updatedProfile.phoneNumber || profileData.phone,
            address: typeof updatedProfile.address === 'string' 
              ? updatedProfile.address 
              : updatedProfile.address 
                ? `${updatedProfile.address.street || ''}, ${updatedProfile.address.city || ''}, ${updatedProfile.address.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                : profileData.address,
            avatar: updatedProfile.avatar || profileData.avatar,
            rating: updatedProfile.rating || profileData.rating,
            totalRatings: updatedProfile.totalRatings || profileData.totalRatings,
            positiveRatings: updatedProfile.positiveRatings || profileData.positiveRatings,
            negativeRatings: updatedProfile.negativeRatings || profileData.negativeRatings,
          };
          setProfileData(mappedProfile);
          setOriginalProfileData(mappedProfile);
        } else {
          // If no profile in response, just update local state
          setOriginalProfileData(profileData);
        }
        
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCancelEdit = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
    setErrorMessage('');
  };

  const handleChangePassword = async () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setLoading((prev) => ({ ...prev, changingPassword: true }));

    try {
      const response = await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data?.success) {
        // Clear form on success
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(response.data?.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to change password. Please check your current password and try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading((prev) => ({ ...prev, changingPassword: false }));
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    const fetchData = async () => {
      if (tabValue === 2) {
        setLoading((prev) => ({ ...prev, ratings: true }));
        try {
          // Fetch ratings from real API
          const ratingsRes = await bidderApi.getRatings(1, 20);
          // Map API response to component format
          const mappedReceived = (ratingsRes.reviews || []).map((review) => {
            // Determine rating: check like field first, then score, default to positive if neither available
            let rating = 1; // Default to positive
            if (review.like !== undefined) {
              rating = review.like === true ? 1 : -1;
            } else if (review.score !== undefined) {
              rating = review.score >= 4 ? 1 : -1;
            }
            
            return {
              id: review.id,
              fromUser: review.fromUserName || `User #${review.fromUserId}`,
              fromUserId: review.fromUserId,
              rating: rating,
              comment: review.comment || '',
              date: new Date(parseInt(review.createdAt)), // Convert timestamp string to Date
              productTitle: '', // API doesn't return product title yet
              productId: null,
            };
          });
          
          // Update profile data with latest ratings stats
          const ratingFromPercent = (ratingsRes.ratingPercent || 0) / 20;
          setProfileData((prev) => ({
            ...prev,
            rating: ratingFromPercent,
            totalRatings: ratingsRes.totalCount || 0,
            positiveRatings: ratingsRes.positiveReviews || 0,
            negativeRatings: ratingsRes.negativeReviews || 0,
          }));
          
          setRatingPercent(ratingsRes.ratingPercent || 0);
          setRatingsReceived(mappedReceived);
          
          // Fetch given ratings and completed orders
          try {
            const [givenRes, ordersRes] = await Promise.all([
              bidderApi.getRatingsGiven().catch(() => ({ data: [] })),
              orderApi.getOrders(1, 50, 'all').catch(() => ({ orders: [] })),
            ]);
            
            const ratingsGiven = givenRes.data || [];
            const completedOrders = (ordersRes.orders || []).filter(
              (order) => {
                const status = (order.status || '').toLowerCase();
                return (status === 'completed' || status === 'delivered') && 
                       order.sellerId && 
                       order.productId;
              }
            );
            
            // Create a map of productId -> rating for quick lookup
            const ratingsMap = new Map();
            ratingsGiven.forEach((rating) => {
              if (rating.productId) {
                ratingsMap.set(rating.productId, rating);
              }
            });
            
            // Map orders to items, checking if already rated
            const itemsNeedingRating = completedOrders.map((order) => {
              const existingRating = ratingsMap.get(order.productId);
              return {
                id: order.id,
                productId: order.productId,
                orderId: order.id,
                sellerId: order.sellerId,
                title: order.productTitle || 'Product',
                image: order.productImage || '/placeholder-image.jpg',
                sellerName: order.sellerName || order.seller?.name || 'Seller',
                completedDate: order.createdAt || order.updatedAt,
                isRated: !!existingRating,
                existingRating: existingRating ? {
                  like: existingRating.like !== undefined ? existingRating.like : (existingRating.score >= 4),
                  comment: existingRating.comment || '',
                } : null,
              };
            });
            
            setItemsNeedingRating(itemsNeedingRating);
          } catch (err) {
            console.error('Error fetching orders needing rating:', err);
            setItemsNeedingRating([]);
          }
        } catch (err) {
          console.error('Error fetching ratings:', err);
        } finally {
          setLoading((prev) => ({ ...prev, ratings: false }));
        }
      }
    };

    fetchData();
  }, [tabValue]);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    const end = normalizeTimestamp(endTime);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
    if (hours > 0) return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    return `${pad(minutes)}m ${pad(seconds)}s`;
  };

  // Product Card Component
  const ProductCard = ({ product, showRemove = false, showBidInfo = false, showStatus = false }) => (
    <Card
      elevation={0}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
        },
      }}
      onClick={() => navigate(`/product/${product.productId || product.id}`)}
    >
      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.50' }}>
        <CardMedia
          component="img"
          image={product.image || '/placeholder-image.jpg'}
          alt={product.title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
            boxShadow: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <LocalOffer sx={{ fontSize: 14, color: 'primary.main' }} />
          <Typography variant="caption" fontWeight="bold" color="primary">
            {product.bidCount || 0} bids
          </Typography>
        </Box>
        {showRemove && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
            }}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
              },
              transition: 'all 0.2s',
            }}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
        {product.condition && (
          <Chip
            label={product.condition}
            size="small"
            color={product.condition === 'New' ? 'success' : 'default'}
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              fontWeight: 'bold',
              fontSize: '0.7rem',
            }}
          />
        )}
        {showBidInfo && product.isHighestBidder && (
          <Chip
            label="Highest Bidder"
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              fontWeight: 'bold',
            }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography
          variant="body1"
          gutterBottom
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: 48,
            fontWeight: 600,
            lineHeight: 1.4,
            mb: 2,
          }}
        >
          {product.title}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {showBidInfo ? 'My Bid' : 'Current Bid'}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
            {formatPrice(showBidInfo ? product.myBid : product.currentPrice || product.winningPrice)}
          </Typography>
          {showBidInfo && product.currentPrice !== product.myBid && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Current: {formatPrice(product.currentPrice)}
            </Typography>
          )}
          {showStatus && (
            <>
              <Chip
                label={product.status === 'pending_payment' ? 'Pending Payment' : product.status === 'paid' ? 'Paid' : product.status === 'shipping' ? 'Shipping' : 'Completed'}
                size="small"
                color={product.status === 'completed' ? 'success' : product.status === 'pending_payment' ? 'warning' : 'info'}
                sx={{ mb: 1.5 }}
              />
              {(product.status === 'pending_payment' || product.status === 'paid' || product.status === 'shipping') && (
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    // Generate orderId from productId (in real app, this would come from API)
                    const orderId = `ORD-${String(product.productId || product.id).padStart(3, '0')}`;
                    navigate(`/bidder/order-completion/${orderId}`);
                  }}
                  sx={{ mb: 1.5, fontWeight: 'bold' }}
                >
                  Complete Order
                </Button>
              )}
            </>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              pt: 1.5,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <AccessTime sx={{ fontSize: 16, color: 'error.main' }} />
            <Typography variant="caption" color="error.main" fontWeight="bold">
              {product.endTime ? getTimeLeft(product.endTime) : 'Ended'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const tabs = [
    { label: 'Personal Info', icon: <Person />, value: 0 },
    { label: 'Change Password', icon: <Lock />, value: 1 },
    { label: 'Ratings', icon: <Star />, value: 2 },
  ];

  return (
    <Page title="Profile - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            My Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <Card>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2 }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{ minHeight: 72 }}
                />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Tab 0: Personal Info */}
            {tabValue === 0 && (
              <Box>
                {loading.profile ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                      <Avatar
                        src={profileData.avatar}
                        sx={{ width: 100, height: 100 }}
                      >
                        {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {profileData.name || 'No name'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {profileData.email || 'No email'}
                        </Typography>
                        {profileData.totalRatings > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <ThumbUp fontSize="small" color="success" />
                              <Typography variant="body2" color="text.secondary">
                                {profileData.positiveRatings || 0}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <ThumbDown fontSize="small" color="error" />
                              <Typography variant="body2" color="text.secondary">
                                {profileData.negativeRatings || 0}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              • {profileData.totalRatings} ratings
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ flexGrow: 1 }} />
                      {!isEditing && (
                        <Button
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </Stack>

                    <Divider sx={{ mb: 4 }} />

                    <Box sx={{ maxWidth: 600 }}>
                      <Stack spacing={3}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={profileData.name}
                          onChange={handleProfileChange('name')}
                          disabled={!isEditing || loading.saving}
                        />
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={profileData.email}
                          disabled
                          helperText="Email cannot be changed"
                        />
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={profileData.phone}
                          onChange={handleProfileChange('phone')}
                          disabled={!isEditing || loading.saving}
                        />
                        <TextField
                          fullWidth
                          label="Address"
                          multiline
                          rows={3}
                          value={profileData.address}
                          onChange={handleProfileChange('address')}
                          disabled={!isEditing || loading.saving}
                        />
                      </Stack>

                      {isEditing && (
                        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                          <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSaveProfile}
                            disabled={loading.saving}
                          >
                            {loading.saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={handleCancelEdit}
                            disabled={loading.saving}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* Tab 1: Change Password */}
            {tabValue === 1 && (
              <Box sx={{ maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Enter your current password and choose a new one
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange('oldPassword')}
                    disabled={loading.changingPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
                            disabled={loading.changingPassword}
                          >
                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    disabled={loading.changingPassword}
                    helperText="Password must be at least 6 characters"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            disabled={loading.changingPassword}
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    disabled={loading.changingPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            disabled={loading.changingPassword}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleChangePassword}
                    disabled={loading.changingPassword}
                    sx={{ mt: 2 }}
                  >
                    {loading.changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Tab 2: Ratings & Reviews */}
            {tabValue === 2 && (
              <Box>
                {loading.ratings ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                    <Skeleton variant="rectangular" height={150} />
                    <Skeleton variant="rectangular" height={300} />
                  </Box>
                ) : (
                  <>
                    {/* Rating Summary */}
                    <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                      <CardContent>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <ThumbUp fontSize="small" color="success" />
                                  <Typography variant="h6" fontWeight="bold">
                                    {profileData.positiveRatings || 0}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <ThumbDown fontSize="small" color="error" />
                                  <Typography variant="h6" fontWeight="bold">
                                    {profileData.negativeRatings || 0}
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {profileData.totalRatings} ratings
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ minWidth: 100 }}>
                                  Positive:
                                </Typography>
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      flexGrow: 1,
                                      height: 8,
                                      bgcolor: 'success.light',
                                      borderRadius: 1,
                                    }}
                                  />
                                  <Typography variant="body2" fontWeight={600}>
                                    {profileData.positiveRatings}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ minWidth: 100 }}>
                                  Negative:
                                </Typography>
                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      flexGrow: 1,
                                      height: 8,
                                      bgcolor: 'error.light',
                                      borderRadius: 1,
                                    }}
                                  />
                                  <Typography variant="body2" fontWeight={600}>
                                    {profileData.negativeRatings}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Rating: {ratingPercent > 0 ? ratingPercent.toFixed(1) : (profileData.totalRatings > 0 ? ((profileData.positiveRatings / profileData.totalRatings) * 100).toFixed(1) : 0)}% positive
                              </Typography>
                            </Stack>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Sub Tabs */}
                    <Tabs
                      value={ratingSubTab}
                      onChange={(e, newValue) => setRatingSubTab(newValue)}
                      sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                    >
                      <Tab label={`Received (${ratingsReceived.length})`} />
                      <Tab label={`Rate Sellers (${itemsNeedingRating.length})`} />
                    </Tabs>

                    {/* Sub Tab 0: Ratings Received */}
                    {ratingSubTab === 0 && (
                      <Box>
                        {ratingsReceived.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No Ratings Received Yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Complete transactions to receive ratings from sellers
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={2}>
                            {ratingsReceived.map((rating) => (
                              <Card key={rating.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {rating.fromUser}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {fVNDate(rating.date)}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {rating.comment}
                                  </Typography>
                               
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {/* Sub Tab 1: Rate Sellers */}
                    {ratingSubTab === 1 && (
                      <Box>
                        {itemsNeedingRating.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No completed transactions yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Completed transactions will appear here for rating
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={3}>
                            {itemsNeedingRating.map((item) => (
                              <Card key={item.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { xs: 'stretch', sm: 'center' } }}>
                                    <Box
                                      sx={{
                                        flexShrink: 0,
                                        width: { xs: '100%', sm: 150 },
                                        height: { xs: 200, sm: 120 },
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={item.image}
                                        alt={item.title}
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          borderRadius: 1,
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        {item.title}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Seller: {item.sellerName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Completed: {fVNDate(item.completedDate)}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 250 } }}>
                                      <Stack spacing={2}>
                                        {item.isRated ? (
                                          <>
                                            <Box>
                                              <Typography variant="body2" gutterBottom>
                                                Your Rating
                                              </Typography>
                                              <Stack direction="row" spacing={1} alignItems="center">
                                                {item.existingRating?.like !== false ? (
                                                  <>
                                                    <ThumbUp fontSize="small" color="success" />
                                                    <Typography variant="body2" color="text.secondary">
                                                      Positive
                                                    </Typography>
                                                  </>
                                                ) : (
                                                  <>
                                                    <ThumbDown fontSize="small" color="error" />
                                                    <Typography variant="body2" color="text.secondary">
                                                      Negative
                                                    </Typography>
                                                  </>
                                                )}
                                              </Stack>
                                            </Box>
                                            {item.existingRating?.comment && (
                                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                "{item.existingRating.comment}"
                                              </Typography>
                                            )}
                                            <Chip
                                              label="Rated"
                                              color="success"
                                              size="small"
                                              sx={{ alignSelf: 'flex-start' }}
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <Box>
                                              <Typography variant="body2" gutterBottom>
                                                Rate Seller
                                              </Typography>
                                              <Stack direction="row" spacing={2}>
                                                <Button
                                                  variant={ratingForm[item.productId]?.like === true ? "contained" : "outlined"}
                                                  color="success"
                                                  startIcon={<ThumbUp />}
                                                  onClick={() => {
                                                    setRatingForm({
                                                      ...ratingForm,
                                                      [item.productId]: {
                                                        ...ratingForm[item.productId],
                                                        like: true,
                                                        sellerId: item.sellerId,
                                                        orderId: item.orderId,
                                                      },
                                                    });
                                                  }}
                                                  size="small"
                                                >
                                                  Positive
                                                </Button>
                                                <Button
                                                  variant={ratingForm[item.productId]?.like === false ? "contained" : "outlined"}
                                                  color="error"
                                                  startIcon={<ThumbDown />}
                                                  onClick={() => {
                                                    setRatingForm({
                                                      ...ratingForm,
                                                      [item.productId]: {
                                                        ...ratingForm[item.productId],
                                                        like: false,
                                                        sellerId: item.sellerId,
                                                        orderId: item.orderId,
                                                      },
                                                    });
                                                  }}
                                                  size="small"
                                                >
                                                  Negative
                                                </Button>
                                              </Stack>
                                            </Box>
                                            <TextField
                                              fullWidth
                                              multiline
                                              rows={3}
                                              placeholder="Leave a comment (optional)"
                                              value={ratingForm[item.productId]?.comment || ''}
                                              onChange={(e) =>
                                                setRatingForm({
                                                  ...ratingForm,
                                                  [item.productId]: {
                                                    ...ratingForm[item.productId],
                                                    comment: e.target.value,
                                                  },
                                                })
                                              }
                                              size="small"
                                            />
                                            <Button
                                              variant="contained"
                                              size="small"
                                              disabled={ratingForm[item.productId]?.like === undefined || loading.saving}
                                              fullWidth
                                              onClick={async () => {
                                                const formData = ratingForm[item.productId];
                                                if (!formData || formData.like === undefined || !formData.sellerId || !item.productId) {
                                                  setErrorMessage('Please provide a rating');
                                                  return;
                                                }

                                                setLoading((prev) => ({ ...prev, saving: true }));
                                                setErrorMessage('');
                                                try {
                                                  await orderApi.rateSeller(
                                                    formData.sellerId,
                                                    item.productId,
                                                    formData.orderId,
                                                    formData.like,
                                                    formData.comment || ''
                                                  );
                                                  setSuccessMessage('Rating submitted successfully!');
                                                  setTimeout(() => setSuccessMessage(''), 3000);
                                                  
                                                  // Update item to mark as rated instead of removing
                                                  setItemsNeedingRating((prev) =>
                                                    prev.map((i) =>
                                                      i.id === item.id
                                                        ?                                                           {
                                                            ...i,
                                                            isRated: true,
                                                            existingRating: {
                                                              like: formData.like,
                                                              comment: formData.comment || '',
                                                            },
                                                          }
                                                        : i
                                                    )
                                                  );
                                                  
                                                  // Clear form
                                                  setRatingForm((prev) => {
                                                    const newForm = { ...prev };
                                                    delete newForm[item.productId];
                                                    return newForm;
                                                  });
                                                  
                                                  // Refresh ratings
                                                  const ratingsRes = await bidderApi.getRatings(1, 20);
                                                  const ratingFromPercent = (ratingsRes.ratingPercent || 0) / 20;
                                                  setProfileData((prev) => ({
                                                    ...prev,
                                                    rating: ratingFromPercent,
                                                    totalRatings: ratingsRes.totalCount || 0,
                                                    positiveRatings: ratingsRes.positiveReviews || 0,
                                                    negativeRatings: ratingsRes.negativeReviews || 0,
                                                  }));
                                                  
                                                  // Refresh to update isRated status
                                                  const givenRes = await bidderApi.getRatingsGiven().catch(() => ({ data: [] }));
                                                  const updatedRatingsGiven = givenRes.data || [];
                                                  // Update items with new rating status
                                                  const updatedItems = itemsNeedingRating.map((item) => {
                                                    const existingRating = updatedRatingsGiven.find(r => r.productId === item.productId);
                                                    return {
                                                      ...item,
                                                      isRated: !!existingRating,
                                                      existingRating: existingRating ? {
                                                        like: existingRating.like !== undefined ? existingRating.like : (existingRating.score >= 4),
                                                        comment: existingRating.comment || '',
                                                      } : null,
                                                    };
                                                  });
                                                  setItemsNeedingRating(updatedItems);
                                                } catch (err) {
                                                  console.error('Error submitting rating:', err);
                                                  const errorMsg =
                                                    err.response?.data?.message ||
                                                    err.message ||
                                                    'Failed to submit rating. Please try again.';
                                                  setErrorMessage(errorMsg);
                                                  setTimeout(() => setErrorMessage(''), 5000);
                                                } finally {
                                                  setLoading((prev) => ({ ...prev, saving: false }));
                                                }
                                              }}
                                            >
                                              {loading.saving ? <CircularProgress size={20} /> : 'Submit Rating'}
                                            </Button>
                                          </>
                                        )}
                                      </Stack>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderProfilePage;
