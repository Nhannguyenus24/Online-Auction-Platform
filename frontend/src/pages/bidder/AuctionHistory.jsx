import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Button,
} from '@mui/material';
import {
  History,
  Visibility,
  CheckCircle,
  Cancel,
  AccessTime,
  EmojiEvents,
  Gavel,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate } from '../../utils/formatTime';
import { mockGetBiddingHistory, mockGetWonItems } from '../../mocks';

const BidderAuctionHistoryPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Active, 2: Ended, 3: Won
  const [loading, setLoading] = useState(false);
  const [biddingHistory, setBiddingHistory] = useState([]);
  const [wonItems, setWonItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [biddingRes, wonRes] = await Promise.all([
          mockGetBiddingHistory(500),
          mockGetWonItems(500),
        ]);
        setBiddingHistory(biddingRes.data || []);
        setWonItems(wonRes.data || []);
      } catch (err) {
        console.error('Error fetching auction history:', err);
      } finally {
        setLoading(false);
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

    const pad = (num) => String(num).padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
    if (hours > 0) return `${pad(hours)}h ${pad(minutes)}m`;
    return `${pad(minutes)}m`;
  };

  const getStatus = (bid) => {
    const endTime = new Date(bid.endTime);
    const now = new Date();
    const isEnded = endTime <= now;
    const isWon = wonItems.some((item) => item.productId === bid.productId);

    if (isWon) return { label: 'Won', color: 'success', icon: <EmojiEvents /> };
    if (isEnded) return { label: 'Ended', color: 'default', icon: <Cancel /> };
    if (bid.isHighestBidder) return { label: 'Leading', color: 'primary', icon: <CheckCircle /> };
    return { label: 'Active', color: 'info', icon: <AccessTime /> };
  };

  const getFilteredBids = () => {
    const now = new Date();
    const wonProductIds = new Set(wonItems.map((item) => item.productId));

    switch (tabValue) {
      case 1: // Active
        return biddingHistory.filter((bid) => {
          const endTime = new Date(bid.endTime);
          return endTime > now && !wonProductIds.has(bid.productId);
        });
      case 2: // Ended
        return biddingHistory.filter((bid) => {
          const endTime = new Date(bid.endTime);
          return endTime <= now && !wonProductIds.has(bid.productId);
        });
      case 3: // Won
        return biddingHistory.filter((bid) => wonProductIds.has(bid.productId));
      default: // All
        return biddingHistory;
    }
  };

  const filteredBids = getFilteredBids();

  return (
    <Page title="Auction History - Bidder Dashboard">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Auction History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your complete bidding history and track your auction activity
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History /> Bidding History
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Gavel /> All ({biddingHistory.length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime /> Active ({biddingHistory.filter((bid) => new Date(bid.endTime) > new Date() && !wonItems.some((item) => item.productId === bid.productId)).length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cancel /> Ended ({biddingHistory.filter((bid) => new Date(bid.endTime) <= new Date() && !wonItems.some((item) => item.productId === bid.productId)).length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEvents /> Won ({biddingHistory.filter((bid) => wonItems.some((item) => item.productId === bid.productId)).length})
                  </Box>
                }
              />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredBids.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <History sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Bidding History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {tabValue === 1
                    ? 'You have no active bids at the moment.'
                    : tabValue === 2
                    ? 'You have no ended bids.'
                    : tabValue === 3
                    ? 'You have not won any auctions yet.'
                    : 'Start bidding on products to see your history here.'}
                </Typography>
                <Button variant="contained" onClick={() => navigate('/')}>
                  Browse Products
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Your Bid
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Current Price
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Status
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Bid Date
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Time Left
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBids.map((bid) => {
                      const status = getStatus(bid);
                      const endTime = new Date(bid.endTime);
                      const now = new Date();
                      const isEnded = endTime <= now;

                      return (
                        <TableRow
                          key={bid.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            bgcolor: bid.isHighestBidder && !isEnded ? 'rgba(76, 175, 80, 0.04)' : 'inherit',
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                component="img"
                                src={bid.image}
                                alt={bid.title}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'cover',
                                  borderRadius: 1.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                  {bid.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {bid.condition && (
                                    <Chip
                                      label={bid.condition}
                                      size="small"
                                      color={bid.condition === 'New' ? 'success' : 'default'}
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                  <Chip
                                    icon={<Gavel sx={{ fontSize: 12 }} />}
                                    label={`${bid.bidCount} bids`}
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {formatPrice(bid.myBid)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={bid.isHighestBidder && !isEnded ? 'success.main' : 'text.primary'}
                            >
                              {formatPrice(bid.currentPrice)}
                            </Typography>
                            {bid.isHighestBidder && !isEnded && (
                              <Chip
                                label="Leading"
                                size="small"
                                color="success"
                                sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              size="small"
                              color={status.color}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" color="text.secondary">
                              {fVNDate(bid.bidDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {isEnded ? (
                              <Typography variant="caption" color="text.secondary">
                                Ended
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                <AccessTime sx={{ fontSize: 14, color: 'error.main' }} />
                                <Typography variant="caption" color="error.main" fontWeight="bold">
                                  {getTimeLeft(bid.endTime)}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/product/${bid.productId}`)}
                              title="View Product"
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderAuctionHistoryPage;
