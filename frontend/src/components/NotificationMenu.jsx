import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
} from '@mui/material';

const NotificationMenu = ({ anchorEl, open, onClose, notifications, loading, onMarkAsRead }) => {


  const handleNotificationClick = (notification) => {
    // Mark as read only if not already read
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    
    // Convert timestamp to milliseconds if it's in seconds (Unix timestamp)
    // Unix timestamps in seconds are typically 10 digits, milliseconds are 13 digits
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    
    const diff = now - timestampMs;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
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
      </Box>
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No notifications yet
          </Typography>
        </Box>
      ) : (
        notifications.map((notif) => (
          <MenuItem
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            sx={{
              py: 1.5,
              px: 2,
              bgcolor: notif.isRead ? 'transparent' : 'primary.lighter',
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
                  {formatTimeAgo(notif.createdAt)}
                </Typography>
              </Box>
              {!notif.isRead && (
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
        ))
      )}
    </Menu>
  );
};

export default NotificationMenu;
