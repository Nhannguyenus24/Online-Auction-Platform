import { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
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
  Home,
  NavigateNext,
  Star,
  Visibility,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import RichTextEditor from "../components/RichTextEditor";
import Page from "../components/Page";
import { formatPrice } from "../utils/formatNumber";
import { productApi } from "../services/productApi";


function ProductDetailPage() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { user } = useAuth();

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
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState({});
  const [productDescription, setProductDescription] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submittingDescription, setSubmittingDescription] = useState(false);
  const [rejectedBids, setRejectedBids] = useState(new Set());
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [bidToReject, setBidToReject] = useState(null);
  const [rejectingBid, setRejectingBid] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const relatedProductsRef = useRef(null);

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

  // Check if current user is the seller/owner of this product
  const isSeller =
    user &&
    user.roleName?.toLowerCase() === "seller" &&
    product &&
    user.id === product.sellerId;

  // Check if auction has started (has bids)
  const hasStartedBidding = product && (product.bidsCount > 0 || bidHistory.length > 0);

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
          
          // Map API product to component format
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
            postedTime: apiProduct.createdAt ? new Date(apiProduct.createdAt) : new Date(),
            endTime: apiProduct.endsAt ? new Date(apiProduct.endsAt) : new Date(),
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
  }, [productId]);

  // Fetch bid history, questions, and related products
  useEffect(() => {
    if (!productId) return;

    const fetchAdditionalData = async () => {
      try {
        // Fetch bid history
        setLoading((prev) => ({ ...prev, bidHistory: true }));
        try {
          const bidResponse = await productApi.getBidHistory(productId, 1, 50);
          if (bidResponse.success) {
            const mappedBids = (bidResponse.bids || []).map((bid) => ({
              id: bid.id,
              bidder: bid.bidderMasked || bid.bidderName || "Anonymous",
              bidderId: bid.bidderId,
              amount: bid.amount || bid.bidAmount,
              time: bid.createdAt ? new Date(bid.createdAt) : new Date(bid.bidTime || Date.now()),
            }));
            setBidHistory(mappedBids);
          }
        } catch (err) {
          // Handle 403 gracefully (endpoint may not be implemented or require auth)
          if (err.response?.status === 403) {
            console.warn("Bid history endpoint returned 403, treating as empty");
            setBidHistory([]);
          } else {
            console.error("Error fetching bid history:", err);
            setError((prev) => ({ ...prev, bidHistory: err.message || "Failed to load bid history" }));
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
              askedAt: q.createdAt ? new Date(q.createdAt) : new Date(q.askedAt || Date.now()),
              answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
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
                endTime: p.endsAt ? new Date(p.endsAt) : new Date(),
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

  // Polling for bid history if product is active
  useEffect(() => {
    if (!productId || !product || product.status !== "ACTIVE") return;

    const interval = setInterval(async () => {
      try {
        const bidResponse = await productApi.getBidHistory(productId, 1, 50);
        if (bidResponse.success) {
          const mappedBids = (bidResponse.bids || []).map((bid) => ({
            id: bid.id,
            bidder: bid.bidderMasked || bid.bidderName || "Anonymous",
            bidderId: bid.bidderId,
            amount: bid.amount || bid.bidAmount,
            time: bid.createdAt ? new Date(bid.createdAt) : new Date(bid.bidTime || Date.now()),
          }));
          setBidHistory(mappedBids);
        }
      } catch (err) {
        // Silently handle 403 in polling (endpoint may not be implemented)
        if (err.response?.status !== 403) {
          console.error("Error polling bid history:", err);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [productId, product]);

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
    return "Just now";
  };

  const handlePreviousImage = () => {
    if (!product || !product.images || product.images.length <= 1) return;
    setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!product || !product.images || product.images.length <= 1) return;
    setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const handlePlaceBid = () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    setOpenBidDialog(true);
  };

  const handleConfirmBid = async () => {
    if (!productId || !bidAmount) return;

    const amount = Number(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid bid amount");
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
        const bidResponse = await productApi.getBidHistory(productId, 1, 50);
        if (bidResponse.success) {
          const mappedBids = (bidResponse.bids || []).map((bid) => ({
            id: bid.id,
            bidder: bid.bidderMasked || bid.bidderName || "Anonymous",
            bidderId: bid.bidderId,
            amount: bid.amount || bid.bidAmount,
            time: bid.createdAt ? new Date(bid.createdAt) : new Date(bid.bidTime || Date.now()),
          }));
          setBidHistory(mappedBids);
        }

        setOpenBidDialog(false);
        setBidAmount("");
        alert(response.message || "Bid placed successfully!");
      }
    } catch (err) {
      console.error("Error placing bid:", err);
      alert(err.response?.data?.message || err.message || "Failed to place bid");
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (!product || !product.buyNowPrice) {
      alert("Buy now option is not available for this product");
      return;
    }
    // TODO: Implement buy now functionality
    // Navigate to checkout or show confirmation dialog
    console.log("Buy now:", product.buyNowPrice);
  };

  const handleAskQuestion = async () => {
    if (!user) {
      navigate("/auth/login");
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
              name: q.bidderName || q.bidder?.name || "Anonymous",
              avatar: q.bidderAvatar || q.bidder?.avatar || "",
            },
            question: q.question,
            answer: q.answer,
            askedAt: q.createdAt ? new Date(q.createdAt) : new Date(q.askedAt || Date.now()),
            answeredAt: q.answeredAt ? new Date(q.answeredAt) : null,
          }));
          setQuestions(mappedQuestions);
        }
        setQuestion("");
        alert(response.message || "Question submitted successfully!");
      }
    } catch (err) {
      console.error("Error asking question:", err);
      alert(err.response?.data?.message || err.message || "Failed to submit question");
    }
  };

  const handleToggleWatchlist = () => {
    if (!user) {
      navigate("/auth/login");
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
              name: q.bidderName || q.bidder?.name || "Anonymous",
              avatar: q.bidderAvatar || q.bidder?.avatar || "",
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
      console.error("Error submitting answer:", err);
      alert(err.response?.data?.message || err.message || "Failed to submit answer");
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
    setNewDescription(event.target.value || "");
  };

  const handleSubmitNewDescription = async () => {
    const descriptionText = newDescription.replace(/<[^>]*>/g, "").trim(); // Strip HTML to check if empty
    if (!descriptionText || !productId) return;

    setSubmittingDescription(true);

    try {
      const response = await productApi.appendDescription(productId, newDescription);
      if (response.success) {
        // Refresh product to get updated description
        const productResponse = await productApi.getProductById(productId);
        if (productResponse.success && productResponse.product) {
          setProductDescription(productResponse.product.description || "");
          setProduct((prev) => ({
            ...prev,
            description: productResponse.product.description || prev.description,
          }));
        }

        // Clear new description
        setNewDescription("");
        alert(response.message || "Description appended successfully!");
      }
    } catch (err) {
      console.error("Error submitting new description:", err);
      alert(err.response?.data?.message || err.message || "Failed to append description");
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
        alert(response.message || "Bid rejected successfully");
      }
    } catch (err) {
      console.error("Error rejecting bid:", err);
      alert(err.response?.data?.message || err.message || "Failed to reject bid");
    } finally {
      setRejectingBid(null);
    }
  };

  const handleScrollRelatedProducts = (direction) => {
    if (relatedProductsRef.current) {
      const scrollAmount = 370; // 350px (card width) + 20px (gap)
      const currentScroll = relatedProductsRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      relatedProductsRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Get all images from product
  const allImages = product?.images?.map((img) => img.url) || [];

  // Calculate suggested bids
  const suggestedBids = product
    ? [
        product.currentPrice + product.bidIncrement,
        product.currentPrice + product.bidIncrement * 2,
        product.currentPrice + product.bidIncrement * 3,
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
