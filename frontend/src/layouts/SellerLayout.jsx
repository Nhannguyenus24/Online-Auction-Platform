import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  AddCircle as AddCircleIcon,
  ListAlt as ListAltIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

const SellerLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = [
    { title: 'Dashboard', path: '/seller/home', icon: <HomeIcon /> },
    { title: 'Create Auction', path: '/seller/create-auction', icon: <AddCircleIcon /> },
    { title: 'Orders', path: '/seller/orders', icon: <ListAltIcon /> },
    { title: 'Profile', path: '/seller/profile', icon: <PersonIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          height: '100vh',
          bgcolor: 'white',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          zIndex: 1000,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 0 : 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {!collapsed && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              Seller
            </Typography>
          )}
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Menu */}
        <List sx={{ px: collapsed ? 1 : 2, py: 2, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1.25,
                  px: collapsed ? 1 : 1.5,
                  mb: 0.5,
                  minHeight: 44,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  transition: 'all 0.2s',
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  '&:hover': {
                    bgcolor: active
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.action.hover, 0.04),
                  },
                  '&::before': active
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 20,
                        bgcolor: 'primary.main',
                        borderRadius: '0 4px 4px 0',
                      }
                    : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 36,
                    color: active ? 'primary.main' : 'text.secondary',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'primary.main' : 'text.primary',
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: collapsed ? `${COLLAPSED_WIDTH}px` : `${DRAWER_WIDTH}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          p: 3,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default SellerLayout;

