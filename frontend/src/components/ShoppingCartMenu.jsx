import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Skeleton,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ShoppingCartMenu = ({ anchorEl, open, onClose, items, itemCount, loading, onRemove }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRemove = (e, productId) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (onRemove) {
      onRemove(productId);
    }
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
          width: 380,
          maxHeight: 450,
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="h6" fontWeight="bold">
          Watchlist ({itemCount})
        </Typography>
      </Box>
      <Divider />
      
      {loading ? (
        <Box sx={{ px: 2, py: 1.5 }}>
          {[...Array(3)].map((_, index) => (
            <Box key={`skeleton-item-${index}`} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'flex-start' }}>
              <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1, flexShrink: 0 }} />
              <Box sx={{ flexGrow: 1, width: '100%' }}>
                <Skeleton variant="text" width="80%" height={18} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="50%" height={16} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Your watchlist is empty
          </Typography>
        </Box>
      ) : (
        items.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => { navigate(`/product/${item.id}`); onClose(); }}
            sx={{ py: 1.5, px: 2, alignItems: 'flex-start' }}
          >
            <Box
              component="img"
              src={item.images?.[0]?.url || item.image || '/placeholder-image.jpg'}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                objectFit: 'cover',
                mr: 2,
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight="600" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="bold">
                {formatPrice(item.currentPrice || item.price || 0)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => handleRemove(e, item.id)}
              sx={{
                color: 'error.main',
                '&:hover': { bgcolor: 'error.lighter' },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </MenuItem>
        ))
      )}
      
      {items.length > 0 && (
        <div>
          <Divider />
          <MenuItem onClick={() => { navigate('/bidder/watchlist'); onClose(); }} sx={{ justifyContent: 'center' }}>
            <Typography variant="body2" color="primary" fontWeight="bold">
              View Full Watchlist
            </Typography>
          </MenuItem>
        </div>
      )}
    </Menu>
  );
};

export default ShoppingCartMenu;
