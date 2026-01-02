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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  const [ratingsGiven, setRatingsGiven] = useState([]);
  const [itemsNeedingRating, setItemsNeedingRating] = useState([]);
  const [loading, setLoading] = useState({
    profile: false,
    ratings: false,
  });
  const [ratingSubTab, setRatingSubTab] = useState(0); // 0: Received, 1: Given, 2: Rate Winners
  const [ratingForm, setRatingForm] = useState({}); // { productId: { rating: 1/-1, comment: '' } }

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

  const handleSaveProfile = () => {
    // Will be implemented with API call later
    console.log('Saving profile:', profileData);
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCancelEdit = async () => {
    try {
      setLoading((prev) => ({ ...prev, profile: true }));
      const response = await authApi.getProfile();
      const profile = response.data?.profile || {};
      setProfileData({
        id: profile.userId || profile.id || null,
        name: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phoneNumber || '',
        address: profile.address || '',
        avatar: profile.avatar || profile.profilePicture || '',
        rating: profile.rating || 0,
        totalRatings: profile.totalRatings || 0,
        positiveRatings: profile.positiveRatings || 0,
        negativeRatings: profile.negativeRatings || 0,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
      setIsEditing(false);
      setErrorMessage('');
    }
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

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading((prev) => ({ ...prev, profile: true }));
        const response = await authApi.getProfile();
        const profile = response.data?.profile || {};
        setProfileData({
          id: profile.userId || profile.id || null,
          name: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phoneNumber || '',
          address: profile.address || '',
          avatar: profile.avatar || profile.profilePicture || '',
          rating: profile.rating || 0,
          totalRatings: profile.totalRatings || 0,
          positiveRatings: profile.positiveRatings || 0,
          negativeRatings: profile.negativeRatings || 0,
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
          const [receivedRes, givenRes, needingRes] = await Promise.all([
            sellerApi.getRatingsReceived(),
            sellerApi.getRatingsGiven(),
            sellerApi.getItemsNeedingRating(),
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

                <Box sx={{ maxWidth: 600 }}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileData.name}
                      onChange={handleProfileChange('name')}
                      disabled={!isEditing}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      disabled={!isEditing}
                    />
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={handleProfileChange('phone')}
                      disabled={!isEditing}
                    />
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={profileData.address}
                      onChange={handleProfileChange('address')}
                      disabled={!isEditing}
                    />
                  </Stack>

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

            {/* Tab 2: Ratings & Reviews */}
            {tabValue === 2 && (
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
                            Rate Winners
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
                              Rate winners after completing transactions
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

                    {/* Sub Tab 2: Rate Winners */}
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
                                        Winner: {item.winnerName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Completed: {fVNDate(item.completedDate)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <Stack spacing={2}>
                                        <Box>
                                          <Typography variant="body2" gutterBottom>
                                            Rate Winner
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
                                          onClick={async () => {
                                            try {
                                              const orderId = item.orderId || item.id;
                                              const rating = ratingForm[item.productId]?.rating;
                                              const comment = ratingForm[item.productId]?.comment || '';
                                              await sellerApi.rateBidder(orderId, rating, comment);
                                              setSuccessMessage('Rating submitted successfully!');
                                              setTimeout(() => setSuccessMessage(''), 3000);
                                              // Remove item from list
                                              setItemsNeedingRating((prev) =>
                                                prev.filter((i) => i.id !== item.id)
                                              );
                                              // Clear form
                                              setRatingForm((prev) => {
                                                const newForm = { ...prev };
                                                delete newForm[item.productId];
                                                return newForm;
                                              });
                                            } catch (err) {
                                              console.error('Error submitting rating:', err);
                                              setErrorMessage(err.response?.data?.message || 'Failed to submit rating');
                                              setTimeout(() => setErrorMessage(''), 5000);
                                            }
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

export default SellerProfilePage;
