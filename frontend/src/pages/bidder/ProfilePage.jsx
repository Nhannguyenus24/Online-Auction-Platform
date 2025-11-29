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
} from '@mui/material';
import {
  Person,
  Lock,
  Favorite,
  History,
  EmojiEvents,
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
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';
import {
  mockGetWatchList,
  mockGetBiddingHistory,
  mockGetWonItems,
  mockGetRatingsReceived,
  mockGetRatingsGiven,
  mockGetItemsNeedingRating,
} from '../../mocks';

// Mock user data - will be replaced with API call later
const mockUserData = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+84 123 456 789',
  address: '123 Main Street, Ho Chi Minh City',
  dateOfBirth: '1990-01-15',
  avatar: 'https://i.pravatar.cc/150?img=12',
  rating: 4.5,
  totalRatings: 24,
  positiveRatings: 20,
  negativeRatings: 4,
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
  const [watchList, setWatchList] = useState([]);
  const [biddingHistory, setBiddingHistory] = useState([]);
  const [wonItems, setWonItems] = useState([]);
  const [ratingsReceived, setRatingsReceived] = useState([]);
  const [ratingsGiven, setRatingsGiven] = useState([]);
  const [itemsNeedingRating, setItemsNeedingRating] = useState([]);
  const [loading, setLoading] = useState({
    watchList: false,
    bidding: false,
    won: false,
    ratings: false,
  });
  const [ratingSubTab, setRatingSubTab] = useState(0); // 0: Received, 1: Given, 2: Rate Sellers
  const [ratingForm, setRatingForm] = useState({}); // { productId: { rating: 1/-1, comment: '' } }

  // Form states
  const [profileData, setProfileData] = useState(mockUserData);
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

  const handleSaveProfile = () => {
    // Will be implemented with API call later
    console.log('Saving profile:', profileData);
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCancelEdit = () => {
    setProfileData(mockUserData);
    setIsEditing(false);
    setErrorMessage('');
  };

  const handleChangePassword = () => {
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

    // Will be implemented with API call later
    console.log('Changing password:', passwordData);
    setPasswordData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setSuccessMessage('Password changed successfully!');
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch data when tab changes
  useEffect(() => {
    const fetchData = async () => {
      if (tabValue === 2 && watchList.length === 0) {
        setLoading((prev) => ({ ...prev, watchList: true }));
        try {
          const response = await mockGetWatchList(false, 500);
          setWatchList(response.data || []);
        } catch (err) {
          console.error('Error fetching watch list:', err);
        } finally {
          setLoading((prev) => ({ ...prev, watchList: false }));
        }
      } else if (tabValue === 3 && biddingHistory.length === 0) {
        setLoading((prev) => ({ ...prev, bidding: true }));
        try {
          const response = await mockGetBiddingHistory(500);
          setBiddingHistory(response.data || []);
        } catch (err) {
          console.error('Error fetching bidding history:', err);
        } finally {
          setLoading((prev) => ({ ...prev, bidding: false }));
        }
      } else if (tabValue === 4 && wonItems.length === 0) {
        setLoading((prev) => ({ ...prev, won: true }));
        try {
          const response = await mockGetWonItems(500);
          setWonItems(response.data || []);
        } catch (err) {
          console.error('Error fetching won items:', err);
        } finally {
          setLoading((prev) => ({ ...prev, won: false }));
        }
      } else if (tabValue === 5) {
        setLoading((prev) => ({ ...prev, ratings: true }));
        try {
          const [receivedRes, givenRes, needingRes] = await Promise.all([
            mockGetRatingsReceived(500),
            mockGetRatingsGiven(500),
            mockGetItemsNeedingRating(500),
          ]);
          setRatingsReceived(receivedRes.data || []);
          setRatingsGiven(givenRes.data || []);
          setItemsNeedingRating(needingRes.data || []);
        } catch (err) {
          console.error('Error fetching ratings:', err);
        } finally {
          setLoading((prev) => ({ ...prev, ratings: false }));
        }
      }
    };

    fetchData();
  }, [tabValue, watchList.length, biddingHistory.length, wonItems.length]);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    const end = new Date(endTime);
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
              console.log('Remove from watch list:', product.id);
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
            <Chip
              label={product.status === 'pending_payment' ? 'Pending Payment' : product.status === 'paid' ? 'Paid' : product.status === 'shipping' ? 'Shipping' : 'Completed'}
              size="small"
              color={product.status === 'completed' ? 'success' : product.status === 'pending_payment' ? 'warning' : 'info'}
              sx={{ mb: 1 }}
            />
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
    { label: 'Watch List', icon: <Favorite />, value: 2 },
    { label: 'Bidding History', icon: <History />, value: 3 },
    { label: 'Won Items', icon: <EmojiEvents />, value: 4 },
    { label: 'Ratings', icon: <Star />, value: 5 },
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
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                  <Avatar
                    src={profileData.avatar}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {profileData.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profileData.email}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ color: 'warning.main', fontSize: 18 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {profileData.rating} ({profileData.totalRatings} ratings)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        • {profileData.positiveRatings}+ / {profileData.negativeRatings}-
                      </Typography>
                    </Box>
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

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileData.name}
                      onChange={handleProfileChange('name')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={handleProfileChange('phone')}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={handleProfileChange('dateOfBirth')}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={1}
                      value={profileData.address}
                      onChange={handleProfileChange('address')}
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>

                {isEditing && (
                  <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Stack>
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
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
                    helperText="Password must be at least 6 characters"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
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
                    sx={{ mt: 2 }}
                  >
                    Change Password
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Tab 2: Watch List */}
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Watch List
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Products you've saved for later
                </Typography>
                {loading.watchList ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : watchList.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Favorite sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Your Watch List is Empty
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start exploring products and add them to your watch list
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {watchList.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard product={product} showRemove />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 3: Bidding History */}
            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Bidding History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Products you're currently bidding on
                </Typography>
                {loading.bidding ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : biddingHistory.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <History sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Active Bids
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You haven't placed any bids yet
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {biddingHistory.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard product={product} showBidInfo />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 4: Won Items */}
            {tabValue === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Won Items
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Products you've won in auctions
                </Typography>
                {loading.won ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : wonItems.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <EmojiEvents sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Won Items Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keep bidding to win amazing products!
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {wonItems.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard product={product} showStatus />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 5: Ratings & Reviews */}
            {tabValue === 5 && (
              <Box>
                {loading.ratings ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* Rating Summary */}
                    <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                      <CardContent>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h3" fontWeight={700} color="primary">
                                {profileData.rating}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    sx={{
                                      fontSize: 24,
                                      color: star <= Math.round(profileData.rating) ? 'warning.main' : 'grey.300',
                                    }}
                                  />
                                ))}
                              </Box>
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
                                Rating: {((profileData.positiveRatings / profileData.totalRatings) * 100).toFixed(1)}% positive
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
                      <Tab label={`Given (${ratingsGiven.length})`} />
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Rate Sellers
                            {itemsNeedingRating.length > 0 && (
                              <Chip
                                label={itemsNeedingRating.length}
                                size="small"
                                color="error"
                                sx={{ height: 20, minWidth: 20 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </Tabs>

                    {/* Sub Tab 0: Ratings Received */}
                    {ratingSubTab === 0 && (
                      <Box>
                        {ratingsReceived.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Star sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
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
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                    <Box>
                                      <Typography variant="subtitle1" fontWeight={600}>
                                        {rating.fromUser}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {fVNDate(rating.date)}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={rating.rating === 1 ? '+1' : '-1'}
                                      color={rating.rating === 1 ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </Box>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {rating.comment}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    For: {rating.productTitle}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {/* Sub Tab 1: Ratings Given */}
                    {ratingSubTab === 1 && (
                      <Box>
                        {ratingsGiven.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Star sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No Ratings Given Yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Rate sellers after completing transactions
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={2}>
                            {ratingsGiven.map((rating) => (
                              <Card key={rating.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                    <Box>
                                      <Typography variant="subtitle1" fontWeight={600}>
                                        {rating.toUser}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {fVNDate(rating.date)}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={rating.rating === 1 ? '+1' : '-1'}
                                      color={rating.rating === 1 ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </Box>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {rating.comment}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    For: {rating.productTitle}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {/* Sub Tab 2: Rate Sellers */}
                    {ratingSubTab === 2 && (
                      <Box>
                        {itemsNeedingRating.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              All Caught Up!
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              You've rated all completed transactions
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={3}>
                            {itemsNeedingRating.map((item) => (
                              <Card key={item.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                  <Grid container spacing={3} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                      <Box
                                        component="img"
                                        src={item.image}
                                        alt={item.title}
                                        sx={{
                                          width: '100%',
                                          height: 120,
                                          objectFit: 'cover',
                                          borderRadius: 1,
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        {item.title}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Seller: {item.sellerName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Completed: {fVNDate(item.completedDate)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <Stack spacing={2}>
                                        <Box>
                                          <Typography variant="body2" gutterBottom>
                                            Rate Seller
                                          </Typography>
                                          <Stack direction="row" spacing={1}>
                                            <Button
                                              variant={
                                                ratingForm[item.productId]?.rating === 1
                                                  ? 'contained'
                                                  : 'outlined'
                                              }
                                              color="success"
                                              size="small"
                                              onClick={() =>
                                                setRatingForm({
                                                  ...ratingForm,
                                                  [item.productId]: {
                                                    ...ratingForm[item.productId],
                                                    rating: 1,
                                                  },
                                                })
                                              }
                                            >
                                              +1
                                            </Button>
                                            <Button
                                              variant={
                                                ratingForm[item.productId]?.rating === -1
                                                  ? 'contained'
                                                  : 'outlined'
                                              }
                                              color="error"
                                              size="small"
                                              onClick={() =>
                                                setRatingForm({
                                                  ...ratingForm,
                                                  [item.productId]: {
                                                    ...ratingForm[item.productId],
                                                    rating: -1,
                                                  },
                                                })
                                              }
                                            >
                                              -1
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
                                          disabled={!ratingForm[item.productId]?.rating}
                                          onClick={() => {
                                            console.log('Submit rating:', {
                                              productId: item.productId,
                                              ...ratingForm[item.productId],
                                            });
                                            // Will be implemented with API call later
                                            setSuccessMessage('Rating submitted successfully!');
                                            setTimeout(() => setSuccessMessage(''), 3000);
                                          }}
                                        >
                                          Submit Rating
                                        </Button>
                                      </Stack>
                                    </Grid>
                                  </Grid>
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
