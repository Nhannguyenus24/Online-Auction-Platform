import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Rating,
  CircularProgress,
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
  Visibility as VisibilityIcon,
  CheckCircle,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';
import { sellerApi } from '../../services/sellerApi';
import { authApi } from '../../utils/api';

const SellerProfilePage = () => {
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
  const [ratingSubTab, setRatingSubTab] = useState(0); // 0: Received, 1: Rate Winners
  const [ratingForm, setRatingForm] = useState({}); // { productId: { score: 1-5, comment: '', bidderId: number, orderId: number } }

  // Form states
  const [profileData, setProfileData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    rating: 0,
    totalRatings: 0,
    positiveRatings: 0,
    negativeRatings: 0,
  });
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
    // Reset to original profile data
    setProfileData({
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
      avatar: profileData.avatar,
      rating: profileData.rating,
      totalRatings: profileData.totalRatings,
      positiveRatings: profileData.positiveRatings,
      negativeRatings: profileData.negativeRatings,
    });
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

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading((prev) => ({ ...prev, profile: true }));
        const [profileResponse, ratingsResponse] = await Promise.all([
          authApi.getProfile(),
          sellerApi.getRatings(1, 20).catch(() => null), // Fetch ratings, but don't fail if it errors
        ]);
        
        const profile = profileResponse.data?.profile || {};
        
        // Update profile data with ratings if available
        let ratingData = {
          rating: profile.rating || 0,
          totalRatings: profile.totalRatings || 0,
          positiveRatings: profile.positiveRatings || 0,
          negativeRatings: profile.negativeRatings || 0,
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
        
        setProfileData({
          id: profile.userId || profile.id || null,
          name: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phoneNumber || '',
          address: profile.address || '',
          avatar: profile.avatar || profile.profilePicture || '',
          ...ratingData,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading((prev) => ({ ...prev, profile: false }));
      }
    };

    fetchProfile();
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    const fetchData = async () => {
      if (tabValue === 2) {
        setLoading((prev) => ({ ...prev, ratings: true }));
        try {
          // Fetch ratings from real API
          const ratingsRes = await sellerApi.getRatings(1, 20);
          
          // Map API response to component format
          const mappedReceived = (ratingsRes.reviews || []).map((review) => ({
            id: review.id,
            fromUser: review.fromUserName || `User #${review.fromUserId}`,
            fromUserId: review.fromUserId,
            rating: review.score >= 4 ? 1 : -1, // Convert score (1-5) to rating (+1/-1)
            comment: review.comment || '',
            date: new Date(parseInt(review.createdAt)), // Convert timestamp string to Date
            productTitle: '', // API doesn't return product title yet
            productId: null,
          }));
          
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
              sellerApi.getRatingsGiven().catch(() => ({ data: [] })),
              sellerApi.getOrders(1, 50, 'all').catch(() => ({ orders: [] })),
            ]);
            
            const ratingsGiven = givenRes.data || [];
            const completedOrders = (ordersRes.orders || []).filter(
              (order) => {
                const status = (order.status || '').toLowerCase();
                return (status === 'completed' || status === 'delivered') && 
                       order.buyerId && 
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
                bidderId: order.buyerId,
                title: order.productTitle || 'Product',
                image: order.productImage || '/placeholder-image.jpg',
                winnerName: order.buyerName || order.buyer?.name || 'Buyer',
                completedDate: order.createdAt || order.updatedAt,
                isRated: !!existingRating,
                existingRating: existingRating ? {
                  score: existingRating.score || existingRating.rating || 0,
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
            Manage your account information and seller preferences
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
                            <Star sx={{ color: 'warning.main', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={500}>
                              {profileData.rating} ({profileData.totalRatings} ratings)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              • {profileData.positiveRatings}+ / {profileData.negativeRatings}-
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
                      <Tab label={`Rate Winners (${itemsNeedingRating.length})`} />
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
                              Complete transactions to receive ratings from buyers
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
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {/* Sub Tab 1: Rate Winners */}
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
                                        Winner: {item.winnerName}
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
                                              <Rating
                                                value={item.existingRating?.score || 0}
                                                readOnly
                                                size="large"
                                              />
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
                                                Rate Winner
                                              </Typography>
                                              <Rating
                                                value={ratingForm[item.productId]?.score || 0}
                                                onChange={(e, newValue) => {
                                                  setRatingForm({
                                                    ...ratingForm,
                                                    [item.productId]: {
                                                      ...ratingForm[item.productId],
                                                      score: newValue || 0,
                                                      bidderId: item.bidderId,
                                                      orderId: item.orderId,
                                                    },
                                                  });
                                                }}
                                                size="large"
                                              />
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
                                              disabled={!ratingForm[item.productId]?.score || loading.ratings}
                                              onClick={async () => {
                                                const formData = ratingForm[item.productId];
                                                if (!formData || !formData.score || !formData.bidderId || !item.productId) {
                                                  setErrorMessage('Please provide a rating');
                                                  return;
                                                }

                                                setLoading((prev) => ({ ...prev, ratings: true }));
                                                setErrorMessage('');
                                                try {
                                                  await sellerApi.rateBidder(
                                                    formData.bidderId,
                                                    item.productId,
                                                    formData.orderId,
                                                    formData.score,
                                                    formData.comment || ''
                                                  );
                                                  setSuccessMessage('Rating submitted successfully!');
                                                  setTimeout(() => setSuccessMessage(''), 3000);
                                                  
                                                  // Update item to mark as rated instead of removing
                                                  setItemsNeedingRating((prev) =>
                                                    prev.map((i) =>
                                                      i.id === item.id
                                                        ? {
                                                            ...i,
                                                            isRated: true,
                                                            existingRating: {
                                                              score: formData.score,
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
                                                  const ratingsRes = await sellerApi.getRatings(1, 20);
                                                  const ratingFromPercent = (ratingsRes.ratingPercent || 0) / 20;
                                                  setProfileData((prev) => ({
                                                    ...prev,
                                                    rating: ratingFromPercent,
                                                    totalRatings: ratingsRes.totalCount || 0,
                                                    positiveRatings: ratingsRes.positiveReviews || 0,
                                                    negativeRatings: ratingsRes.negativeReviews || 0,
                                                  }));
                                                  
                                                  // Refresh to update isRated status
                                                  const givenRes = await sellerApi.getRatingsGiven().catch(() => ({ data: [] }));
                                                  const updatedRatingsGiven = givenRes.data || [];
                                                  // Update items with new rating status
                                                  const updatedItems = itemsNeedingRating.map((item) => {
                                                    const existingRating = updatedRatingsGiven.find(r => r.productId === item.productId);
                                                    return {
                                                      ...item,
                                                      isRated: !!existingRating,
                                                      existingRating: existingRating ? {
                                                        score: existingRating.score || existingRating.rating || 0,
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
                                                  setLoading((prev) => ({ ...prev, ratings: false }));
                                                }
                                              }}
                                            >
                                              {loading.ratings ? <CircularProgress size={20} /> : 'Submit Rating'}
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

export default SellerProfilePage;
