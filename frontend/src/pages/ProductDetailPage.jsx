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
  CircularProgress,
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
import { useAuth } from '../hooks/useAuth';
import RichTextEditor from '../components/RichTextEditor';
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
  const [answerTexts, setAnswerTexts] = useState({}); // Store answers for each question
  const [submittingAnswer, setSubmittingAnswer] = useState({}); // Track which answer is being submitted
  const [questions, setQuestions] = useState(mockQuestions); // Use state to manage questions
  const [productDescription, setProductDescription] = useState(mockProduct.description); // Use state to manage description
  const [newDescription, setNewDescription] = useState(''); // New description to append
  const [submittingDescription, setSubmittingDescription] = useState(false); // Track description submission

  const { user } = useAuth();
  // Check if current user is the seller/owner of this product
  // Mock: Assume user.id === 101 is the seller for this product
  const isSeller = user && user.roleName?.toLowerCase() === 'seller' && user.id === mockProduct.seller.id;

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

  const handleAnswerChange = (questionId, value) => {
    setAnswerTexts((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitAnswer = async (questionId) => {
    const answer = answerTexts[questionId]?.trim();
    if (!answer) return;

    setSubmittingAnswer((prev) => ({ ...prev, [questionId]: true }));

    try {
      // Mock API call - replace with actual API
      // await axiosInstance.post(`/products/${mockProduct.id}/questions/${questionId}/answer`, { answer });
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Update the question with answer in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer, answeredAt: new Date() }
            : q
        )
      );

      // Clear answer text
      setAnswerTexts((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingAnswer((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const handleNewDescriptionChange = (event) => {
    // RichTextEditor passes event object with target.value
    setNewDescription(event.target.value || '');
  };

  const handleSubmitNewDescription = async () => {
    const descriptionText = newDescription.replace(/<[^>]*>/g, '').trim(); // Strip HTML to check if empty
    if (!descriptionText) return;

    setSubmittingDescription(true);

    try {
      // Mock API call - replace with actual API
      // await axiosInstance.post(`/products/${mockProduct.id}/description/append`, { description: newDescription });
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Append new description to existing description
      const updatedDescription = productDescription + '\n<hr style="margin: 20px 0; border: none; border-top: 2px solid #e0e0e0;" />\n' + newDescription;
      setProductDescription(updatedDescription);
      
      // Clear new description
      setNewDescription('');
    } catch (err) {
      console.error('Error submitting new description:', err);
    } finally {
      setSubmittingDescription(false);
    }
  };

  const suggestedBids = [
    mockProduct.currentPrice + mockProduct.bidIncrement,
    mockProduct.currentPrice + mockProduct.bidIncrement * 2,
    mockProduct.currentPrice + mockProduct.bidIncrement * 3,
  ];

  return (
    <Page title="Product Detail">
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Breadcrumb */}
          <Box sx={{ 
            bgcolor: 'white', 
            px: 3, 
            py: 1.5, 
            borderRadius: 2, 
            mb: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ cursor: 'pointer', color: '#1976d2' }}>Home</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#1976d2' }}>{mockProduct.category.name}</span>
              <span>/</span>
              <span>{mockProduct.title.substring(0, 50)}...</span>
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Left: Images - 55% width */}
            <Grid item xs={12} md={7}>
              <Card elevation={0} sx={{ 
                borderRadius: 3, 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ 
                  position: 'relative', 
                  width: '100%', 
                  paddingTop: '75%', 
                  overflow: 'hidden',
                  bgcolor: '#fafafa'
                }}>
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
                      p: 3
                    }}
                  />
                  
                  {/* Image Navigation */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'white',
                      boxShadow: 2,
                      '&:hover': { 
                        bgcolor: 'white',
                        transform: 'translateY(-50%) scale(1.1)',
                      },
                      transition: 'all 0.2s'
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
                      bgcolor: 'white',
                      boxShadow: 2,
                      '&:hover': { 
                        bgcolor: 'white',
                        transform: 'translateY(-50%) scale(1.1)',
                      },
                      transition: 'all 0.2s'
                    }}
                    onClick={handleNextImage}
                  >
                    <ChevronRight />
                  </IconButton>

                  {/* Status Badge */}
                  <Chip
                    label={mockProduct.status}
                    color="success"
                    sx={{ 
                      position: 'absolute', 
                      top: 20, 
                      right: 20,
                      fontWeight: 'bold',
                      boxShadow: 2
                    }}
                  />

                  {/* Image Counter */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '0.875rem'
                  }}>
                    {selectedImage + 1} / {mockProduct.additionalImages.length}
                  </Box>
                </Box>

                {/* Thumbnail Images */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  p: 2, 
                  overflowX: 'auto',
                  bgcolor: 'white',
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'grey.300',
                    borderRadius: 2,
                  }
                }}>
                  {mockProduct.additionalImages.map((img, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      sx={{
                        width: 80,
                        height: 80,
                        minWidth: 80,
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: 2,
                        borderColor: selectedImage === index ? 'primary.main' : 'transparent',
                        borderRadius: 2,
                        opacity: selectedImage === index ? 1 : 0.5,
                        transition: 'all 0.3s',
                        '&:hover': { 
                          opacity: 1,
                          borderColor: 'primary.light',
                        },
                      }}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </Box>
              </Card>

              {/* Description Section - Moved below image */}
              <Card elevation={0} sx={{ 
                mt: 2, 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Product Description
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box
                    dangerouslySetInnerHTML={{ __html: productDescription }}
                    sx={{
                      '& h3': { fontSize: '1.1rem', fontWeight: 'bold', mt: 2, mb: 1, color: 'text.primary' },
                      '& h4': { fontSize: '1rem', fontWeight: '600', mt: 1.5, mb: 1, color: 'text.secondary' },
                      '& ul': { pl: 3, my: 1 },
                      '& p': { mb: 1, lineHeight: 1.7, color: 'text.secondary' },
                      '& li': { mb: 0.5, lineHeight: 1.6 },
                      '& hr': { my: 2 },
                    }}
                  />
                </Box>
              </Card>

              {/* Add Description Section - Only for Seller */}
              {isSeller && (
                <Card elevation={0} sx={{ 
                  mt: 2, 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                }}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        Add More Description
                      </Typography>
                      <Chip label="Seller Only" size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                    </Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        You can add additional information to the product description. The new content will be appended to the existing description and cannot be edited or deleted later.
                      </Typography>
                    </Alert>
                    <RichTextEditor
                      value={newDescription}
                      onChange={handleNewDescriptionChange}
                      placeholder="Add more details about your product..."
                      minHeight={200}
                    />
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setNewDescription('')}
                        disabled={submittingDescription || !newDescription.trim()}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSubmitNewDescription}
                        disabled={!newDescription.replace(/<[^>]*>/g, '').trim() || submittingDescription}
                        startIcon={submittingDescription ? <CircularProgress size={16} color="inherit" /> : <Send />}
                      >
                        {submittingDescription ? 'Submitting...' : 'Add Description'}
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              )}
            </Grid>

            {/* Right: Product Info - 45% width */}
            <Grid item xs={12} md={5}>
              <Stack spacing={2}>
                {/* Title Card */}
                <Card elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>
                    {mockProduct.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={mockProduct.category.name} 
                      size="small" 
                      sx={{ fontWeight: 'medium' }}
                    />
                    <Chip 
                      icon={<Gavel fontSize="small" />}
                      label={`${mockProduct.bidCount} bids`} 
                      size="small" 
                      color="primary"
                      sx={{ fontWeight: 'medium' }}
                    />
                    <Chip 
                      icon={<Favorite fontSize="small" />}
                      label={`${mockProduct.watchCount} watching`} 
                      size="small" 
                      color="secondary"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>
                </Card>

                {/* Price & Time Card - Gradient Background */}
                <Card elevation={0} sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }} />
                  <CardContent sx={{ p: 3, position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                          Current Bid
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {formatPrice(mockProduct.currentPrice)}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        px: 2, 
                        py: 1, 
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                          Starting Price
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatPrice(mockProduct.startingPrice)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />

                    {mockProduct.buyNowPrice && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                        backdropFilter: 'blur(10px)'
                      }}>
                        <ShoppingCart sx={{ fontSize: 28 }} />
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                            Buy It Now Price
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {formatPrice(mockProduct.buyNowPrice)}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      p: 2,
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <AccessTime sx={{ fontSize: 28 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                          Time Remaining
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {getTimeLeft(mockProduct.endTime)}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.8 }}>
                      Ends: {mockProduct.endTime.toLocaleString('vi-VN', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Seller & Current Bidder Card */}
                <Card elevation={0} sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                          SELLER
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                          <Avatar 
                            src={mockProduct.seller.avatar} 
                            sx={{ 
                              width: 56, 
                              height: 56,
                              border: '3px solid',
                              borderColor: 'primary.light'
                            }} 
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight="bold">
                              {mockProduct.seller.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {[1,2,3,4,5].map((star) => (
                                  <Typography key={star} sx={{ color: star <= Math.floor(mockProduct.seller.rating) ? '#FFA500' : '#ddd', fontSize: '1rem' }}>
                                    ★
                                  </Typography>
                                ))}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                ({mockProduct.seller.ratingCount})
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                          LEADING BIDDER
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                          <Avatar sx={{ 
                            width: 56, 
                            height: 56, 
                            bgcolor: 'success.main',
                            fontWeight: 'bold',
                            fontSize: '1.5rem'
                          }}>
                            🏆
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
                  </CardContent>
                </Card>                {/* Action Buttons */}
                {isLoggedIn ? (
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Gavel />}
                      onClick={handlePlaceBid}
                      fullWidth
                      sx={{ 
                        py: 2, 
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        borderRadius: 2.5,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s'
                      }}
                    >
                      Place Bid
                    </Button>

                    {mockProduct.buyNowPrice && (
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<ShoppingCart />}
                        fullWidth
                        sx={{ 
                          py: 2,
                          borderRadius: 2.5,
                          borderWidth: 2,
                          fontWeight: 'bold',
                          '&:hover': {
                            borderWidth: 2,
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s'
                        }}
                      >
                        Buy Now
                      </Button>
                    )}

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant={isWatchlisted ? 'contained' : 'outlined'}
                        startIcon={isWatchlisted ? <Favorite /> : <FavoriteBorder />}
                        onClick={handleToggleWatchlist}
                        fullWidth
                        color={isWatchlisted ? 'error' : 'inherit'}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 'medium',
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                          }
                        }}
                      >
                        {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
                      </Button>
                      <IconButton 
                        sx={{ 
                          border: 2, 
                          borderColor: 'divider',
                          borderRadius: 2,
                          '&:hover': { 
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderColor: 'primary.main'
                          },
                          transition: 'all 0.3s'
                        }}
                      >
                        <Share />
                      </IconButton>
                    </Stack>
                  </Stack>
                ) : (
                  <Card elevation={0} sx={{ 
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      p: 2, 
                      textAlign: 'center' 
                    }}>
                      <Typography variant="h6" fontWeight="bold">
                        Sign in to Start Bidding
                      </Typography>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                        Join thousands of buyers and sellers on our platform
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={() => navigate('/login')}
                        sx={{ 
                          py: 2,
                          borderRadius: 2,
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}
                      >
                        Login / Register
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>
          </Grid>

          {/* Bid History and Q&A Section */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Left: Bid History */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white'
                }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Gavel />
                    Bid History ({mockBidHistory.length})
                  </Typography>
                </Box>
                <CardContent sx={{ p: 0 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Bidder</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Bid Amount</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockBidHistory.map((bid, index) => (
                          <TableRow 
                            key={bid.id}
                            sx={{ 
                              bgcolor: index === 0 ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                              '&:hover': { bgcolor: 'action.hover' },
                              borderLeft: index === 0 ? '4px solid' : 'none',
                              borderColor: 'success.main'
                            }}
                          >
                            <TableCell sx={{ py: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  bgcolor: index === 0 ? 'success.main' : 'primary.main',
                                  fontWeight: 'bold'
                                }}>
                                  {index === 0 ? '🏆' : <Person fontSize="small" />}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {bid.bidder}
                                  </Typography>
                                  {index === 0 && (
                                    <Typography variant="caption" color="success.main" fontWeight="bold">
                                      Leading Bid
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                fontWeight="bold" 
                                color={index === 0 ? 'success.main' : 'inherit'}
                                variant={index === 0 ? 'h6' : 'body2'}
                              >
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

            {/* Right: Q&A Section */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QuestionAnswer />
                    Questions & Answers ({mockQuestions.length})
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    {/* Ask Question Form */}
                    <Paper elevation={0} sx={{ 
                      p: 3, 
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      border: '2px dashed',
                      borderColor: 'grey.300'
                    }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Have a question?
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ask the seller about this item..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            borderRadius: 2
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleAskQuestion}
                        disabled={!question.trim()}
                        fullWidth
                        sx={{ 
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 'bold'
                        }}
                      >
                        Submit Question
                      </Button>
                    </Paper>

                    {/* Questions List */}
                    <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                      <Stack spacing={2}>
                        {questions.map((qa) => (
                          <Paper key={qa.id} elevation={0} sx={{ 
                            p: 2.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            },
                            transition: 'all 0.3s'
                          }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
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
                                
                                <Box sx={{ 
                                  bgcolor: 'grey.50', 
                                  p: 1.5, 
                                  borderRadius: 2,
                                  borderLeft: '3px solid',
                                  borderColor: 'primary.main',
                                  mb: 1.5
                                }}>
                                  <Typography variant="body2">
                                    {qa.question}
                                  </Typography>
                                </Box>

                                {qa.answer ? (
                                  <Box sx={{ 
                                    bgcolor: 'success.lighter', 
                                    p: 2, 
                                    borderRadius: 2,
                                    borderLeft: '3px solid',
                                    borderColor: 'success.main'
                                  }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                                      <Avatar src={mockProduct.seller.avatar} sx={{ width: 32, height: 32 }} />
                                      <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                              {mockProduct.seller.name}
                                            </Typography>
                                            <Chip label="Seller" size="small" color="success" sx={{ height: 20, fontWeight: 'bold' }} />
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
                                  </Box>
                                ) : (
                                  <Box>
                                    {isSeller ? (
                                      <Box sx={{ mt: 1 }}>
                                        <TextField
                                          fullWidth
                                          multiline
                                          rows={3}
                                          placeholder="Type your answer here..."
                                          value={answerTexts[qa.id] || ''}
                                          onChange={(e) => handleAnswerChange(qa.id, e.target.value)}
                                          sx={{ mb: 1 }}
                                        />
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleAnswerChange(qa.id, '')}
                                            disabled={submittingAnswer[qa.id]}
                                          >
                                            Clear
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<Send />}
                                            onClick={() => handleSubmitAnswer(qa.id)}
                                            disabled={!answerTexts[qa.id]?.trim() || submittingAnswer[qa.id]}
                                          >
                                            {submittingAnswer[qa.id] ? 'Submitting...' : 'Submit Answer'}
                                          </Button>
                                        </Stack>
                                      </Box>
                                    ) : (
                                      <Alert severity="info" sx={{ py: 0.5 }}>
                                        <Typography variant="caption">
                                          Waiting for seller's response...
                                        </Typography>
                                      </Alert>
                                    )}
                                  </Box>
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
          <Box sx={{ mt: 3 }}>
            <Card elevation={0} sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
                color: 'white'
              }}>
                <Typography variant="h5" fontWeight="bold">
                  You May Also Like
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                  Similar items from the same category
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  {mockRelatedProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={product.id}>
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
                          '&:hover': { 
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            transform: 'translateY(-4px)',
                            borderColor: 'primary.main',
                          },
                          transition: 'all 0.3s',
                        }}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <Box sx={{ position: 'relative', paddingTop: '100%', bgcolor: 'grey.50' }}>
                          <CardMedia
                            component="img"
                            image={product.image}
                            alt={product.title}
                            sx={{ 
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            boxShadow: 1
                          }}>
                            <Typography variant="caption" fontWeight="bold" color="primary">
                              {product.bidCount} bids
                            </Typography>
                          </Box>
                        </Box>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
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
                              fontWeight: '500',
                              lineHeight: 1.4,
                              mb: 1.5
                            }}
                          >
                            {product.title}
                          </Typography>
                          <Box sx={{ mt: 'auto' }}>
                            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
                              {formatPrice(product.currentPrice)}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              pt: 1,
                              borderTop: 1,
                              borderColor: 'divider'
                            }}>
                              <AccessTime sx={{ fontSize: 16, color: 'error.main' }} />
                              <Typography variant="caption" color="error.main" fontWeight="bold">
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
          <Dialog 
            open={openBidDialog} 
            onClose={() => setOpenBidDialog(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}>
              Place Your Bid
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
              <Box sx={{ 
                bgcolor: 'grey.50', 
                p: 2.5, 
                borderRadius: 2,
                mb: 3,
                border: '2px solid',
                borderColor: 'primary.light'
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Highest Bid
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
                  {formatPrice(mockProduct.currentPrice)}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Minimum Next Bid: <strong>{formatPrice(mockProduct.currentPrice + mockProduct.bidIncrement)}</strong>
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Your Bid Amount (VND)"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& input': {
                      fontSize: '1.25rem',
                      fontWeight: 'bold'
                    }
                  }
                }}
                helperText="Enter your bid amount"
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                  Quick Bid Options:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {suggestedBids.map((amount, index) => (
                    <Chip
                      key={index}
                      label={formatPrice(amount)}
                      onClick={() => setBidAmount(amount.toString())}
                      clickable
                      color="primary"
                      variant={bidAmount === amount.toString() ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        py: 2.5,
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button 
                onClick={() => setOpenBidDialog(false)}
                sx={{ 
                  px: 3,
                  py: 1,
                  borderRadius: 2
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBid}
                variant="contained"
                disabled={!bidAmount || parseFloat(bidAmount) < mockProduct.currentPrice + mockProduct.bidIncrement}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  boxShadow: 3
                }}
              >
                Confirm Bid
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Page>
  );
}

export default ProductDetailPage;
