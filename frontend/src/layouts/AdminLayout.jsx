import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  alpha,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  ManageAccounts as ManageAccountsIcon,
  Inventory as InventoryIcon,
  AddBox as AddBoxIcon,
  ListAlt as ListAltIcon,
  Category as CategoryIcon,
  CreateNewFolder as CreateNewFolderIcon,
  FolderOpen as FolderOpenIcon,
  ChevronRight,
  Gavel as GavelIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    main: true,
    user: false,
    product: false,
    category: false,
  });

  const handleToggleSection = (section) => {
    if (!collapsed) {
      setOpenSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const menuSections = [
    {
      id: 'main',
      items: [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
        { title: 'Auctions', path: '/admin/auctions', icon: <GavelIcon /> },
        { title: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
        { title: 'Products', path: '/admin/products', icon: <InventoryIcon /> },
        { title: 'Categories', path: '/admin/categories', icon: <CategoryIcon /> },
      ],
    },
    // {
    //   id: 'user',
    //   title: 'Users',
    //   icon: <PeopleIcon />,
    //   items: [
    //     { title: 'All Users', path: '/admin/users', icon: <PeopleIcon /> },
    //     { title: 'New Registrations', path: '/admin/users/new', icon: <PersonAddIcon /> },
    //     { title: 'User Roles', path: '/admin/users/roles', icon: <ManageAccountsIcon /> },
    //   ],
    // },
    
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              Admin
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
          {menuSections.map((section) => (
            <Box key={section.id} sx={{ mb: 1 }}>
              {section.title && !collapsed && (
                <ListItemButton
                  onClick={() => handleToggleSection(section.id)}
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    px: 1.5,
                    minHeight: 44,
                    mb: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      fontSize: '0.813rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  />
                  <ChevronRight
                    sx={{
                      fontSize: 18,
                      color: 'text.disabled',
                      transform: openSections[section.id] ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </ListItemButton>
              )}

              <Collapse in={collapsed || openSections[section.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items.map((item) => {
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
              </Collapse>
            </Box>
          ))}
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
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;