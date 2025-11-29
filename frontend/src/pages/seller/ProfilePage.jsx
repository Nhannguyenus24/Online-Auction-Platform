import { useState } from 'react';
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
} from '@mui/material';
import {
  Person,
  Lock,
  Inventory,
  EmojiEvents,
  ShoppingCart,
  Star,
  Visibility,
  VisibilityOff,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import Page from '../../components/Page';

// Mock user data - will be replaced with API call later
const mockUserData = {
  id: 1,
  name: 'Jane Seller',
  email: 'jane.seller@example.com',
  phone: '+84 987 654 321',
  address: '456 Business Street, Ho Chi Minh City',
  dateOfBirth: '1985-05-20',
  avatar: 'https://i.pravatar.cc/150?img=5',
  rating: 4.8,
  totalRatings: 32,
  positiveRatings: 30,
  negativeRatings: 2,
};

const SellerProfilePage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const tabs = [
    { label: 'Personal Info', icon: <Person />, value: 0 },
    { label: 'Change Password', icon: <Lock />, value: 1 },
    { label: 'My Products', icon: <Inventory />, value: 2 },
    { label: 'Won Items', icon: <EmojiEvents />, value: 3 },
    { label: 'Orders', icon: <ShoppingCart />, value: 4 },
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

            {/* Tab 2-5: Placeholder for other tabs */}
            {tabValue === 2 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Inventory sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  My Products
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This section will be implemented in Step 2
                </Typography>
              </Box>
            )}

            {tabValue === 3 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <EmojiEvents sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Won Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This section will be implemented in Step 2
                </Typography>
              </Box>
            )}

            {tabValue === 4 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ShoppingCart sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This section will be implemented in Step 2
                </Typography>
              </Box>
            )}

            {tabValue === 5 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Star sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Ratings & Reviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This section will be implemented in Step 3
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default SellerProfilePage;
