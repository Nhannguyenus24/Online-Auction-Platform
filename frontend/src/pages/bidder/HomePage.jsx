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
  Chip,
  CircularProgress,
  Stack,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Gavel,
  EmojiEvents,
  Favorite,
  TrendingUp,
  AccessTime,
  LocalOffer,
  CheckCircle,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { mockGetBiddingHistory, mockGetWonItems, mockGetWatchList } from '../../mocks';

const BidderHomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ active: false, won: false, watchList: false });
  const [activeBids, setActiveBids] = useState([]);
  const [wonItems, setWonItems] = useState([]);
  const [watchList, setWatchList] = useState([]);
  const [stats, setStats] = useState({
    activeBids: 0,
    wonItems: 0,
    watchListCount: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active bids (bidding history with future endTime)
      try {
        setLoading((prev) => ({ ...prev, active: true }));
        const biddingRes = await mockGetBiddingHistory(500);
        const activeBidsData = (biddingRes.data || []).filter((bid) => {
          const endTime = new Date(bid.endTime);
          return endTime > new Date();
        });
        setActiveBids(activeBidsData);
        setStats((prev) => ({ ...prev, activeBids: activeBidsData.length }));
      } catch (err) {
        console.error('Error fetching active bids:', err);
      } finally {
        setLoading((prev) => ({ ...prev, active: false }));
      }

      // Fetch won items
      try {
        setLoading((prev) => ({ ...prev, won: true }));
        const wonRes = await mockGetWonItems(500);
        const wonData = wonRes.data || [];
        setWonItems(wonData);
        setStats((prev) => ({
          ...prev,
          wonItems: wonData.length,
          totalSpent: wonData.reduce((sum, item) => sum + (item.winningPrice || 0), 0),
        }));
      } catch (err) {
        console.error('Error fetching won items:', err);
      } finally {
        setLoading((prev) => ({ ...prev, won: false }));
      }

      // Fetch watch list
      try {
        setLoading((prev) => ({ ...prev, watchList: true }));
        const watchRes = await mockGetWatchList(false, 500);
        const watchData = watchRes.data || [];
        setWatchList(watchData);
        setStats((prev) => ({ ...prev, watchListCount: watchData.length }));
      } catch (err) {
        console.error('Error fetching watch list:', err);
      } finally {
        setLoading((prev) => ({ ...prev, watchList: false }));
      }
    };

    fetchData();
  }, []);

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

  const ProductCard = ({ product, isWonItem = false }) => (
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
      onClick={() => navigate(`/product/${product.productId || product.id}`)}
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
                  sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                />
              )}
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {product.isHighestBidder ? 'Your Bid (Leading)' : 'Current Bid'}
              </Typography>
              <Typography
                variant="h6"
                color={product.isHighestBidder ? 'success.main' : 'primary'}
                fontWeight="bold"
                sx={{ mb: 1.5 }}
              >
                {formatPrice(product.currentPrice)}
              </Typography>
              {product.myBid && product.myBid !== product.currentPrice && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Your bid: {formatPrice(product.myBid)}
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
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Page title="Bidder Dashboard - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Bidder Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your bidding activity, won items, and watch list
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Bids"
              value={stats.activeBids}
              icon={<Gavel />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Won Items"
              value={stats.wonItems}
              icon={<EmojiEvents />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Watch List"
              value={stats.watchListCount}
              icon={<Favorite />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Spent"
              value={formatPrice(stats.totalSpent)}
              icon={<TrendingUp />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Active Bids Section */}
        <Card elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Gavel /> Active Bids
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                  Products you are currently bidding on
                </Typography>
              </Box>
              <Chip
                label={`${activeBids.length} items`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
              />
            </Box>
          </Box>
          <CardContent sx={{ p: 3 }}>
            {loading.active ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : activeBids.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Gavel sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Active Bids
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start bidding on products to see them here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {activeBids.map((bid) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={bid.id}>
                    <ProductCard product={bid} />
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Won Items Section */}
        <Card elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents /> Won Items
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                  Products you have successfully won
                </Typography>
              </Box>
              <Chip
                label={`${wonItems.length} items`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
              />
            </Box>
          </Box>
          <CardContent sx={{ p: 3 }}>
            {loading.won ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : wonItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <EmojiEvents sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Won Items Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep bidding to win your first item!
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {wonItems.slice(0, 4).map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ProductCard product={item} isWonItem />
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Watch List Summary */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Favorite /> Watch List
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                  Products you are keeping an eye on
                </Typography>
              </Box>
              <Chip
                label={`${watchList.length} items`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
              />
            </Box>
          </Box>
          <CardContent sx={{ p: 3 }}>
            {loading.watchList ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : watchList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Favorite sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Your Watch List is Empty
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add products to your watch list to track them easily
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {watchList.slice(0, 4).map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ProductCard product={item} />
                  </Grid>
                ))}
              </Grid>
            )}
            {watchList.length > 4 && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Showing 4 of {watchList.length} items
                </Typography>
                <Chip
                  label="View All Watch List"
                  clickable
                  onClick={() => navigate('/bidder/watchlist')}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderHomePage;
