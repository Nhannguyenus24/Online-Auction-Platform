import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  Gavel,
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Share,
  Person,
  QuestionAnswer,
  Send,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';

// Mock data - replace with API calls
const mockProduct = {
  id: 1,
  title: "Vintage Rolex Submariner Watch - Rare 1960s Edition",
  description: `
    <h3>Product Description</h3>
    <p>This is a stunning vintage Rolex Submariner from the 1960s era. The watch is in excellent condition with minimal signs of wear.</p>
    
    <h4>Features:</h4>
    <ul>
      <li>Authentic Rolex movement</li>
      <li>Original dial and hands</li>
      <li>Stainless steel case and bracelet</li>
      <li>Water-resistant to 200m</li>
      <li>Includes original box and papers</li>
    </ul>
    
    <h4>Condition:</h4>
    <p>The watch has been professionally serviced and is in excellent working condition. Minor scratches on the case and bracelet are consistent with age.</p>
    
    <h4>Shipping:</h4>
    <p>Fully insured shipping included. International shipping available.</p>
  `,
  mainImage: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800",
  additionalImages: [
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800",
    "https://images.unsplash.com/photo-1587836374062-d60b6c8b6a44?w=800",
    "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800",
    "https://images.unsplash.com/photo-1611987265762-37e0e6d3f7c6?w=800",
  ],
  currentPrice: 25000000,
  buyNowPrice: 35000000,
  startingPrice: 20000000,
  bidIncrement: 500000,
  seller: {
    id: 101,
    name: "John Smith",
    rating: 4.8,
    ratingCount: 245,
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  currentBidder: {
    name: "u***r123", // masked
    bidCount: 15,
  },
  postedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day left
  status: "ACTIVE",
  category: {
    id: 5,
    name: "Watches & Jewelry",
  },
  bidCount: 23,
  watchCount: 45,
};

const mockBidHistory = [
  { id: 1, bidder: "u***r123", amount: 25000000, time: new Date(Date.now() - 30 * 60 * 1000) },
  { id: 2, bidder: "b***r456", amount: 24500000, time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 3, bidder: "u***r123", amount: 24000000, time: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 4, bidder: "s***r789", amount: 23500000, time: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  { id: 5, bidder: "b***r456", amount: 23000000, time: new Date(Date.now() - 12 * 60 * 60 * 1000) },
];

const mockQuestions = [
  {
    id: 1,
    bidder: { name: "Alice", avatar: "https://i.pravatar.cc/150?img=1" },
    question: "Is this watch authentic? Do you have certificate of authenticity?",
    answer: "Yes, this is 100% authentic. I have the original certificate and papers from Rolex. Will be included with the watch.",
    askedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    answeredAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: 2,
    bidder: { name: "Bob", avatar: "https://i.pravatar.cc/150?img=2" },
    question: "What is the condition of the movement? Has it been serviced recently?",
    answer: "The movement is in excellent condition. It was serviced by a certified Rolex technician 6 months ago. All documentation included.",
    askedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    answeredAt: new Date(Date.now() - 35 * 60 * 60 * 1000),
  },
  {
    id: 3,
    bidder: { name: "Charlie", avatar: "https://i.pravatar.cc/150?img=3" },
    question: "Do you ship internationally?",
    answer: null,
    askedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    answeredAt: null,
  },
];

const mockRelatedProducts = [
  {
    id: 2,
    title: "Omega Speedmaster Professional Moonwatch",
    image: "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400",
    currentPrice: 18000000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    bidCount: 18,
  },
  {
    id: 3,
    title: "TAG Heuer Carrera Automatic Chronograph",
    image: "https://images.unsplash.com/photo-1606403726988-eb66a8c2d233?w=400",
    currentPrice: 12000000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    bidCount: 12,
  },
  {
    id: 4,
    title: "Breitling Navitimer Chronograph",
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400",
    currentPrice: 15000000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    bidCount: 9,
  },
  {
    id: 5,
    title: "Cartier Santos 100 XL Automatic",
    image: "https://images.unsplash.com/photo-1611987265762-37e0e6d3f7c6?w=400",
    currentPrice: 22000000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    bidCount: 25,
  },
  {
    id: 6,
    title: "IWC Portugieser Automatic",
    image: "https://images.unsplash.com/photo-1587836374062-d60b6c8b6a44?w=400",
    currentPrice: 20000000,
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    bidCount: 14,
  },
];

function ProductDetailPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [question, setQuestion] = useState('');
  const [openBidDialog, setOpenBidDialog] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Replace with actual auth state

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getTimeLeft = (endTime) => {
    const now = new Date();
    const diff = endTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days ${hours} hours`;
    if (hours > 0) return `${hours} hours ${minutes} minutes`;
    return `${minutes} minutes`;
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  };

  const handlePreviousImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? mockProduct.additionalImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => 
      prev === mockProduct.additionalImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePlaceBid = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setOpenBidDialog(true);
  };

  const handleConfirmBid = () => {
    // API call to place bid
    console.log('Placing bid:', bidAmount);
    setOpenBidDialog(false);
    setBidAmount('');
  };

  const handleAskQuestion = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    // API call to post question
    console.log('Posting question:', question);
    setQuestion('');
  };

  const handleToggleWatchlist = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setIsWatchlisted(!isWatchlisted);
  };

  const suggestedBids = [
    mockProduct.currentPrice + mockProduct.bidIncrement,
    mockProduct.currentPrice + mockProduct.bidIncrement * 2,
    mockProduct.currentPrice + mockProduct.bidIncrement * 3,
  ];

  return (
    <Page title="Product Detail">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Home / {mockProduct.category.name} / {mockProduct.title}
        </Typography>

        <Grid container spacing={3}>
          {/* Left: Images - 50% width */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <Box sx={{ position: 'relative', width: '100%', paddingTop: '75%', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  image={mockProduct.additionalImages[selectedImage]}
                  alt={mockProduct.title}
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    bgcolor: 'grey.100'
                  }}
                />
                
                {/* Image Navigation */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                  onClick={handleNextImage}
                >
                  <ChevronRight />
                </IconButton>

                {/* Status Badge */}
                <Chip
                  label={mockProduct.status}
                  color="success"
                  sx={{ position: 'absolute', top: 16, right: 16 }}
                />
              </Box>

              {/* Thumbnail Images */}
              <Box sx={{ display: 'flex', gap: 1.5, p: 2, overflowX: 'auto', justifyContent: 'center' }}>
                {mockProduct.additionalImages.map((img, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: 2,
                      borderColor: selectedImage === index ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      opacity: selectedImage === index ? 1 : 0.6,
                      transition: 'all 0.3s',
                      '&:hover': { 
                        opacity: 1,
                        transform: 'scale(1.05)',
                      },
                    }}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Right: Product Info - 50% width */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Title and Price Card */}
              <Card elevation={2} sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {mockProduct.title}
                </Typography>

                {/* Price Section */}
                <Box sx={{ my: 3, bgcolor: 'primary.lighter', p: 3, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Price
                  </Typography>
                  <Typography variant="h2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
                    {formatPrice(mockProduct.currentPrice)}
                  </Typography>
                  
                  {mockProduct.buyNowPrice && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                      <ShoppingCart fontSize="small" color="action" />
                      <Typography variant="body1" color="text.secondary">
                        Buy Now: <strong style={{ color: 'green' }}>{formatPrice(mockProduct.buyNowPrice)}</strong>
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box sx={{ flex: 1, textAlign: 'center', bgcolor: 'success.lighter', p: 2.5, borderRadius: 2 }}>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {mockProduct.bidCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Total Bids
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'center', bgcolor: 'warning.lighter', p: 2.5, borderRadius: 2 }}>
                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                      {mockProduct.watchCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Watchers
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Description Section */}
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Description
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{ __html: mockProduct.description }}
                    sx={{
                      maxHeight: 200,
                      overflowY: 'auto',
                      pr: 1,
                      '& h3': { fontSize: '1.1rem', mt: 1, mb: 0.5 },
                      '& h4': { fontSize: '1rem', mt: 1, mb: 0.5 },
                      '& ul': { pl: 2, fontSize: '0.875rem' },
                      '& p': { mb: 0.5, fontSize: '0.875rem' },
                      '& li': { mb: 0.25 },
                    }}
                  />
                </Box>
              </Card>

              {/* Time Card */}
              <Card elevation={2} sx={{ p: 3, bgcolor: 'error.lighter' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AccessTime color="error" fontSize="large" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Time Left
                    </Typography>
                    <Typography variant="h5" color="error" fontWeight="bold">
                      {getTimeLeft(mockProduct.endTime)}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Posted: {getRelativeTime(mockProduct.postedTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ends: {mockProduct.endTime.toLocaleString('vi-VN')}
                </Typography>
              </Card>

              {/* Seller & Bidder Info Card */}
              <Card elevation={2} sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
                      SELLER
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={mockProduct.seller.avatar} sx={{ width: 56, height: 56 }} />
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {mockProduct.seller.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            ★ {mockProduct.seller.rating}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({mockProduct.seller.ratingCount} ratings)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
                      CURRENT HIGHEST BIDDER
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {mockProduct.currentBidder.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {mockProduct.currentBidder.bidCount} bids placed
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
              </Card>

              {/* Action Buttons */}
              {isLoggedIn ? (
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Gavel />}
                    onClick={handlePlaceBid}
                    fullWidth
                    sx={{ py: 1.5, fontSize: '1.1rem' }}
                  >
                    Place Bid
                  </Button>

                  {mockProduct.buyNowPrice && (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<ShoppingCart />}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Buy Now - {formatPrice(mockProduct.buyNowPrice)}
                    </Button>
                  )}

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={isWatchlisted ? <Favorite /> : <FavoriteBorder />}
                      onClick={handleToggleWatchlist}
                      fullWidth
                      color={isWatchlisted ? 'error' : 'inherit'}
                    >
                      {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
                    </Button>
                    <IconButton 
                      variant="outlined" 
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Stack>
                </Stack>
              ) : (
                <Card elevation={2} sx={{ bgcolor: 'info.lighter' }}>
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Please login to place bids and interact with this auction
                    </Alert>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/login')}
                      sx={{ py: 1.5 }}
                    >
                      Login / Register to Bid
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Bid History and Q&A Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Left: Bid History - 50% */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <Box sx={{ p: 3, bgcolor: 'primary.lighter' }}>
                <Typography variant="h5" fontWeight="bold">
                  Bid History ({mockBidHistory.length})
                </Typography>
              </Box>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Bidder</strong></TableCell>
                        <TableCell align="right"><strong>Bid Amount</strong></TableCell>
                        <TableCell align="right"><strong>Time</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockBidHistory.map((bid, index) => (
                        <TableRow 
                          key={bid.id}
                          sx={{ 
                            bgcolor: index === 0 ? 'success.lighter' : 'inherit',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                                <Person fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {bid.bidder}
                                </Typography>
                                {index === 0 && (
                                  <Chip label="Highest Bid" size="small" color="success" />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color={index === 0 ? 'success.main' : 'inherit'}>
                              {formatPrice(bid.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {getRelativeTime(bid.time)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Q&A Section - 50% */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <Box sx={{ p: 3, bgcolor: 'secondary.lighter' }}>
                <Typography variant="h5" fontWeight="bold">
                  Q&A ({mockQuestions.length})
                </Typography>
              </Box>
              <CardContent>
                <Stack spacing={3}>
                  {/* Ask Question Form */}
                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Ask a Question
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Type your question here..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={handleAskQuestion}
                      disabled={!question.trim()}
                      fullWidth
                    >
                      Submit Question
                    </Button>
                  </Paper>

                  {/* Questions List */}
                  <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                    <Stack spacing={2}>
                      {mockQuestions.map((qa) => (
                        <Paper key={qa.id} elevation={1} sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Avatar src={qa.bidder.avatar} sx={{ width: 40, height: 40 }} />
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {qa.bidder.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {getRelativeTime(qa.askedAt)}
                                </Typography>
                              </Box>
                              
                              <Typography variant="body2" sx={{ mb: 1.5 }}>
                                <QuestionAnswer fontSize="small" color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {qa.question}
                              </Typography>

                              {qa.answer ? (
                                <Paper sx={{ bgcolor: 'success.lighter', p: 1.5 }}>
                                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Avatar src={mockProduct.seller.avatar} sx={{ width: 32, height: 32 }} />
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Box>
                                          <Typography variant="subtitle2" fontWeight="bold">
                                            {mockProduct.seller.name}
                                          </Typography>
                                          <Chip label="Seller" size="small" color="success" sx={{ height: 20 }} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                          {getRelativeTime(qa.answeredAt)}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2">
                                        {qa.answer}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              ) : (
                                <Alert severity="info" sx={{ py: 0.5 }}>
                                  <Typography variant="caption">
                                    Waiting for seller's answer...
                                  </Typography>
                                </Alert>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Related Products */}
        <Box sx={{ mt: 4 }}>
          <Card elevation={2}>
            <Box sx={{ p: 3, bgcolor: 'warning.lighter' }}>
              <Typography variant="h5" fontWeight="bold">
                Related Products
              </Typography>
            </Box>
            <CardContent>
              <Grid container spacing={2.5}>
                {mockRelatedProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={2.4} key={product.id}>
                    <Card
                      elevation={3}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': { 
                          boxShadow: 6,
                          transform: 'translateY(-4px)',
                        },
                        transition: 'all 0.3s',
                      }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="180"
                          image={product.image}
                          alt={product.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <Chip
                          label={`${product.bidCount} bids`}
                          size="small"
                          color="primary"
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            left: 8,
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography 
                          variant="body2" 
                          gutterBottom
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: 40,
                            fontWeight: 'medium'
                          }}
                        >
                          {product.title}
                        </Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mt: 'auto' }}>
                          {formatPrice(product.currentPrice)}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          mt: 1,
                          pt: 1,
                          borderTop: 1,
                          borderColor: 'divider'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime fontSize="small" color="error" />
                            <Typography variant="caption" color="error" fontWeight="medium">
                              {getTimeLeft(product.endTime)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Bid Dialog */}
        <Dialog open={openBidDialog} onClose={() => setOpenBidDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Place Your Bid</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Price: <strong>{formatPrice(mockProduct.currentPrice)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Minimum Bid: <strong>{formatPrice(mockProduct.currentPrice + mockProduct.bidIncrement)}</strong>
            </Typography>

            <TextField
              fullWidth
              label="Your Bid Amount"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
              helperText="Enter your bid amount in VND"
            />

            <Typography variant="body2" gutterBottom>
              Suggested Bids:
            </Typography>
            <Stack direction="row" spacing={1}>
              {suggestedBids.map((amount, index) => (
                <Chip
                  key={index}
                  label={formatPrice(amount)}
                  onClick={() => setBidAmount(amount.toString())}
                  clickable
                  variant="outlined"
                />
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBidDialog(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmBid}
              variant="contained"
              disabled={!bidAmount || parseFloat(bidAmount) < mockProduct.currentPrice + mockProduct.bidIncrement}
            >
              Confirm Bid
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
}

export default ProductDetailPage;
