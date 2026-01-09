import { useState, useEffect } from 'react';
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
  AttachMoney,
  Category,
  KeyboardArrowDown,
} from '@mui/icons-material';
import NotificationMenu from '../components/NotificationMenu';
import ShoppingCartMenu from '../components/ShoppingCartMenu';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../utils/api';
import { categoryApi } from '../services/categoryApi';
import { notificationApi } from '../services/notificationApi';
import { watchlistApi } from '../services/watchlistApi';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  
  // Get user info from auth context
  const userName = user?.fullName || user?.name || '';
  
  // Get role from multiple possible sources and normalize it
  const getNormalizedRole = () => {
    // Try multiple ways to get role: role (string), roles[0] (array), roleName
    const rawRole = user?.role || user?.roles?.[0] || user?.roleName || '';
    
    if (!rawRole) return '';
    
    // Convert to string and lowercase
    const roleStr = String(rawRole).toLowerCase();
    
    // Remove "ROLE_" prefix if present (e.g., "ROLE_SELLER" -> "seller")
    const normalizedRole = roleStr.replace(/^role_/, '');
    
    return normalizedRole;
  };
  
  const userRole = getNormalizedRole();
  
  // Get user avatar from multiple possible fields
  const userAvatar = user?.avatar || user?.profilePicture || '';
  
  // Menu states
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElCart, setAnchorElCart] = useState(null);
  const [anchorElCategory, setAnchorElCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Watchlist state
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Categories state
  const [categories, setCategories] = useState([]);
  
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        if (response.success) {
          setCategories(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch notifications when user is authenticated
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      try {
        setNotificationsLoading(true);
        const response = await notificationApi.getUserNotifications();
        if (response.success) {
          setNotifications(response.data || []);
          setUnreadCount(response.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setNotificationsLoading(false);
      }
    };
    
    fetchNotifications();
  }, [isAuthenticated, user]);
  
  // Fetch watchlist when user is authenticated
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!isAuthenticated) {
        setWatchlistItems([]);
        setWatchlistCount(0);
        return;
      }
      
      try {
        setWatchlistLoading(true);
        // Get only 5 items for quick preview
        const response = await watchlistApi.getWatchlist(1, 5, 'active');
        if (response.success) {
          setWatchlistItems(response.data || []);
          setWatchlistCount(response.pageInfo?.totalItems || response.data?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        setWatchlistItems([]);
        setWatchlistCount(0);
      } finally {
        setWatchlistLoading(false);
      }
    };
    
    fetchWatchlist();
  }, [isAuthenticated, user]);
  

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

  const handleMarkAsRead = async (notificationId) => {
    // Optimistic update - update UI immediately for smooth UX
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true, readAt: Date.now() }
          : notif
      )
    );
    
    // Update unread count immediately
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Call API in background
    try {
      await notificationApi.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: false, readAt: null }
            : notif
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleRemoveFromWatchlist = async (productId) => {
    try {
      await watchlistApi.removeFromWatchlist(productId);
      
      // Update local state
      setWatchlistItems(prevItems => prevItems.filter(item => item.id !== productId));
      setWatchlistCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      // Optionally show error to user
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
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>

                {/* Watchlist (For all authenticated users) */}
                <IconButton
                  onClick={handleOpenCartMenu}
                  sx={{
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'primary.lighter' },
                  }}
                >
                  <Badge badgeContent={watchlistCount} color="primary">
                    <ShoppingCart />
                  </Badge>
                </IconButton>

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
              {userRole === 'bidder' 
                ? 'Bidder' 
                : userRole === 'seller' 
                ? 'Seller' 
                : userRole === 'admin'
                ? 'Admin'
                : userRole 
                ? userRole.charAt(0).toUpperCase() + userRole.slice(1) 
                : 'Bidder'}
            </Typography>
          </Box>
        <Divider />

        <MenuItem onClick={() => { 
          if (userRole === 'bidder') {
            navigate('/bidder/profile');
          } else if (userRole === 'seller') {
            navigate('/seller/home');
          } else {
            navigate('/admin/dashboard'); // Default fallback
          }
          handleCloseUserMenu(); 
        }}>
          <ListItemIcon>
            {userRole === 'admin' ? <Dashboard fontSize="small" /> : userRole === 'seller' ? <AttachMoney fontSize="small" /> : <Person fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {userRole === 'bidder' ? 'Profile' : userRole === 'seller' ? 'Seller Dashboard' : 'Admin Dashboard'}
          </ListItemText>
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
        loading={notificationsLoading}
        onMarkAsRead={handleMarkAsRead}
      />

      {/* Saved Items / Cart Menu */}
      <ShoppingCartMenu
        anchorEl={anchorElCart}
        open={Boolean(anchorElCart)}
        onClose={handleCloseCartMenu}
        items={watchlistItems}
        itemCount={watchlistCount}
        loading={watchlistLoading}
        onRemove={handleRemoveFromWatchlist}
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
                    ?.children?.map((child) => (
                      <Grid item xs={6} key={`${hoveredCategory}-${child.id}`}>
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
                            <Typography sx={{ fontSize: '1.25rem' }}>{child.name}</Typography>
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
      </Menu>
    </AppBar>
  );
};

export default Header;
