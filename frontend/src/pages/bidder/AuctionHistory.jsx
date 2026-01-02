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
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  History,
  Visibility,
  CheckCircle,
  Cancel,
  AccessTime,
  EmojiEvents,
  Gavel,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import { fVNDate, normalizeTimestamp } from '../../utils/formatTime';
import { bidderApi } from '../../services/bidderApi';

const BidderAuctionHistoryPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Active, 2: Ended, 3: Won
  const [loading, setLoading] = useState(false);
  const [allBiddingHistory, setAllBiddingHistory] = useState([]); // All data from API
  const [wonItems, setWonItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    currentSize: 10,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data (fetch large limit to get all data for client-side filtering)
        const [biddingRes, wonRes] = await Promise.all([
          bidderApi.getBiddingHistory(1, 1000, 'all'), // Get all data
          bidderApi.getWonItems(1, 1000),
        ]);
        
        // Map API response to component format
        const mappedBids = (biddingRes.data || []).map((bid) => ({
          id: bid.bidId,
          productId: bid.productId,
          title: bid.productTitle,
          image: bid.productPrimaryImage,
          myBid: bid.bidAmount,
          currentPrice: bid.currentPrice,
          isHighestBidder: bid.isWinning,
          endTime: normalizeTimestamp(bid.productEndsAt), // Normalize timestamp from backend
          bidDate: normalizeTimestamp(bid.bidCreatedAt), // Normalize timestamp from backend
          bidCount: 0, // Not available in API response
          condition: null, // Not available in API response
          productStatus: bid.productStatus,
        }));
        
        // Map won items to simple format with productId
        const mappedWonItems = (wonRes.data || []).map((item) => ({
          productId: item.productId,
        }));
        
        setAllBiddingHistory(mappedBids);
        setWonItems(mappedWonItems);
      } catch (err) {
        console.error('Error fetching auction history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTimeLeft = (endTime) => {
    const end = normalizeTimestamp(endTime);
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
    // Use productStatus if available, otherwise check endTime
    const isEnded = bid.productStatus === 'ended' || endTime <= now;
    const isWon = wonItems.some((item) => item.productId === bid.productId);

    if (isWon) return { label: 'Won', color: 'success', icon: <EmojiEvents /> };
    if (isEnded) return { label: 'Ended', color: 'default', icon: <Cancel /> };
    if (bid.isHighestBidder) return { label: 'Leading', color: 'primary', icon: <CheckCircle /> };
    return { label: 'Active', color: 'info', icon: <AccessTime /> };
  };

  // Get filtered bids based on tab
  const getFilteredBids = () => {
    const now = new Date();
    const wonProductIds = new Set(wonItems.map((item) => item.productId));

    switch (tabValue) {
      case 1: // Active
        return allBiddingHistory.filter((bid) => {
          const endTime = normalizeTimestamp(bid.endTime);
          const isEnded = bid.productStatus === 'ended' || endTime <= now;
          return !isEnded && !wonProductIds.has(bid.productId);
        });
      case 2: // Ended
        return allBiddingHistory.filter((bid) => {
          const endTime = normalizeTimestamp(bid.endTime);
          const isEnded = bid.productStatus === 'ended' || endTime <= now;
          return isEnded && !wonProductIds.has(bid.productId);
        });
      case 3: // Won
        return allBiddingHistory.filter((bid) => wonProductIds.has(bid.productId));
      default: // All
        return allBiddingHistory;
    }
  };

  const allFilteredBids = getFilteredBids();

  // Update pagination when filtered data or page size changes
  useEffect(() => {
    const totalItems = allFilteredBids.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    // Ensure current page is valid (not greater than total pages)
    const currentPage = Math.min(pagination.currentPage, totalPages) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = allFilteredBids.slice(startIndex, endIndex);

    setPagination({
      currentPage: currentPage,
      currentSize: paginatedData.length,
      totalPages: totalPages,
      totalItems: totalItems,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    });
  }, [allBiddingHistory.length, wonItems.length, tabValue, pageSize]);

  // Get paginated bids
  const filteredBids = (() => {
    const startIndex = (pagination.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allFilteredBids.slice(startIndex, endIndex);
  })();

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page when tab changes
  };

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
              onChange={handleTabChange}
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
                    <Gavel /> All ({allBiddingHistory.length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime /> Active ({allBiddingHistory.filter((bid) => {
                      const endTime = normalizeTimestamp(bid.endTime);
                      const now = new Date();
                      const isEnded = bid.productStatus === 'ended' || endTime <= now;
                      const wonProductIds = new Set(wonItems.map((item) => item.productId));
                      return !isEnded && !wonProductIds.has(bid.productId);
                    }).length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cancel /> Ended ({allBiddingHistory.filter((bid) => {
                      const endTime = normalizeTimestamp(bid.endTime);
                      const now = new Date();
                      const isEnded = bid.productStatus === 'ended' || endTime <= now;
                      const wonProductIds = new Set(wonItems.map((item) => item.productId));
                      return isEnded && !wonProductIds.has(bid.productId);
                    }).length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEvents /> Won ({allBiddingHistory.filter((bid) => wonItems.some((item) => item.productId === bid.productId)).length})
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
                      const endTime = normalizeTimestamp(bid.endTime);
                      const now = new Date();
                      const isEnded = bid.productStatus === 'ended' || endTime <= now;

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
                                  {bid.bidCount !== undefined && bid.bidCount !== null && (
                                    <Chip
                                      icon={<Gavel sx={{ fontSize: 12 }} />}
                                      label={`${bid.bidCount} bids`}
                                      size="small"
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
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

            {/* Pagination */}
            {!loading && filteredBids.length > 0 && (
              <Box
                sx={{
                  p: 3,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {pagination.currentSize} of {pagination.totalItems} items
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Page Size</InputLabel>
                    <Select
                      value={pageSize}
                      label="Page Size"
                      onChange={handlePageSizeChange}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Typography>
                  <Pagination
                    count={pagination.totalPages}
                    page={pagination.currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderAuctionHistoryPage;
