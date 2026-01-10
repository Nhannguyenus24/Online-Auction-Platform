import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import {
  AccessTime,
  LocalOffer,
  CheckCircle,
  Visibility,
  Bolt,
} from '@mui/icons-material';
import { formatPrice } from '../utils/formatNumber';
import { normalizeTimestamp } from '../utils/formatTime';

// Check if product is newly listed (within 30 minutes)
const isNewlyListed = (createdAt) => {
  if (!createdAt) return false;
  const created = normalizeTimestamp(createdAt);
  const now = new Date();
  const diffMinutes = (now - created) / (1000 * 60);
  return diffMinutes <= 30;
};

const ProductCard = ({
  product,
  isWonItem = false,
  showStatus = false,
  showViews = false,
  showWinner = false,
  onCompleteOrder,
}) => {
  const navigate = useNavigate();
  
  // Check if user is highest bidder (for active bids)
  const isHighestBidder = product.isHighestBidder || product.isWinning;

  const getTimeLeft = (endTime) => {
    if (!endTime) return 'N/A';
    const end = normalizeTimestamp(endTime);
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

  return (
    <Card
      elevation={0}
      sx={{
        cursor: 'pointer',
        height: '100%',
        width: 350,
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: isHighestBidder && !isWonItem ? 'success.main' : 'grey.200',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s',
        position: 'relative',
        bgcolor: isHighestBidder && !isWonItem ? 'success.50' : 'background.paper',
        '&:hover': {
          boxShadow: isHighestBidder && !isWonItem 
            ? '0 8px 24px rgba(76, 175, 80, 0.2)' 
            : '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
          borderColor: isHighestBidder && !isWonItem ? 'success.dark' : 'primary.main',
        },
      }}
      onClick={() => navigate(`/product/${product.productId || product.id}`)}
    >
      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.50' }}>
        <CardMedia
          component="img"
          image={product.image || product.primaryImageUrl || '/placeholder-image.jpg'}
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
            {product.bidCount || product.bidsCount || 0} bids
          </Typography>
        </Box>
        {isNewlyListed(product.createdAt) && (
          <Chip
            icon={<Bolt />}
            label="New"
            size="small"
            variant="filled"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
              color: 'white',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.7)' },
                '70%': { boxShadow: '0 0 0 6px rgba(255, 107, 107, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0)' },
              },
            }}
          />
        )}
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
        {isWonItem && product.isHighestBidder && (
          <Chip
            icon={<CheckCircle />}
            label="Won"
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 'bold',
            }}
          />
        )}
        {!isWonItem && isHighestBidder && (
          <Chip
            icon={<CheckCircle />}
            label="Leading"
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 'bold',
              bgcolor: 'success.main',
              color: 'white',
              boxShadow: 2,
            }}
          />
        )}
        {showStatus && product.status && (() => {
          const status = product.status?.toLowerCase() || 'active';
          const statusMap = {
            'active': { label: 'Active', color: 'success' },
            'ended': { label: 'Ended', color: 'default' },
            'pending': { label: 'Pending', color: 'warning' },
            'cancelled': { label: 'Cancelled', color: 'error' },
          };
          const statusInfo = statusMap[status] || { label: status, color: 'default' };
          return (
            <Chip
              label={statusInfo.label}
              size="small"
              color={statusInfo.color}
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                fontWeight: 'bold',
              }}
            />
          );
        })()}
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
          {isWonItem ? (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Winning Price
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
                {formatPrice(product.winningPrice)}
              </Typography>
              {product.status && (
                <Chip
                  label={product.status.replace(/_/g, ' ')}
                  size="small"
                  color={
                    product.status === 'completed'
                      ? 'success'
                      : product.status === 'pending_payment'
                      ? 'warning'
                      : 'info'
                  }
                  sx={{ textTransform: 'capitalize', fontSize: '0.7rem', mb: 1.5 }}
                />
              )}
              {(product.status === 'pending_payment' || product.status === 'paid' || product.status === 'shipping') && onCompleteOrder && (
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteOrder(product);
                  }}
                  sx={{ mt: 1, fontWeight: 'bold' }}
                >
                  Complete Order
                </Button>
              )}
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {isHighestBidder ? 'Your Bid (Leading)' : 'Current Bid'}
                  </Typography>
                  <Typography
                    variant="h6"
                    color={isHighestBidder ? 'success.main' : 'primary'}
                    fontWeight="bold"
                  >
                    {formatPrice(product.currentPrice || product.winningPrice || 0)}
                  </Typography>
                </Box>
                {showViews && (product.views !== undefined || product.viewsCount !== undefined) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {product.views || product.viewsCount || 0}
                    </Typography>
                  </Box>
                )}
              </Box>
              {product.myBid && product.myBid !== product.currentPrice && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Your bid: {formatPrice(product.myBid)}
                </Typography>
              )}
              {(product.endTime || product.endsAt) && (
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
                    {getTimeLeft(product.endTime || (typeof product.endsAt === 'string' ? parseInt(product.endsAt) : product.endsAt))} left
                  </Typography>
                </Box>
              )}
              {showWinner && product.winnerName && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  Winner: {product.winnerName}
                </Typography>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

