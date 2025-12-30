import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Container,
  Stack,
  Grid,
} from '@mui/material';
import {
  Search,
  Notifications,
  ShoppingCart,
  Gavel,
  Person,
  Settings,
  Logout,
  Dashboard,
  Favorite,
  AttachMoney,
  Category,
  KeyboardArrowDown,
} from '@mui/icons-material';
import NotificationMenu from '../components/NotificationMenu';
import ShoppingCartMenu from '../components/ShoppingCartMenu';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../utils/api';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  
  // Debug logs
  console.log('Header render - isAuthenticated:', isAuthenticated, 'user:', user);
  
  // Get user info from auth context
  const userName = user?.fullName || user?.name || '';
  const userRole = user?.roles?.[0]?.toLowerCase() || user?.roleName?.toLowerCase() || '';
  const userAvatar = user?.avatar || user?.profilePicture || '';
  
  // Menu states
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElCart, setAnchorElCart] = useState(null);
  const [anchorElCategory, setAnchorElCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  // Mock data
  const [notificationCount] = useState(3);
  const [cartCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New Bid Placed', message: 'Someone bid on "Luxury Watch"', time: '5 min ago', read: false },
    { id: 2, title: 'Auction Ending Soon', message: 'MacBook Pro ends in 2 hours', time: '1 hour ago', read: false },
    { id: 3, title: 'You Won!', message: 'Congratulations on winning the auction', time: '2 hours ago', read: true },
  ];

  // Mock saved items
  const savedItems = [
    { id: 1, title: 'Luxury Swiss Watch', price: 25000000, image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=100' },
    { id: 2, title: 'MacBook Pro 16"', price: 65000000, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100' },
    { id: 3, title: 'Gaming Laptop', price: 45000000, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100' },
  ];

  // Categories data (2-level)
  const categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      icon: '💻',
      children: [
        { id: 'watches', name: 'Watches', icon: '⌚' },
        { id: 'laptops', name: 'Laptops', icon: '💻' },
        { id: 'smartphones', name: 'Smartphones', icon: '📱' },
        { id: 'headphones', name: 'Headphones', icon: '🎧' },
        { id: 'cameras', name: 'Cameras', icon: '📷' },
      ],
    },
    {
      id: 'fashion',
      name: 'Fashion',
      icon: '👗',
      children: [
        { id: 'mens-clothing', name: "Men's Clothing", icon: '👔' },
        { id: 'womens-clothing', name: "Women's Clothing", icon: '👗' },
        { id: 'shoes', name: 'Shoes', icon: '👟' },
        { id: 'accessories', name: 'Accessories', icon: '👜' },
      ],
    },
    {
      id: 'home',
      name: 'Home & Living',
      icon: '🏠',
      children: [
        { id: 'furniture', name: 'Furniture', icon: '🛋️' },
        { id: 'decor', name: 'Decor', icon: '🖼️' },
        { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
        { id: 'garden', name: 'Garden', icon: '🌿' },
      ],
    },
    {
      id: 'collectibles',
      name: 'Collectibles',
      icon: '🎨',
      children: [
        { id: 'art', name: 'Art', icon: '🎨' },
        { id: 'coins', name: 'Coins', icon: '🪙' },
        { id: 'stamps', name: 'Stamps', icon: '📮' },
        { id: 'antiques', name: 'Antiques', icon: '🏺' },
      ],
    },
  ];

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifMenu = (event) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };

  const handleOpenCartMenu = (event) => {
    setAnchorElCart(event.currentTarget);
  };

  const handleCloseCartMenu = () => {
    setAnchorElCart(null);
  };

  const handleOpenCategoryMenu = (event) => {
    setAnchorElCategory(event.currentTarget);
  };

  const handleCloseCategoryMenu = () => {
    setAnchorElCategory(null);
    setHoveredCategory(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authLogout();
      handleCloseUserMenu();
      navigate('/auth/login');
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={1}
      sx={{ 
        bgcolor: 'white', 
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 70 } }}>
          {/* Logo */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              mr: 4,
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Gavel sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              AuctionHub
            </Typography>
          </Box>

          {/* Categories Dropdown */}
          <Button
            onClick={handleOpenCategoryMenu}
            endIcon={<KeyboardArrowDown />}
            startIcon={<Category />}
            sx={{
              mr: 2,
              borderRadius: 2,
              px: 2,
              py: 1,
              color: 'text.primary',
              bgcolor: 'grey.50',
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'grey.100',
              },
              display: { xs: 'none', lg: 'flex' },
            }}
          >
            Categories
          </Button>

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ 
              flexGrow: 1, 
              maxWidth: 600,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  bgcolor: 'grey.50',
                  '& fieldset': { border: 'none' },
                  '&:hover': { bgcolor: 'grey.100' },
                },
              }}
            />
          </Box>

          {/* Right Side - Conditional Rendering */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isAuthenticated ? (
              // Not Logged In - Show Login Button
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/auth/login')}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 'bold',
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth/register')}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 'bold',
                    boxShadow: 2,
                  }}
                >
                  Sign Up
                </Button>
              </Stack>
            ) : (
              // Logged In - Show User Menu, Notifications, and Cart
              <div>
                {/* Notifications */}
                <IconButton
                  onClick={handleOpenNotifMenu}
                  sx={{
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'primary.lighter' },
                  }}
                >
                  <Badge badgeContent={notificationCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>

                {/* Cart/Saved Items (Only for Bidders) */}
                {userRole === 'bidder' && (
                  <IconButton
                    onClick={handleOpenCartMenu}
                    sx={{
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'primary.lighter' },
                    }}
                  >
                    <Badge badgeContent={cartCount} color="primary">
                      <ShoppingCart />
                    </Badge>
                  </IconButton>
                )}

                {/* User Avatar & Name */}
                <Button
                  onClick={handleOpenUserMenu}
                  sx={{
                    ml: 1,
                    borderRadius: 3,
                    textTransform: 'none',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  <Avatar
                    src={userAvatar}
                    alt={userName}
                    sx={{ width: 36, height: 36, mr: 1 }}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Typography variant="body2" fontWeight="600" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {userName || 'User'}
                  </Typography>
                </Button>
              </div>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* User Menu */}
      {isAuthenticated && (
        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 220,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {userName || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}
            </Typography>
          </Box>
        <Divider />
        
        {userRole === 'admin' && (
          <MenuItem onClick={() => { navigate('/admin/dashboard'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
        )}
        
        {userRole === 'seller' && (
          <MenuItem onClick={() => { navigate('/seller/dashboard'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <AttachMoney fontSize="small" />
            </ListItemIcon>
            <ListItemText>My Auctions</ListItemText>
          </MenuItem>
        )}
        
        {userRole === 'bidder' && (
          <div>
            <MenuItem onClick={() => { navigate('/bidder/my-bids'); handleCloseUserMenu(); }}>
              <ListItemIcon>
                <Gavel fontSize="small" />
              </ListItemIcon>
              <ListItemText>My Bids</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/bidder/watchlist'); handleCloseUserMenu(); }}>
              <ListItemIcon>
                <Favorite fontSize="small" />
              </ListItemIcon>
              <ListItemText>Watchlist</ListItemText>
            </MenuItem>
          </div>
        )}
        
        <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { navigate('/settings'); handleCloseUserMenu(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Logout</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Notifications Menu */}
      <NotificationMenu
        anchorEl={anchorElNotif}
        open={Boolean(anchorElNotif)}
        onClose={handleCloseNotifMenu}
        notifications={notifications}
      />

      {/* Saved Items / Cart Menu */}
      <ShoppingCartMenu
        anchorEl={anchorElCart}
        open={Boolean(anchorElCart)}
        onClose={handleCloseCartMenu}
        items={savedItems}
        itemCount={cartCount}
      />

      {/* Categories Menu (2-level) */}
      <Menu
        anchorEl={anchorElCategory}
        open={Boolean(anchorElCategory)}
        onClose={handleCloseCategoryMenu}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 700,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ display: 'flex' }}>
          {/* Parent Categories */}
          <Box
            sx={{
              width: 250,
              bgcolor: 'grey.50',
              borderRight: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                Browse Categories
              </Typography>
            </Box>
            {categories.map((category) => (
              <MenuItem
                key={category.id}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onClick={() => {
                  navigate(`/category/${category.id}`);
                  handleCloseCategoryMenu();
                }}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: hoveredCategory === category.id ? 'primary.lighter' : 'transparent',
                  borderLeft: hoveredCategory === category.id ? 3 : 0,
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.lighter',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>{category.icon}</Typography>
                  <Typography variant="body2" fontWeight={hoveredCategory === category.id ? 'bold' : 'normal'}>
                    {category.name}
                  </Typography>
                  <KeyboardArrowDown
                    sx={{
                      ml: 'auto',
                      transform: 'rotate(-90deg)',
                      fontSize: 20,
                      color: hoveredCategory === category.id ? 'primary.main' : 'text.secondary',
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Box>

          {/* Child Categories */}
          <Box sx={{ width: 450, p: 2 }}>
            {hoveredCategory ? (
              <div>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, px: 1 }}>
                  {categories.find((c) => c.id === hoveredCategory)?.name}
                </Typography>
                <Grid container spacing={1}>
                  {categories
                    .find((c) => c.id === hoveredCategory)
                    ?.children.map((child) => (
                      <Grid item xs={6} key={child.id}>
                        <MenuItem
                          onClick={() => {
                            navigate(`/category/${hoveredCategory}/${child.id}`);
                            handleCloseCategoryMenu();
                          }}
                          sx={{
                            borderRadius: 1.5,
                            py: 1.5,
                            '&:hover': {
                              bgcolor: 'primary.lighter',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ fontSize: '1.25rem' }}>{child.icon}</Typography>
                            <Typography variant="body2" fontWeight="500">
                              {child.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Grid>
                    ))}
                </Grid>
              </div>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">Hover over a category to see subcategories</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider />
        <MenuItem
          onClick={() => {
            navigate('/categories');
            handleCloseCategoryMenu();
          }}
          sx={{ justifyContent: 'center', py: 1.5 }}
        >
          <Typography variant="body2" color="primary" fontWeight="bold">
            View All Categories
          </Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
