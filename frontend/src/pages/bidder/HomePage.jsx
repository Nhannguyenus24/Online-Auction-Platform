import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Gavel,
  EmojiEvents,
  TrendingUp,
} from '@mui/icons-material';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import ProductCard from '../../components/ProductCard';
import { formatPrice } from '../../utils/formatNumber';
import { mockGetBiddingHistory, mockGetWonItems } from '../../mocks';

const BidderHomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ active: false, won: false });
  const [activeBids, setActiveBids] = useState([]);
  const [wonItems, setWonItems] = useState([]);
  const [stats, setStats] = useState({
    activeBids: 0,
    wonItems: 0,
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

    };

    fetchData();
  }, []);

  const handleCompleteOrder = (product) => {
    // Generate orderId from productId (in real app, this would come from API)
    const orderId = `ORD-${String(product.productId || product.id).padStart(3, '0')}`;
    navigate(`/bidder/order-completion/${orderId}`);
  };


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
              simple
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Won Items"
              value={stats.wonItems}
              icon={<EmojiEvents />}
              color="success"
              simple
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Spent"
              value={formatPrice(stats.totalSpent)}
              icon={<TrendingUp />}
              color="info"
              simple
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
                    <ProductCard 
                      product={item} 
                      isWonItem 
                      onCompleteOrder={handleCompleteOrder}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

      </Container>
    </Page>
  );
};

export default BidderHomePage;
