import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  LocalOffer,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { mockGetWatchList } from '../../mocks';

const BidderWatchListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [watchList, setWatchList] = useState([]);
  const [error, setError] = useState(null);

  // Use mock data for now - will be replaced with real API call in Step 2
  useEffect(() => {
    const fetchWatchList = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use mock data - set to false to see products, true to see empty state
        const response = await mockGetWatchList(false, 500);
        setWatchList(response.data || []);
      } catch (err) {
        console.error('Error fetching watch list:', err);
        setError('Failed to load watch list. Please try again.');
        setWatchList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchList();
  }, []);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    const end = new Date(endTime);
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

  const handleRemoveFromWatchList = (productId, event) => {
    event.stopPropagation();
    // Will be implemented in Step 3
    console.log('Remove product from watch list:', productId);
  };

  const ProductCard = ({ product }) => (
    <Card
      elevation={0}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
        },
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'grey.50' }}>
        <CardMedia
          component="img"
          image={product.image || '/placeholder-image.jpg'}
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
            {product.bidCount || 0} bids
          </Typography>
        </Box>
        <IconButton
          onClick={(e) => handleRemoveFromWatchList(product.id, e)}
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'error.main',
              color: 'white',
            },
            transition: 'all 0.2s',
          }}
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
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
      </Box>
      <CardContent
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}
      >
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
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Bid
          </Typography>
          <Typography
            variant="h6"
            color="primary"
            fontWeight="bold"
            sx={{ mb: 1.5 }}
          >
            {formatPrice(product.currentPrice)}
          </Typography>
          {product.buyNowPrice && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Buy Now: {formatPrice(product.buyNowPrice)}
            </Typography>
          )}
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
              {getTimeLeft(product.endTime)} left
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <FavoriteIcon
        sx={{
          fontSize: 80,
          color: 'grey.300',
          mb: 2,
        }}
      />
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Your Watch List is Empty
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        Start exploring products and add them to your watch list to keep track of auctions you're interested in.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Chip
          label="Browse Products"
          onClick={() => navigate('/')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="View Categories"
          onClick={() => navigate('/category')}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>
    </Box>
  );

  return (
    <Page title="Watch List - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            My Watch List
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Products you've saved for later
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}
          >
            <CircularProgress />
          </Box>
        ) : watchList.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {watchList.length} {watchList.length === 1 ? 'item' : 'items'} in your watch list
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {watchList.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Page>
  );
};

export default BidderWatchListPage;
