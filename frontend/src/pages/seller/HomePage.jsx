import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  AddBox,
  Search,
  Clear,
  EmojiEvents,
  Inventory,
  AttachMoney,
  Visibility,
  TrendingUp,
} from '@mui/icons-material';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import ProductCard from '../../components/ProductCard';
import { formatPrice } from '../../utils/formatNumber';
import { sellerApi } from '../../services/sellerApi';

const SellerHomePage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [activeListings, setActiveListings] = useState([]);
  const [wonItems, setWonItems] = useState([]);
  const [loading, setLoading] = useState({ active: false, won: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    activeListings: 0,
    wonItems: 0,
    totalRevenue: 0,
    totalViews: 0,
  });

  // Helper function to map API product to frontend format
  const mapProduct = (product, isSoldItem = false) => ({
    ...product,
    views: product.viewsCount || product.views || 0,
    bidCount: product.bidsCount || product.bidCount || 0,
    image: product.primaryImageUrl || product.image || '/placeholder-image.jpg',
    endTime: product.endsAt ? (typeof product.endsAt === 'string' ? parseInt(product.endsAt) : product.endsAt) : null,
    // For sold items, map currentPrice to winningPrice for display
    winningPrice: isSoldItem ? (product.currentPrice || product.winningPrice || 0) : (product.winningPrice || 0),
    // Keep currentPrice for active listings
    currentPrice: product.currentPrice || 0,
    // Ensure status is set for sold items
    status: product.status || (isSoldItem ? 'ended' : 'active'),
  });

  // Fetch all data on mount to calculate complete stats
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch active listings
        const activeRes = await sellerApi.getActiveListings(1, 99);
        const active = (activeRes.products || []).map(mapProduct);
        setActiveListings(active);
        
        // Fetch sold items from completed/delivered orders
        const ordersRes = await sellerApi.getOrders(1, 99, 'all');
        const completedOrders = (ordersRes.orders || []).filter(
          (order) => {
            const status = (order.status || '').toLowerCase();
            return status === 'completed' || status === 'delivered';
          }
        );
        
        // Map orders to products format for display
        const soldItems = completedOrders.map((order) => ({
          id: order.productId || order.id,
          productId: order.productId,
          title: order.productTitle || 'Product',
          image: order.productImage || '/placeholder-image.jpg',
          winningPrice: order.amount || 0,
          currentPrice: order.amount || 0,
          status: (order.status || 'completed').toLowerCase(),
          views: 0,
          bidCount: 0,
          endTime: order.createdAt ? (typeof order.createdAt === 'string' ? parseInt(order.createdAt) : order.createdAt) : null,
          buyerName: order.buyerName || 'Buyer',
          orderId: order.id,
          createdAt: order.createdAt,
        }));
        
        setWonItems(soldItems);
        
        // Calculate all stats
        const activeViews = active.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalRevenue = soldItems.reduce((sum, item) => sum + (item.winningPrice || 0), 0);
        
        setStats({
          activeListings: active.length,
          wonItems: soldItems.length,
          totalRevenue,
          totalViews: activeViews,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setActiveListings([]);
        setWonItems([]);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (tabValue === 0) {
        // Active Listings
        try {
          setLoading((prev) => ({ ...prev, active: true }));
          const response = await sellerApi.getActiveListings(1, 99);
          const active = (response.products || []).map(mapProduct);
          setActiveListings(active);
        } catch (err) {
          console.error('Error fetching active listings:', err);
          setActiveListings([]);
        } finally {
          setLoading((prev) => ({ ...prev, active: false }));
        }
      } else {
        // Sold Items (from completed orders)
        try {
          setLoading((prev) => ({ ...prev, won: true }));
          const ordersRes = await sellerApi.getOrders(1, 99, 'all');
          const completedOrders = (ordersRes.orders || []).filter(
            (order) => {
              const status = (order.status || '').toLowerCase();
              return status === 'completed' || status === 'delivered';
            }
          );
          
          // Map orders to products format for display
          const soldItems = completedOrders.map((order) => ({
            id: order.productId || order.id,
            productId: order.productId,
            title: order.productTitle || 'Product',
            image: order.productImage || '/placeholder-image.jpg',
            winningPrice: order.amount || 0,
            currentPrice: order.amount || 0,
            status: (order.status || 'completed').toLowerCase(),
            views: 0,
            bidCount: 0,
            endTime: order.createdAt ? (typeof order.createdAt === 'string' ? parseInt(order.createdAt) : order.createdAt) : null,
            buyerName: order.buyerName || 'Buyer',
            orderId: order.id,
            createdAt: order.createdAt,
          }));
          
          setWonItems(soldItems);
        } catch (err) {
          console.error('Error fetching sold items:', err);
          setWonItems([]);
        } finally {
          setLoading((prev) => ({ ...prev, won: false }));
        }
      }
    };
    fetchData();
  }, [tabValue]);

  // Recalculate stats whenever activeListings or wonItems change
  useEffect(() => {
    const activeViews = activeListings.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalRevenue = wonItems.reduce((sum, item) => sum + (item.winningPrice || 0), 0);
    
    setStats({
      activeListings: activeListings.length,
      wonItems: wonItems.length,
      totalRevenue,
      totalViews: activeViews,
    });
  }, [activeListings, wonItems]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchQuery(''); // Reset search when switching tabs
  };

  // Filter products based on search query
  const filteredActiveListings = activeListings.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWonItems = wonItems.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Page title="Seller Dashboard - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Seller Dashboard
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddBox />}
              onClick={() => navigate('/seller/create-auction')}
              sx={{ borderRadius: 2 }}
            >
              Create Auction
            </Button>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Manage your active listings and view items with winners
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Listings"
              value={stats.activeListings}
              icon={<Inventory />}
              color="primary"
              simple
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sold Items"
              value={stats.wonItems}
              icon={<EmojiEvents />}
              color="success"
              simple
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={formatPrice(stats.totalRevenue)}
              icon={<AttachMoney />}
              color="info"
              simple
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Views"
              value={stats.totalViews}
              icon={<Visibility />}
              color="warning"
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
              icon={<Inventory />}
              iconPosition="start"
              label={`Active Listings (${activeListings.length})`}
            />
            <Tab
              icon={<EmojiEvents />}
              iconPosition="start"
              label={`Sold Items (${wonItems.length})`}
            />
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder={`Search ${tabValue === 0 ? 'active listings' : 'sold items'}...`}
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

            {/* Active Listings Tab */}
            {tabValue === 0 && (
              <Box>
                {loading.active ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredActiveListings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Inventory sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {searchQuery ? 'No listings found' : 'No Active Listings'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Start selling by creating your first auction listing'}
                    </Typography>
                    {!searchQuery && (
                      <Button
                        variant="contained"
                        startIcon={<AddBox />}
                        onClick={() => navigate('/seller/create-auction')}
                      >
                        Create Auction
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredActiveListings.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard 
                          product={product} 
                          showStatus 
                          showViews 
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Sold Items Tab */}
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
                      {searchQuery ? 'No items found' : 'No Sold Items Yet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Items that have been sold will appear here'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredWonItems.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard 
                          product={{
                            ...product,
                            // For sold items, show currentPrice as final price
                            currentPrice: product.winningPrice || product.currentPrice,
                          }} 
                          showViews 
                          showStatus
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

export default SellerHomePage;
