import { useState, useRef } from 'react';
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
  Breadcrumbs,
  Link,
  Rating,
  Tooltip,
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
  Cancel,
  Block,
  NavigateNext,
  Home,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id: _productId } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [question, setQuestion] = useState('');
  const [openBidDialog, setOpenBidDialog] = useState(false);
  const [isLoggedIn] = useState(false); // Replace with actual auth state
  const [answerTexts, setAnswerTexts] = useState({}); // Store answers for each question
  const [submittingAnswer, setSubmittingAnswer] = useState({}); // Track which answer is being submitted
  const [questions, setQuestions] = useState(mockQuestions); // Use state to manage questions
  const [productDescription, setProductDescription] = useState(mockProduct.description); // Use state to manage description
  const [newDescription, setNewDescription] = useState(''); // New description to append
  const [submittingDescription, setSubmittingDescription] = useState(false); // Track description submission
  const [bidHistory] = useState(mockBidHistory); // Use state to manage bid history
  const [rejectedBids, setRejectedBids] = useState(new Set()); // Track rejected bid IDs
  const [openRejectDialog, setOpenRejectDialog] = useState(false); // Dialog state
  const [bidToReject, setBidToReject] = useState(null); // Bid to reject
  const [rejectingBid, setRejectingBid] = useState(null); // Track which bid is being rejected
  const [activeTab, setActiveTab] = useState(0);
  const [loading] = useState({
    bidHistory: false,
    questions: false,
    relatedProducts: false,
  });
  const [error] = useState({
    bidHistory: null,
    questions: null,
    relatedProducts: null,
  });
  const [relatedProducts] = useState(mockRelatedProducts);
  const relatedProductsRef = useRef(null);

  // Use mockProduct as product for now
  const product = mockProduct;
  const allImages = [product.mainImage, ...product.additionalImages];

  const { user } = useAuth();
  // Check if current user is the seller/owner of this product
  // Mock: Assume user.id === 101 is the seller for this product
  let isSeller = user && user.roleName?.toLowerCase() === 'seller' && user.id === product.seller.id;
  isSeller = true;
  // Check if auction has started (has bids)
  const hasStartedBidding = product.bidCount > 0 || bidHistory.length > 0;
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
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      navigate('/auth/login');
      return;
    }
    // API call to buy now
    console.log('Buying now:', product.buyNowPrice);
  };

  const handleScrollRelatedProducts = (direction) => {
    if (relatedProductsRef) {
      const scrollAmount = 400;
      relatedProductsRef.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handlePlaceBid = () => {
    if (!isLoggedIn) {
      navigate('/auth/login');
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
      navigate('/auth/login');
      return;
    }
    // API call to post question
    console.log('Posting question:', question);
    setQuestion('');
  };

  const handleToggleWatchlist = () => {
    if (!isLoggedIn) {
      navigate('/auth/login');
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

  const handleOpenRejectDialog = (bid) => {
    setBidToReject(bid);
    setOpenRejectDialog(true);
  };

  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
    setBidToReject(null);
  };

  const handleConfirmReject = async () => {
    if (!bidToReject) return;

    setRejectingBid(bidToReject.id);
    try {
      // Mock API call - replace with actual API
      // await axiosInstance.post(`/products/${mockProduct.id}/bids/${bidToReject.id}/reject`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Mark bid as rejected
      setRejectedBids((prev) => new Set([...prev, bidToReject.id]));
      
      // Remove rejected bid from history (or keep it with rejected status)
      // Option 1: Remove from list
      // setBidHistory((prev) => prev.filter((bid) => bid.id !== bidToReject.id));
      
      // Option 2: Keep in list but mark as rejected (better UX)
      // Already handled by rejectedBids Set
      
      handleCloseRejectDialog();
    } catch (err) {
      console.error('Error rejecting bid:', err);
    } finally {
      setRejectingBid(null);
    }
  };

  const suggestedBids = [
    product.currentPrice + product.bidIncrement,
    product.currentPrice + product.bidIncrement * 2,
    product.currentPrice + product.bidIncrement * 3,
  ];

  return (
    <Page title={`${product.title} - Product Detail`}>
      <Box sx={{ bgcolor: "grey.50", minHeight: "100vh" }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Breadcrumb */}
          <Card
            elevation={0}
            sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            <CardContent sx={{ py: 2 }}>
              <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate("/")}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "text.secondary",
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  <Home fontSize="small" />
                  Home
                </Link>
                {product.category && (
                  <Link
                    component="button"
                    variant="body1"
                    onClick={() => navigate(`/category/${product.category.id}`)}
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {product.category.name}
                  </Link>
                )}
                <Typography variant="body1" color="text.primary" fontWeight={600}>
                  {product.title}
                </Typography>
              </Breadcrumbs>
            </CardContent>
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            {/* Left Column - Images */}
            <Card
              elevation={0}
              sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
            >
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  image={allImages[selectedImage] || "/placeholder-image.jpg"}
                  alt={product.title}
                    sx={{
                      width: "100%",
                      height: { xs: 300, md: 500 },
                      objectFit: "contain",
                      bgcolor: "grey.100",
                    }}
                  />
                {allImages.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePreviousImage}
                      sx={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "rgba(255,255,255,0.9)",
                        "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      onClick={handleNextImage}
                      sx={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "rgba(255,255,255,0.9)",
                        "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                  </>
                )}
              </Box>
              {/* Thumbnail Images */}
              {allImages.length > 1 && (
                <Box sx={{ p: 2, display: "flex", gap: 1, overflowX: "auto" }}>
                  {allImages.map((img, idx) => (
                    <Card
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      sx={{
                        minWidth: 80,
                        height: 80,
                        cursor: "pointer",
                        border: selectedImage === idx ? 2 : 1,
                        borderColor: selectedImage === idx ? "primary.main" : "grey.300",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={img}
                        alt={`Thumbnail ${idx + 1}`}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Card>
                  ))}
                </Box>
              )}
            </Card>

            {/* Right Column - Product Info */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {/* Title and Status */}
                <Card
                  elevation={0}
                  sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                          {product.title}
                        </Typography>
                        <Chip
                          label={product.status}
                          color={product.status === "ACTIVE" ? "success" : "default"}
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      </Box>
                      <IconButton
                        onClick={handleToggleWatchlist}
                        color={isWatchlisted ? "error" : "default"}
                      >
                        {isWatchlisted ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                    </Stack>

                    {/* Price Section */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Current Bid
                      </Typography>
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color="primary.main"
                        gutterBottom
                      >
                        {formatPrice(product.currentPrice)}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Starting: {formatPrice(product.startingPrice)}
                        </Typography>
                        {product.buyNowPrice && (
                          <Typography variant="body2" color="text.secondary">
                            Buy Now: {formatPrice(product.buyNowPrice)}
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* Time Left */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime fontSize="small" />
                        <Typography variant="body1" fontWeight="medium">
                          Time Left: {getTimeLeft(product.endTime)}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Bid Info */}
                    <Stack direction="row" spacing={3} mb={3}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Bids
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {product.bidCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Watchers
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {product.watchCount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Bid Increment
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {formatPrice(product.bidIncrement)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Current Bidder (if has bids) */}
                    {hasStartedBidding && product.currentBidder && (
                      <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current Highest Bidder
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {product.currentBidder.name}
                          {product.currentBidder.bidCount > 0 && ` (${product.currentBidder.bidCount} bids)`}
                        </Typography>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    {!isSeller && (
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<Gavel />}
                          onClick={handlePlaceBid}
                          fullWidth
                          sx={{ py: 1.5 }}
                        >
                          Place Bid
                        </Button>
                        {product.buyNowPrice && (
                          <Button
                            variant="outlined"
                            size="large"
                            startIcon={<ShoppingCart />}
                            onClick={handleBuyNow}
                            fullWidth
                            sx={{ py: 1.5 }}
                          >
                            Buy Now
                          </Button>
                        )}
                      </Stack>
                    )}

                    {/* Seller Info */}
                    <Divider sx={{ my: 2 }} />
                    <Box
                      onClick={() => navigate(`/seller/${product.seller.id}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={product.seller.avatar}
                          sx={{ width: 56, height: 56 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="medium">
                            {product.seller.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Rating
                              value={product.seller.rating}
                              precision={0.1}
                              size="small"
                              readOnly
                            />
                            <Typography variant="body2" color="text.secondary">
                              {product.seller.rating.toFixed(1)} ({product.seller.ratingCount}{" "}
                              reviews)
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </div>

          {/* Description Section */}
          <Card
            elevation={0}
            sx={{ mt: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Product Description
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box
                sx={{
                  "& h3, & h4": { mt: 2, mb: 1, fontWeight: "bold" },
                  "& p": { mb: 1.5 },
                  "& ul, & ol": { mb: 1.5, pl: 3 },
                  "& hr": { my: 3 },
                }}
                dangerouslySetInnerHTML={{ __html: productDescription }}
              />

              {/* Seller can append description */}
              {isSeller && (
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Append Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add additional information about your product. This will be appended to the
                    existing description.
                  </Typography>
                  <RichTextEditor
                    value={newDescription}
                    onChange={handleNewDescriptionChange}
                    placeholder="Add more details about your product..."
                    minHeight={150}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSubmitNewDescription}
                    disabled={submittingDescription || !newDescription.trim()}
                    sx={{ mt: 2 }}
                    startIcon={
                      submittingDescription ? <CircularProgress size={16} /> : <Send />
                    }
                  >
                    {submittingDescription ? "Submitting..." : "Append Description"}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Bid History and Q&A Section */}
          <Card
            elevation={0}
            sx={{ mt: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
              >
                <Tab label={`Bid History (${bidHistory.length})`} />
                <Tab label={`Q&A (${questions.length})`} />
              </Tabs>

              {/* Bid History Tab */}
              {activeTab === 0 && (
                <Box>
                  {loading.bidHistory ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : error.bidHistory ? (
                    <Alert severity="error">{error.bidHistory}</Alert>
                  ) : bidHistory.length === 0 ? (
                    <Alert severity="info">No bids yet. Be the first to bid!</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bidder</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Time</TableCell>
                            {isSeller && <TableCell align="center">Actions</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bidHistory.map((bid) => (
                            <TableRow
                              key={bid.id}
                              sx={{
                                bgcolor: rejectedBids.has(bid.id)
                                  ? "error.light"
                                  : "transparent",
                                opacity: rejectedBids.has(bid.id) ? 0.6 : 1,
                              }}
                            >
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2">{bid.bidder}</Typography>
                                  {rejectedBids.has(bid.id) && (
                                    <Chip label="Rejected" color="error" size="small" />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="medium">
                                  {formatPrice(bid.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">
                                  {getRelativeTime(bid.time)}
                                </Typography>
                              </TableCell>
                              {isSeller && !rejectedBids.has(bid.id) && (
                                <TableCell align="center">
                                  <Tooltip title="Reject Bid">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleOpenRejectDialog(bid)}
                                      disabled={rejectingBid === bid.id}
                                    >
                                      {rejectingBid === bid.id ? (
                                        <CircularProgress size={20} />
                                      ) : (
                                        <Block />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Q&A Tab */}
              {activeTab === 1 && (
                <Box>
                  {loading.questions && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                      <CircularProgress />
                    </Box>
                  )}
                  {error.questions && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error.questions}
                    </Alert>
                  )}
                  {/* Ask Question Form */}
                  {!isSeller && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
                      <Typography variant="h6" gutterBottom>
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
                      >
                        Submit Question
                      </Button>
                    </Paper>
                  )}

                  {/* Questions List */}
                  {questions.length === 0 ? (
                    <Alert severity="info">No questions yet.</Alert>
                  ) : (
                    <Stack spacing={3}>
                      {questions.map((q) => (
                        <Paper key={q.id} sx={{ p: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Avatar src={q.bidder.avatar} />
                            <Box sx={{ flex: 1 }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={1}
                              >
                                <Typography variant="subtitle2" fontWeight="medium">
                                  {q.bidder.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {getRelativeTime(q.askedAt)}
                                </Typography>
                              </Stack>
                              <Typography variant="body1" sx={{ mb: 2 }}>
                                {q.question}
                              </Typography>

                              {/* Answer Section */}
                              {q.answer ? (
                                <Box
                                  sx={{
                                    pl: 2,
                                    borderLeft: 2,
                                    borderColor: "primary.main",
                                    mt: 2,
                                  }}
                                >
                                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                    <Avatar
                                      src={product.seller.avatar}
                                      sx={{ width: 24, height: 24 }}
                                    />
                                    <Typography variant="subtitle2" fontWeight="medium">
                                      {product.seller.name} (Seller)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {getRelativeTime(q.answeredAt)}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">
                                    {q.answer}
                                  </Typography>
                                </Box>
                              ) : isSeller ? (
                                <Box sx={{ mt: 2 }}>
                                  <RichTextEditor
                                    value={answerTexts[q.id] || ""}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    placeholder="Type your answer here..."
                                    minHeight={100}
                                  />
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleSubmitAnswer(q.id)}
                                    disabled={
                                      submittingAnswer[q.id] || !answerTexts[q.id]?.trim()
                                    }
                                    sx={{ mt: 1 }}
                                    startIcon={
                                      submittingAnswer[q.id] ? (
                                        <CircularProgress size={14} />
                                      ) : (
                                        <Send />
                                      )
                                    }
                                  >
                                    {submittingAnswer[q.id] ? "Submitting..." : "Submit Answer"}
                                  </Button>
                                </Box>
                              ) : (
                                <Chip
                                  label="Awaiting seller response"
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Related Products */}
          {loading.relatedProducts ? (
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error.relatedProducts ? (
            <Alert severity="error" sx={{ mt: 4 }}>
              {error.relatedProducts}
            </Alert>
          ) : relatedProducts.length > 0 && (
            <Box sx={{ mt: 4, position: 'relative' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight="bold">
                  Related Products
                </Typography>
              </Stack>
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  onClick={() => handleScrollRelatedProducts('left')}
                  sx={{
                    position: 'absolute',
                    left: -20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 2,
                    '&:hover': {
                      bgcolor: 'grey.100',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <Box
                  ref={relatedProductsRef}
                  sx={{
                    display: 'flex',
                    gap: 2.5,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none', // Firefox
                    '&::-webkit-scrollbar': {
                      display: 'none', // Chrome, Safari
                    },
                    px: 1,
                    py: 1,
                  }}
                >
                  {relatedProducts.map((relatedProduct) => (
                    <Card
                      key={relatedProduct.id}
                      elevation={0}
                      sx={{
                        minWidth: 350,
                        borderRadius: 2,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                        },
                      }}
                      onClick={() => navigate(`/product/${relatedProduct.id}`)}
                    >
                      <CardMedia
                        component="img"
                        image={relatedProduct.image}
                        alt={relatedProduct.title}
                        sx={{ height: 200, objectFit: "cover" }}
                      />
                      <CardContent>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          sx={{
                            mb: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {relatedProduct.title}
                        </Typography>
                        <Typography
                          variant="h6"
                          color="primary.main"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {formatPrice(relatedProduct.currentPrice)}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {getTimeLeft(relatedProduct.endTime)}
                          </Typography>
                          <Box sx={{ flex: 1 }} />
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Gavel fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {relatedProduct.bidCount}
                            </Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                <IconButton
                  onClick={() => handleScrollRelatedProducts('right')}
                  sx={{
                    position: 'absolute',
                    right: -20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 2,
                    '&:hover': {
                      bgcolor: 'grey.100',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Bid Dialog */}
          <Dialog
            open={openBidDialog}
            onClose={() => setOpenBidDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Place a Bid</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Alert severity="info">
                  Current highest bid: <strong>{formatPrice(product.currentPrice)}</strong>
                  <br />
                  Minimum bid:{" "}
                  <strong>
                    {formatPrice(product.currentPrice + product.bidIncrement)}
                  </strong>
                </Alert>
                <TextField
                  label="Your Bid Amount"
                  type="number"
                  fullWidth
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  helperText={`Bid increment: ${formatPrice(product.bidIncrement)}`}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₫</Typography>,
                  }}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Suggested Bids:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {suggestedBids.map((amount, idx) => (
                      <Chip
                        key={idx}
                        label={formatPrice(amount)}
                        onClick={() => setBidAmount(amount.toString())}
                        variant={bidAmount === amount.toString() ? "filled" : "outlined"}
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenBidDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleConfirmBid}
                disabled={
                  !bidAmount ||
                  Number(bidAmount) < product.currentPrice + product.bidIncrement
                }
              >
                Confirm Bid
              </Button>
            </DialogActions>
          </Dialog>

          {/* Reject Bid Confirmation Dialog */}
          <Dialog
            open={openRejectDialog}
            onClose={handleCloseRejectDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Reject Bid</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you sure you want to reject this bid? This action cannot be undone.
              </Alert>
              {bidToReject && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Bidder: <strong>{bidToReject.bidder}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amount: <strong>{formatPrice(bidToReject.amount)}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: <strong>{getRelativeTime(bidToReject.time)}</strong>
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseRejectDialog} disabled={rejectingBid}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmReject}
                disabled={rejectingBid}
                startIcon={rejectingBid ? <CircularProgress size={16} /> : <Block />}
              >
                {rejectingBid ? "Rejecting..." : "Reject Bid"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Page>
  );
}

export default ProductDetailPage;
