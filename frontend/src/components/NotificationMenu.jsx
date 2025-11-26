import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotificationMenu = ({ anchorEl, open, onClose, notifications }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notificationId) => {
    // Handle notification click logic here
    onClose();
  };

  const handleMarkAllRead = () => {
    // Handle mark all as read logic here
    console.log('Mark all notifications as read');
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: 360,
          maxHeight: 400,
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Notifications
        </Typography>
        <Button size="small" sx={{ textTransform: 'none' }} onClick={handleMarkAllRead}>
          Mark all read
        </Button>
      </Box>
      <Divider />
      
      {notifications.map((notif) => (
        <MenuItem
          key={notif.id}
          onClick={() => handleNotificationClick(notif.id)}
          sx={{
            py: 1.5,
            px: 2,
            bgcolor: notif.read ? 'transparent' : 'primary.lighter',
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {notif.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {notif.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notif.time}
              </Typography>
            </Box>
            {!notif.read && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              />
            )}
          </Box>
        </MenuItem>
      ))}
      
      <Divider />
      <MenuItem onClick={() => { navigate('/notifications'); onClose(); }} sx={{ justifyContent: 'center' }}>
        <Typography variant="body2" color="primary" fontWeight="bold">
          View All Notifications
        </Typography>
      </MenuItem>
    </Menu>
  );
};

export default NotificationMenu;
