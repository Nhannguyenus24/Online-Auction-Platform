import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Gavel,
  EmojiEvents,
  TrendingUp,
  Search,
  Clear,
} from '@mui/icons-material';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import ProductCard from '../../components/ProductCard';
import { formatPrice } from '../../utils/formatNumber';
import { bidderApi } from '../../services/bidderApi';

const BidderHomePage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
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
        const biddingRes = await bidderApi.getBiddingHistory(1, 100, 'all');
        
        // Map API response to component format
        const mappedBids = (biddingRes.data || []).map((bid) => ({
          id: bid.bidId,
          productId: bid.productId,
          title: bid.productTitle,
          image: bid.productPrimaryImage,
          myBid: bid.bidAmount,
          currentPrice: bid.currentPrice,
          isHighestBidder: bid.isWinning,
          endTime: bid.productEndsAt * 1000, // Convert Unix timestamp to milliseconds
          bidCount: null, // Not available in API response
          condition: null, // Not available in API response
          productStatus: bid.productStatus,
        }));
        
        // Filter active bids (not ended and not won)
        const activeBidsData = mappedBids.filter((bid) => {
          const endTime = new Date(bid.endTime);
          const now = new Date();
          const isEnded = bid.productStatus === 'ended' || endTime <= now;
          return !isEnded;
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
        const wonRes = await bidderApi.getWonItems(1, 100);
        
        // Map API response to component format for won items
        const wonData = (wonRes.data || []).map((item) => ({
          id: item.bidId,
          productId: item.productId,
          title: item.productTitle,
          image: item.productPrimaryImage,
          winningPrice: item.currentPrice, // Use currentPrice as winningPrice for won items
          currentPrice: item.currentPrice,
          isHighestBidder: item.isWinning,
          endTime: item.productEndsAt * 1000, // Convert Unix timestamp to milliseconds
          bidCount: null, // Not available in API response
          condition: null, // Not available in API response
          status: item.productStatus, // For won items status display
        }));
        
        setWonItems(wonData);
        setStats((prev) => ({
          ...prev,
          wonItems: wonData.length,
          totalSpent: wonData.reduce((sum, item) => sum + (item.winningPrice || item.currentPrice || 0), 0),
        }));
      } catch (err) {
        console.error('Error fetching won items:', err);
      } finally {
        setLoading((prev) => ({ ...prev, won: false }));
      }

    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchQuery(''); // Reset search when switching tabs
  };

  // Filter products based on search query
  const filteredActiveBids = activeBids.filter((bid) =>
    bid.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWonItems = wonItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompleteOrder = (product) => {
    // Generate orderId from productId (in real app, this would come from API)
    const orderId = `order_${String(product.productId || product.id).padStart(3, '0')}`;
    navigate(`/bidder/order-completion/${orderId}`);
  };


  return (
    <Page title="Bidder Dashboard - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Bidder Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of your bidding activity and won items
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Active Bids"
              value={stats.activeBids}
              icon={<Gavel />}
              color="primary"
              simple
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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

        {/* Tabs */}
        <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              },
            }}
          >
            <Tab
              icon={<Gavel />}
              iconPosition="start"
              label={`Active Bids (${activeBids.length})`}
            />
            <Tab
              icon={<EmojiEvents />}
              iconPosition="start"
              label={`Won Items (${wonItems.length})`}
            />
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder={`Search ${tabValue === 0 ? 'active bids' : 'won items'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 400 }}
              />
            </Box>

            {/* Active Bids Tab */}
            {tabValue === 0 && (
              <Box>
                {loading.active ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredActiveBids.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Gavel sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {searchQuery ? 'No bids found' : 'No Active Bids'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Start bidding on products to see them here'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredActiveBids.map((bid) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={bid.id}>
                        <ProductCard product={bid} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Won Items Tab */}
            {tabValue === 1 && (
              <Box>
                {loading.won ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredWonItems.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <EmojiEvents sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {searchQuery ? 'No items found' : 'No Won Items Yet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Keep bidding to win your first item!'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredWonItems.map((item) => (
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
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderHomePage;
