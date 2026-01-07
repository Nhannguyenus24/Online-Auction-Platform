import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
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
  Send,
  ChevronLeft,
  ChevronRight,
  Block,
  Home,
  NavigateNext,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../hooks/useAuth';
import RichTextEditor from '../components/RichTextEditor';
import Page from '../components/Page';
import { formatPrice } from '../utils/formatNumber';
import { normalizeTimestamp, fVNDateTime } from '../utils/formatTime';
import { productApi } from '../services/productApi';
import { watchlistApi } from '../services/watchlistApi';


function ProductDetailPage() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useAuth();
  // Product data state
  const [product, setProduct] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  // UI state
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [question, setQuestion] = useState("");
  const [openBidDialog, setOpenBidDialog] = useState(false);
  const [openBuyNowDialog, setOpenBuyNowDialog] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState({});
  const [productDescription, setProductDescription] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submittingDescription, setSubmittingDescription] = useState(false);
  const [showAppendDescription, setShowAppendDescription] = useState(false);
  const [rejectedBids, setRejectedBids] = useState(new Set());
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [bidToReject, setBidToReject] = useState(null);
  const [rejectingBid, setRejectingBid] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const relatedProductsRef = useRef(null);
  const [isSeller, setIsSeller] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  // Loading and error states
  const [loading, setLoading] = useState({
    product: true,
    bidHistory: false,
    questions: false,
    relatedProducts: false,
  });
  const [error, setError] = useState({
    product: null,
    bidHistory: null,
    questions: null,
    relatedProducts: null,
  });

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading((prev) => ({ ...prev, product: true }));
        setError((prev) => ({ ...prev, product: null }));

        const response = await productApi.getProductById(productId);
        if (response.success && response.product) {
          const apiProduct = response.product;
          setIsSeller(apiProduct.sellerId == user.id);
          const mappedProduct = {
            id: apiProduct.id,
            title: apiProduct.title,
            description: apiProduct.description || "",
            currentPrice: apiProduct.currentPrice || 0,
            buyNowPrice: apiProduct.buyNowPrice,
            startingPrice: apiProduct.startingPrice || 0,
            bidIncrement: apiProduct.stepPrice || 0,
            sellerId: apiProduct.sellerId,
            seller: {
              id: apiProduct.sellerId,
              name: apiProduct.sellerName || "Unknown Seller",
              rating: apiProduct.sellerRatingPercent ? apiProduct.sellerRatingPercent / 20 : 0, // Convert to 5-star scale
              ratingCount: apiProduct.sellerRatingCount || 0,
              avatar: apiProduct.sellerAvatar || "",
            },
            currentBidder: apiProduct.highestBidderMasked
              ? {
                  name: apiProduct.highestBidderMasked,
                  bidCount: 0, // API might not provide this
                }
              : null,
            postedTime: apiProduct.createdAt ? normalizeTimestamp(apiProduct.createdAt) : new Date(),
            endTime: apiProduct.endsAt ? normalizeTimestamp(apiProduct.endsAt) : new Date(),
            status: apiProduct.status || "ACTIVE",
            category: apiProduct.category
              ? {
                  id: apiProduct.category.id || apiProduct.categoryId,
                  name: apiProduct.category.name || apiProduct.categoryName,
                }
              : null,
            bidCount: apiProduct.bidsCount || 0,
            watchCount: apiProduct.viewsCount || 0,
            images: apiProduct.images || [],
          };

          setProduct(mappedProduct);
          setProductDescription(mappedProduct.description);

          // Set watchlist status from API response
          if (isAuthenticated && apiProduct.isInWatchlist !== undefined) {
            setIsWatchlisted(apiProduct.isInWatchlist);
          } else {
            setIsWatchlisted(false);
          }

          // Set images for selection
          if (mappedProduct.images.length > 0) {
            setSelectedImage(0);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError((prev) => ({
          ...prev,
          product: err.response?.data?.message || err.message || "Failed to load product",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, product: false }));
      }
    };

    fetchProduct();
  }, [productId, isAuthenticated]);

  // Fetch top bidders, questions, and related products
  useEffect(() => {
    if (!productId) return;

    const fetchAdditionalData = async () => {
      try {
        // Fetch top 5 bidders
        setLoading((prev) => ({ ...prev, bidHistory: true }));
        try {
          const bidResponse = await productApi.getTopBidders(productId, 5);
          if (bidResponse.success) {
            const mappedBids = (bidResponse.topBidders || []).map((bidder) => ({
              id: bidder.bidderId,
              bidder: bidder.bidderName || "Anonymous",
              bidderId: bidder.bidderId,
              amount: bidder.bidAmount,
              time: normalizeTimestamp(bidder.bidTime),
            }));
            setBidHistory(mappedBids);
          }
        } catch (err) {
          // Handle 403 gracefully (endpoint may not be implemented or require auth)
          if (err.response?.status === 403) {
            console.warn("Top bidders endpoint returned 403, treating as empty");
            setBidHistory([]);
          } else {
            console.error("Error fetching top bidders:", err);
            setError((prev) => ({ ...prev, bidHistory: err.message || "Failed to load top bidders" }));
          }
        } finally {
          setLoading((prev) => ({ ...prev, bidHistory: false }));
        }

        // Fetch questions
        setLoading((prev) => ({ ...prev, questions: true }));
        try {
          const questionsResponse = await productApi.getQuestions(productId);
          if (questionsResponse.success) {
            const mappedQuestions = (questionsResponse.questions || []).map((q) => ({
              id: q.id,
              bidder: {
                name: q.bidderName || q.bidder?.name || "Anonymous",
                avatar: q.bidderAvatar || q.bidder?.avatar || "",
              },
              question: q.question,
              answer: q.answer,
              askedAt: q.createdAt ? normalizeTimestamp(q.createdAt) : new Date(q.askedAt || Date.now()),
              answeredAt: q.answeredAt ? normalizeTimestamp(q.answeredAt) : null,
            }));
            setQuestions(mappedQuestions);
          }
        } catch (err) {
          // Handle 403 gracefully (endpoint may not be implemented or require auth)
          if (err.response?.status === 403) {
            console.warn("Questions endpoint returned 403, treating as empty");
            setQuestions([]);
          } else {
            console.error("Error fetching questions:", err);
            setError((prev) => ({ ...prev, questions: err.message || "Failed to load questions" }));
          }
        } finally {
          setLoading((prev) => ({ ...prev, questions: false }));
        }

        // Fetch related products
        setLoading((prev) => ({ ...prev, relatedProducts: true }));
        try {
          const relatedResponse = await productApi.getRelatedProducts(productId);
          if (relatedResponse.success) {
            const mappedRelated = (relatedResponse.products || []).map((p) => {
              const primaryImage = p.images?.find((img) => img.isPrimary) || p.images?.[0];
              return {
                id: p.id,
                title: p.title,
                image: primaryImage?.url || p.image || "/placeholder-image.jpg",
                currentPrice: p.currentPrice || 0,
                endTime: p.endsAt ? normalizeTimestamp(p.endsAt) : new Date(),
                bidCount: p.bidsCount || 0,
              };
            });
            setRelatedProducts(mappedRelated);
          }
        } catch (err) {
          // Handle 403 gracefully (endpoint may not be implemented or require auth)
          if (err.response?.status === 403) {
            console.warn("Related products endpoint returned 403, treating as empty");
            setRelatedProducts([]);
          } else {
            console.error("Error fetching related products:", err);
            setError((prev) => ({
              ...prev,
              relatedProducts: err.message || "Failed to load related products",
            }));
          }
        } finally {
          setLoading((prev) => ({ ...prev, relatedProducts: false }));
        }
      } catch (err) {
        console.error("Error fetching additional data:", err);
      }
    };

    fetchAdditionalData();
  }, [productId]);

  // Polling for top bidders if product is active
  useEffect(() => {
    if (!productId || !product || product.status !== "ACTIVE") return;

    const interval = setInterval(async () => {
      try {
          const bidResponse = await productApi.getTopBidders(productId, 5);
          if (bidResponse.success) {
            const mappedBids = (bidResponse.topBidders || []).map((bidder) => ({
              id: bidder.bidderId,
              bidder: bidder.bidderName || "Anonymous",
              bidderId: bidder.bidderId,
              amount: bidder.bidAmount,
              time: normalizeTimestamp(bidder.bidTime),
            }));
            setBidHistory(mappedBids);
        }
      } catch (err) {
        // Silently handle 403 in polling (endpoint may not be implemented)
        if (err.response?.status !== 403) {
          console.error("Error polling top bidders:", err);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [productId, product]);

  // Update countdown timer every second
  useEffect(() => {
    if (!product || !product.endTime) return;

    // Update immediately
    setTimeLeft(getTimeLeft(product.endTime));

    // Then update every second
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(product.endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [product]);

  // Check if current user is the seller/owner of this product
 
  // Check if auction has started (has bids)
  const hasStartedBidding = product && (product.bidsCount > 0 || bidHistory.length > 0);

  // Get all images from product
  const allImages = product?.images?.map((img) => img.url) || [];

  const getTimeLeft = (endTime) => {
    // Check if product has ended
    if (product?.status?.toLowerCase() === 'ended') {
      return 'Ended';
    }

    const now = new Date();
    const normalizedEndTime = endTime instanceof Date ? endTime : normalizeTimestamp(endTime);
    const diff = normalizedEndTime - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days} days ${hours} hours`;
    if (hours > 0) return `${hours} hours ${minutes} minutes`;
    if (minutes > 0) return `${minutes} minutes ${seconds} seconds`;
    return `${seconds} seconds`;
  };

  const handlePreviousImage = () => {
    if (allImages.length <= 1) return;
    setSelectedImage((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    setSelectedImage((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleScrollRelatedProducts = (direction) => {
    if (relatedProductsRef.current) {
      const scrollAmount = 400;
      relatedProductsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handlePlaceBid = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    setOpenBidDialog(true);
  };

  const handleConfirmBid = async () => {
    if (!productId || !bidAmount) return;

    const amount = Number(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid bid amount', { variant: 'error' });
      return;
    }

    try {
      const response = await productApi.placeBid(productId, amount);
      if (response.success) {
        // Refresh product and bid history
        const productResponse = await productApi.getProductById(productId);
        if (productResponse.success && productResponse.product) {
          const apiProduct = productResponse.product;
          setProduct((prev) => ({
            ...prev,
            currentPrice: apiProduct.currentPrice || prev.currentPrice,
            bidCount: apiProduct.bidsCount || prev.bidCount,
          }));
        }

        // Refresh bid history
          const bidResponse = await productApi.getTopBidders(productId, 5);
          if (bidResponse.success) {
            const mappedBids = (bidResponse.topBidders || []).map((bidder) => ({
              id: bidder.bidderId,
              bidder: bidder.bidderName || "Anonymous",
              bidderId: bidder.bidderId,
              amount: bidder.bidAmount,
              time: normalizeTimestamp(bidder.bidTime),
            }));
            setBidHistory(mappedBids);
          }

        setOpenBidDialog(false);
        setBidAmount('');
        enqueueSnackbar(response.message || 'Bid placed successfully!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error placing bid:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to place bid', { variant: 'error' });
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (!product || !product.buyNowPrice) {
      enqueueSnackbar('Buy now option is not available for this product', { variant: 'warning' });
      return;
    }
    setOpenBuyNowDialog(true);
  };

  const handleConfirmBuyNow = async () => {
    if (!productId) return;

    setBuyingNow(true);
    try {
      const response = await productApi.buyNowProduct(productId);
      if (response.success) {
        setOpenBuyNowDialog(false);
        enqueueSnackbar(`${response.message} - Order ID: ${response.orderId}`, { variant: 'success' });
        
        // Refresh product to show updated status
        const productResponse = await productApi.getProductById(productId);
        if (productResponse.success && productResponse.product) {
          const apiProduct = productResponse.product;
          setProduct((prev) => ({
            ...prev,
            status: apiProduct.status || prev.status,
          }));
        }
        
        // Navigate to orders page or stay on product page
        // navigate('/orders');
      }
    } catch (err) {
      console.error('Error buying now:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to purchase product', { variant: 'error' });
    } finally {
      setBuyingNow(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (!productId || !question.trim()) return;

    try {
      const response = await productApi.askQuestion(productId, question.trim());
      if (response.success) {
        // Refresh questions
        const questionsResponse = await productApi.getQuestions(productId);
        if (questionsResponse.success) {
          const mappedQuestions = (questionsResponse.questions || []).map((q) => ({
            id: q.id,
            bidder: {
              name: q.bidderName || q.bidder?.name || 'Anonymous',
              avatar: q.bidderAvatar || q.bidder?.avatar || '',
            },
            question: q.question,
            answer: q.answer,
            askedAt: q.createdAt ? new Date(q.createdAt) : new Date(q.askedAt || Date.now()),
            answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
          }));
          setQuestions(mappedQuestions);
        }
        setQuestion('');
        enqueueSnackbar(response.message || 'Question submitted successfully!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error asking question:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to submit question', { variant: 'error' });
    }
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    if (!productId) return;
    
    try {
      if (isWatchlisted) {
        const response = await watchlistApi.removeFromWatchlist(parseInt(productId));
        if (response.success) {
          setIsWatchlisted(false);
        }
      } else {
        const response = await watchlistApi.addToWatchlist(parseInt(productId));
        if (response.success) {
          setIsWatchlisted(true);
        }
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to update watchlist', { variant: 'error' });
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswerTexts((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitAnswer = async (questionId) => {
    const answer = answerTexts[questionId]?.trim();
    if (!answer || !productId) return;

    setSubmittingAnswer((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await productApi.answerQuestion(productId, questionId, answer);
      if (response.success) {
        // Refresh questions
        const questionsResponse = await productApi.getQuestions(productId);
        if (questionsResponse.success) {
          const mappedQuestions = (questionsResponse.questions || []).map((q) => ({
            id: q.id,
            bidder: {
              name: q.bidderName || q.bidder?.name || 'Anonymous',
              avatar: q.bidderAvatar || q.bidder?.avatar || '',
            },
            question: q.question,
            answer: q.answer,
            askedAt: q.createdAt ? new Date(q.createdAt) : new Date(q.askedAt || Date.now()),
            answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
          }));
          setQuestions(mappedQuestions);
        }

        // Clear answer text
        setAnswerTexts((prev) => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to submit answer', { variant: 'error' });
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
    if (!descriptionText || !productId) return;

    setSubmittingDescription(true);

    try {
      const response = await productApi.appendDescription(productId, newDescription);
      if (response.success) {
        // Update product description with the response
        const updatedDescription = response.updatedDescription || '';
        setProductDescription(updatedDescription);
        setProduct((prev) => ({
          ...prev,
          description: updatedDescription,
        }));

        // Clear new description and hide form
        setNewDescription('');
        setShowAppendDescription(false);
        enqueueSnackbar(response.message || 'Description appended successfully!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error submitting new description:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to append description', { variant: 'error' });
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
    if (!bidToReject || !productId || !bidToReject.bidderId) return;

    setRejectingBid(bidToReject.id);
    try {
      const response = await productApi.rejectBid(productId, bidToReject.bidderId);
      if (response.success) {
        // Mark bid as rejected
        setRejectedBids((prev) => new Set([...prev, bidToReject.id]));

        handleCloseRejectDialog();
        enqueueSnackbar(response.message || 'Bid rejected successfully', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error rejecting bid:', err);
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to reject bid', { variant: 'error' });
    } finally {
      setRejectingBid(null);
    }
  };

  // Calculate suggested bids
  const suggestedBids = product
    ? [
        (product.currentPrice || 0) + (product.bidIncrement || product.stepPrice || 0),
        (product.currentPrice || 0) + (product.bidIncrement || product.stepPrice || 0) * 2,
        (product.currentPrice || 0) + (product.bidIncrement || product.stepPrice || 0) * 3,
      ]
    : [];

  // Show loading state
  if (loading.product) {
    return (
      <Page title="Loading Product...">
        <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Loading product...
            </Typography>
          </Stack>
        </Box>
      </Page>
    );
  }

  // Show error state
  if (error.product || !product) {
    return (
      <Page title="Product Not Found">
        <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              {error.product || "Product not found"}
            </Typography>
            <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>
              Go to Home
            </Button>
          </Alert>
        </Box>
      </Page>
    );
  }

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

          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            {/* Left Column - Images */}
            <Card
              elevation={0}
              sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", width: "60%", display: "flex", flexDirection: "column" }}
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
            <div style={{ width: "40%", display: "flex", flexDirection: "column" }}>
              <Stack spacing={3} sx={{ flex: 1, height: "100%" }}>
                {/* Title and Status */}
                <Card
                  elevation={0}
                  sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", height: "100%", display: "flex", flexDirection: "column" }}
                >
                  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
                          Time Left: {timeLeft}
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
                          disabled={product.status?.toLowerCase() === 'ended'}
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
                            disabled={product.status?.toLowerCase() === 'ended'}
                          >
                            Buy Now
                          </Button>
                        )}
                      </Stack>
                    )}

                    {/* Seller Info */}
                    <Divider sx={{ my: 2 }} />
                    <Box>
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
                              {product.seller.rating.toFixed(1)} ({product.seller.ratingCount}{' '}
                              reviews)
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </div>
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
                  {!showAppendDescription ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setShowAppendDescription(true)}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Add More Description
                    </Button>
                  ) : (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="medium">
                          Append Description
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setShowAppendDescription(false);
                            setNewDescription('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
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
                      >
                        {submittingDescription ? "Submitting..." : "Append Description"}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Top Bidders and Q&A Section */}
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
                <Tab label={`Top ${bidHistory.length} Bidders`} />
                <Tab label={`Q&A (${questions.length})`} />
              </Tabs>

              {/* Top Bidders Tab */}
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
                            <TableCell>Rank</TableCell>
                            <TableCell>Bidder</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Time</TableCell>
                            {isSeller && <TableCell align="center">Actions</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bidHistory.map((bid, index) => (
                            <TableRow
                              key={bid.id}
                              sx={{
                                bgcolor: index === 0 ? "success.light" : rejectedBids.has(bid.id)
                                  ? "error.light"
                                  : "transparent",
                                opacity: rejectedBids.has(bid.id) ? 0.6 : 1,
                              }}
                            >
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body1" fontWeight="bold">
                                    #{index + 1}
                                  </Typography>
                                  {index === 0 && (
                                    <Chip label="Leading" color="success" size="small" />
                                  )}
                                </Stack>
                              </TableCell>
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
                                  {fVNDateTime(bid.time)}
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
                                  {fVNDateTime(q.askedAt)}
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
                                      {fVNDateTime(q.answeredAt)}
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
                  Minimum bid:{' '}
                  <strong>
                    {formatPrice(product.currentPrice + product.bidIncrement)}
                  </strong>
                  {product.buyNowPrice && (
                    <>
                      <br />
                      Buy Now price: <strong>{formatPrice(product.buyNowPrice)}</strong>
                    </>
                  )}
                </Alert>
                <TextField
                  label="Your Bid Amount"
                  type="number"
                  fullWidth
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  helperText={
                    product.buyNowPrice
                      ? `Bid increment: ${formatPrice(product.bidIncrement)} | Maximum: ${formatPrice(product.buyNowPrice)}`
                      : `Bid increment: ${formatPrice(product.bidIncrement)}`
                  }
                  error={
                    bidAmount &&
                    (Number(bidAmount) < product.currentPrice + product.bidIncrement ||
                      (product.buyNowPrice && Number(bidAmount) > product.buyNowPrice))
                  }
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₫</Typography>,
                  }}
                />
                {bidAmount && Number(bidAmount) > product.buyNowPrice && product.buyNowPrice && (
                  <Alert severity="error">
                    Bid amount cannot exceed Buy Now price ({formatPrice(product.buyNowPrice)}). Please use Buy Now button instead.
                  </Alert>
                )}
                {bidAmount && Number(bidAmount) < product.currentPrice + product.bidIncrement && (
                  <Alert severity="error">
                    Bid amount must be at least {formatPrice(product.currentPrice + product.bidIncrement)}
                  </Alert>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Suggested Bids:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {suggestedBids
                      .filter((amount) => !product.buyNowPrice || amount <= product.buyNowPrice)
                      .map((amount, idx) => (
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
                  Number(bidAmount) < product.currentPrice + product.bidIncrement ||
                  (product.buyNowPrice && Number(bidAmount) > product.buyNowPrice)
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
                    Time: <strong>{fVNDateTime(bidToReject.time)}</strong>
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

          {/* Buy Now Confirmation Dialog */}
          <Dialog
            open={openBuyNowDialog}
            onClose={() => !buyingNow && setOpenBuyNowDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Buy Now Confirmation</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Alert severity="info">
                  You are about to purchase this product immediately at the Buy Now price.
                </Alert>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Product:
                  </Typography>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {product?.title}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Buy Now Price:
                  </Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {formatPrice(product?.buyNowPrice)}
                  </Typography>
                </Box>
                <Alert severity="warning">
                  <strong>Note:</strong> This action will end the auction immediately and create an order. You must have positive reviews &gt; 4 × negative reviews to use this feature.
                </Alert>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenBuyNowDialog(false)} disabled={buyingNow}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmBuyNow}
                disabled={buyingNow}
                startIcon={buyingNow ? <CircularProgress size={16} /> : <ShoppingCart />}
              >
                {buyingNow ? "Processing..." : "Confirm Purchase"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Page>
  );
}

export default ProductDetailPage;
