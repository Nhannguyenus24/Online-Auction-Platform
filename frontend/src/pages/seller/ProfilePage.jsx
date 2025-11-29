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
  Inventory,
  EmojiEvents,
  ShoppingCart,
  Star,
  Visibility,
  VisibilityOff,
  Edit,
  Save,
  Cancel,
  AccessTime,
  LocalOffer,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';
import {
  mockGetSellerProducts,
  mockGetSellerWonItems,
  mockGetSellerOrders,
} from '../../mocks';

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
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data states for tabs
  const [myProducts, setMyProducts] = useState([]);
  const [wonItems, setWonItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({
    products: false,
    won: false,
    orders: false,
  });

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
      if (tabValue === 2 && myProducts.length === 0) {
        setLoading((prev) => ({ ...prev, products: true }));
        try {
          const response = await mockGetSellerProducts(500);
          setMyProducts(response.data || []);
        } catch (err) {
          console.error('Error fetching products:', err);
        } finally {
          setLoading((prev) => ({ ...prev, products: false }));
        }
      } else if (tabValue === 3 && wonItems.length === 0) {
        setLoading((prev) => ({ ...prev, won: true }));
        try {
          const response = await mockGetSellerWonItems(500);
          setWonItems(response.data || []);
        } catch (err) {
          console.error('Error fetching won items:', err);
        } finally {
          setLoading((prev) => ({ ...prev, won: false }));
        }
      } else if (tabValue === 4 && orders.length === 0) {
        setLoading((prev) => ({ ...prev, orders: true }));
        try {
          const response = await mockGetSellerOrders(500);
          setOrders(response.data || []);
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setLoading((prev) => ({ ...prev, orders: false }));
        }
      }
    };

    fetchData();
  }, [tabValue, myProducts.length, wonItems.length, orders.length]);

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
  const ProductCard = ({ product, showStatus = false, showViews = false }) => (
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
        {showStatus && (
          <Chip
            label={product.status === 'pending_payment' ? 'Pending Payment' : product.status === 'paid' ? 'Paid' : product.status === 'shipping' ? 'Shipping' : 'Completed'}
            size="small"
            color={product.status === 'completed' ? 'success' : product.status === 'pending_payment' ? 'warning' : 'info'}
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
            {product.winningPrice ? 'Winning Price' : 'Current Price'}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
            {formatPrice(product.winningPrice || product.currentPrice)}
          </Typography>
          {showViews && product.views && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {product.views} views
            </Typography>
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

            {/* Tab 2: My Products */}
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  My Products
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Products you're currently listing
                </Typography>
                {loading.products ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : myProducts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Inventory sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Active Listings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Start selling by creating your first auction listing
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/seller/create-auction')}
                    >
                      Create Auction
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {myProducts.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard product={product} showViews />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Tab 3: Won Items */}
            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Products with Winners
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Products that have been won by bidders
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
                      Your products haven't been won by any bidders yet
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

            {/* Tab 4: Orders */}
            {tabValue === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Orders
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Manage your sales and transactions
                </Typography>
                {loading.orders ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : orders.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <ShoppingCart sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Orders Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orders will appear here once buyers complete their purchases
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Buyer</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {order.orderId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                  component="img"
                                  src={order.productImage}
                                  alt={order.productTitle}
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                  }}
                                />
                                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                  {order.productTitle}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{order.buyerName}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="primary">
                                {formatPrice(order.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  order.status === 'pending_payment'
                                    ? 'Pending Payment'
                                    : order.status === 'paid'
                                    ? 'Paid'
                                    : order.status === 'shipping'
                                    ? 'Shipping'
                                    : order.status === 'completed'
                                    ? 'Completed'
                                    : 'Cancelled'
                                }
                                size="small"
                                color={
                                  order.status === 'completed'
                                    ? 'success'
                                    : order.status === 'pending_payment'
                                    ? 'warning'
                                    : order.status === 'cancelled'
                                    ? 'error'
                                    : 'info'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {fVNDate(order.orderDate)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/product/${order.productId}`)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
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
