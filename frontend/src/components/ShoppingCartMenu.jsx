import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ShoppingCartMenu = ({ anchorEl, open, onClose, items, itemCount }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
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
      
      {items.map((item) => (
        <MenuItem
          key={item.id}
          onClick={() => { navigate(`/products/${item.id}`); onClose(); }}
          sx={{ py: 1.5, px: 2, alignItems: 'flex-start' }}
        >
          <Box
            component="img"
            src={item.image}
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
              {formatPrice(item.price)}
            </Typography>
          </Box>
        </MenuItem>
      ))}
      
      <Divider />
      <MenuItem onClick={() => { navigate('/bidder/watchlist'); onClose(); }} sx={{ justifyContent: 'center' }}>
        <Typography variant="body2" color="primary" fontWeight="bold">
          View Full Watchlist
        </Typography>
      </MenuItem>
    </Menu>
  );
};

export default ShoppingCartMenu;
