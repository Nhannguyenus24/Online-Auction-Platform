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
} from '@mui/icons-material';
import Page from '../../components/Page';
import ProductCard from '../../components/ProductCard';
import { formatPrice } from '../../utils/formatNumber';
import { mockGetSellerProducts, mockGetSellerWonItems } from '../../mocks';

const SellerHomePage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [activeListings, setActiveListings] = useState([]);
  const [wonItems, setWonItems] = useState([]);
  const [loading, setLoading] = useState({ active: false, won: false });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (tabValue === 0) {
        // Active Listings
        try {
          setLoading((prev) => ({ ...prev, active: true }));
          const response = await mockGetSellerProducts(false, 500);
          // Filter only active listings
          const active = (response.data || []).filter((p) => p.status === 'active');
          setActiveListings(active);
        } catch (err) {
          console.error('Error fetching active listings:', err);
          setActiveListings([]);
        } finally {
          setLoading((prev) => ({ ...prev, active: false }));
        }
      } else {
        // Won Items
        try {
          setLoading((prev) => ({ ...prev, won: true }));
          const response = await mockGetSellerWonItems(false, 500);
          setWonItems(response.data || []);
        } catch (err) {
          console.error('Error fetching won items:', err);
          setWonItems([]);
        } finally {
          setLoading((prev) => ({ ...prev, won: false }));
        }
      }
    };
    fetchData();
  }, [tabValue]);

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
              label={`Won Items (${wonItems.length})`}
            />
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder={`Search ${tabValue === 0 ? 'active listings' : 'won items'}...`}
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
                        : 'Items with winners will appear here'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredWonItems.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <ProductCard 
                          product={product} 
                          showViews 
                          showWinner 
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
