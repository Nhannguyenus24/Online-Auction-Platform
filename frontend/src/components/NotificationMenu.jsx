import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Skeleton,
} from '@mui/material';
import { fVNDate } from '../utils/formatTime';

const NotificationMenu = ({ anchorEl, open, onClose, notifications, loading, onMarkAsRead }) => {

  const handleNotificationClick = (notification) => {
    // Mark as read only if not already read
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

  };
  const TITLE_MAP = {
    "BID_OUTBID": 'You have been outbid',
    "BID_SUCCESS": 'You won the item',
    "ACCOUNT_VIOLATION_WARNING": 'Account Warning',
    "PRODUCT_BANNED_USER": 'Product Restricted',
    "AUCTION_WON": 'Auction Won',
    "AUCTION_SOLD": 'Item Sold',
    "AUCTION_ENDED": 'Auction Ended',
    "AUCTION_ENDED_NO_SALE": 'Auction Ended Without Any Bid',
    "OTP_VERIFICATION": 'OTP Verification',
  };

  const title = (notification) => TITLE_MAP[notification.type] || 'Unknown Notification';
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
        <Box sx={{ px: 2, py: 1.5 }}>
          {[...Array(3)].map((_, index) => (
            <Box key={`skeleton-notif-${index}`} sx={{ mb: 1.5 }}>
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="60%" height={12} />
            </Box>
          ))}
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
                  {title(notif)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {notif.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fVNDate(notif.createdAt)}
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
