<<<<<<< HEAD
import { useState, useRef, useEffect } from "react";
=======
import { useState, useRef, useEffect } from 'react';
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
} from "@mui/material";
=======
} from '@mui/material';
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
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
=======
  NavigateNext,
  Home,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RichTextEditor from '../components/RichTextEditor';
import Page from '../components/Page';
import { productApi } from '../services/productApi';
>>>>>>> 4908400446e374216968da11da063a748a693559


function ProductDetailPage() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
<<<<<<< HEAD
  const { user } = useAuth();

  // Product data state
  const [product, setProduct] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // UI state
=======
  const { user, isAuthenticated } = useAuth();
  
>>>>>>> 4908400446e374216968da11da063a748a693559
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [question, setQuestion] = useState("");
  const [openBidDialog, setOpenBidDialog] = useState(false);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState({});
<<<<<<< HEAD
  const [productDescription, setProductDescription] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submittingDescription, setSubmittingDescription] = useState(false);
=======
  const [questions, setQuestions] = useState([]);
  const [productDescription, setProductDescription] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submittingDescription, setSubmittingDescription] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
>>>>>>> 4908400446e374216968da11da063a748a693559
  const [rejectedBids, setRejectedBids] = useState(new Set());
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [bidToReject, setBidToReject] = useState(null);
  const [rejectingBid, setRejectingBid] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
<<<<<<< HEAD
  const relatedProductsRef = useRef(null);

  // Loading and error states
=======
  const [relatedProducts, setRelatedProducts] = useState([]);
  const relatedProductsRef = useRef(null);
  
  // Product data state
  const [product, setProduct] = useState(null);
>>>>>>> 4908400446e374216968da11da063a748a693559
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

<<<<<<< HEAD
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
=======
  // Fetch product details
  useEffect(() => {
    if (!productId) return;

    const fetchProductDetails = async () => {
      setLoading((prev) => ({ ...prev, product: true }));
      setError((prev) => ({ ...prev, product: null }));
      
      try {
        const response = await productApi.getProductDetails(parseInt(productId));
        if (response.success && response.product) {
          const productData = response.product;
          setProduct(productData);
          
          // Set description
          if (productData.description) {
            setProductDescription(productData.description);
          }
          
          // Set watchlist status
          if (productData.isInWatchlist !== undefined) {
            setIsWatchlisted(productData.isInWatchlist);
          }
        } else {
          setError((prev) => ({ ...prev, product: response.message || 'Failed to load product' }));
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError((prev) => ({ 
          ...prev, 
          product: err.response?.data?.message || err.message || 'Failed to load product details' 
        }));
      } finally {
        setLoading((prev) => ({ ...prev, product: false }));
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Fetch bid history
  useEffect(() => {
    if (!productId || !isAuthenticated) return;

    const fetchBidHistory = async () => {
      setLoading((prev) => ({ ...prev, bidHistory: true }));
      setError((prev) => ({ ...prev, bidHistory: null }));
      
      try {
        const response = await productApi.getProductBids(parseInt(productId));
        if (response.success) {
          // Map API response to component format
          const mappedBids = response.bids.map((bid) => ({
            id: bid.id,
            bidder: bid.bidderNameMasked || 'Anonymous',
            amount: bid.amount,
            time: new Date(parseInt(bid.createdAt)),
            isAuto: bid.isAuto,
            isCurrentUser: bid.isCurrentUser,
          }));
          setBidHistory(mappedBids);
        } else {
          setError((prev) => ({ ...prev, bidHistory: response.message || 'Failed to load bid history' }));
        }
      } catch (err) {
        console.error('Error fetching bid history:', err);
        setError((prev) => ({ 
          ...prev, 
          bidHistory: err.response?.data?.message || err.message || 'Failed to load bid history' 
        }));
      } finally {
        setLoading((prev) => ({ ...prev, bidHistory: false }));
      }
    };

    fetchBidHistory();
  }, [productId, isAuthenticated]);

  // Fetch questions
  useEffect(() => {
    if (!productId || !isAuthenticated) return;

    const fetchQuestions = async () => {
      setLoading((prev) => ({ ...prev, questions: true }));
      setError((prev) => ({ ...prev, questions: null }));
      
      try {
        const response = await productApi.getProductQuestions(parseInt(productId));
        if (response.success) {
          // Map API response to component format
          const mappedQuestions = response.questions.map((q) => ({
            id: q.id,
            bidder: { 
              name: q.askerName || 'Anonymous',
              avatar: `https://i.pravatar.cc/150?img=${q.askerId || 1}` 
            },
            question: q.question,
            answer: q.answer || null,
            askedAt: new Date(parseInt(q.createdAt)),
            answeredAt: q.answeredAt ? new Date(parseInt(q.answeredAt)) : null,
          }));
          setQuestions(mappedQuestions);
        } else {
          setError((prev) => ({ ...prev, questions: response.message || 'Failed to load questions' }));
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError((prev) => ({ 
          ...prev, 
          questions: err.response?.data?.message || err.message || 'Failed to load questions' 
        }));
      } finally {
        setLoading((prev) => ({ ...prev, questions: false }));
      }
    };

    fetchQuestions();
  }, [productId, isAuthenticated]);

  // Fetch related products
  useEffect(() => {
    if (!productId) {
      console.log('Related products: No productId, skipping fetch');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Related products: Not authenticated yet, waiting...');
      return;
    }

    console.log('Related products: Fetching for productId:', productId, 'isAuthenticated:', isAuthenticated);

    const fetchRelatedProducts = async () => {
      setLoading((prev) => ({ ...prev, relatedProducts: true }));
      setError((prev) => ({ ...prev, relatedProducts: null }));
      
      try {
        console.log('Related products: Calling API...');
        const response = await productApi.getRelatedProducts(parseInt(productId), 5);
        console.log('Related products: API response:', response);
        
        if (response.success) {
          // Map API response to component format
          const mappedProducts = (response.products || []).map((p) => {
            const primaryImage = p.images?.find(img => img.isPrimary) || p.images?.[0];
            return {
              id: p.id,
              title: p.title,
              image: primaryImage?.url || '/placeholder-image.jpg',
              currentPrice: p.currentPrice || 0,
              endTime: p.endsAt ? new Date(parseInt(p.endsAt)) : new Date(),
              bidCount: p.bidsCount || 0,
            };
          });
          console.log('Related products: Mapped products:', mappedProducts);
          setRelatedProducts(mappedProducts);
          
          if (mappedProducts.length === 0) {
            console.log('Related products: No related products found in same category');
          }
        } else {
          console.warn('Related products: API returned success=false:', response.message);
          setError((prev) => ({ ...prev, relatedProducts: response.message || 'Failed to load related products' }));
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError((prev) => ({ 
          ...prev, 
          relatedProducts: err.response?.data?.message || err.message || 'Failed to load related products' 
        }));
      } finally {
        setLoading((prev) => ({ ...prev, relatedProducts: false }));
      }
    };

    fetchRelatedProducts();
  }, [productId, isAuthenticated]);

  // Check if current user is the seller
  const isSeller = user && user.roleName?.toLowerCase() === 'seller' && product && user.id === product.sellerId;
  
  // Get all images from product
  const allImages = product?.images 
    ? product.images.map(img => img.url)
    : [];
  // Check if auction has started (has bids)
  const hasStartedBidding = (product?.bidsCount || 0) > 0 || bidHistory.length > 0;
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };
>>>>>>> 4908400446e374216968da11da063a748a693559

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
<<<<<<< HEAD
    if (!product || !product.images || product.images.length <= 1) return;
    setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!product || !product.images || product.images.length <= 1) return;
    setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
=======
    setSelectedImage((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
>>>>>>> 4908400446e374216968da11da063a748a693559
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    // TODO: Implement buy now API call
    console.log('Buying now:', product?.buyNowPrice);
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
<<<<<<< HEAD
    if (!user) {
      navigate("/auth/login");
=======
    if (!isAuthenticated) {
      navigate('/auth/login');
>>>>>>> 4908400446e374216968da11da063a748a693559
      return;
    }
    setOpenBidDialog(true);
  };

  const handleConfirmBid = async () => {
    if (!productId || !bidAmount) return;
<<<<<<< HEAD

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
=======
    
    try {
      // TODO: Implement place bid API call
      // await productApi.placeBid(parseInt(productId), parseFloat(bidAmount));
      console.log('Placing bid:', bidAmount);
      setOpenBidDialog(false);
      setBidAmount('');
      // Refresh bid history after placing bid
      // await fetchBidHistory();
    } catch (err) {
      console.error('Error placing bid:', err);
    }
  };

  const handleAskQuestion = async () => {
    if (!productId || !question.trim()) return;
    
    try {
      // TODO: Implement ask question API call
      // await productApi.askQuestion(parseInt(productId), question);
      console.log('Posting question:', question);
      setQuestion('');
      // Refresh questions after posting
      // await fetchQuestions();
    } catch (err) {
      console.error('Error posting question:', err);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    if (!productId) return;
    
    try {
      // TODO: Implement watchlist toggle API call
      // if (isWatchlisted) {
      //   await productApi.removeFromWatchlist(parseInt(productId));
      // } else {
      //   await productApi.addToWatchlist(parseInt(productId));
      // }
      setIsWatchlisted(!isWatchlisted);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
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
=======
      // TODO: Implement answer question API call
      // await productApi.answerQuestion(parseInt(productId), questionId, answer);
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Update the question with answer in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer, answeredAt: new Date() }
            : q
        )
      );
>>>>>>> 4908400446e374216968da11da063a748a693559

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
<<<<<<< HEAD
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
=======
      // TODO: Implement append description API call
      // await productApi.appendDescription(parseInt(productId), newDescription);
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Append new description to existing description
      const updatedDescription = productDescription + '\n<hr style="margin: 20px 0; border: none; border-top: 2px solid #e0e0e0;" />\n' + newDescription;
      setProductDescription(updatedDescription);
      
      // Clear new description
      setNewDescription('');
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
      const response = await productApi.rejectBid(productId, bidToReject.bidderId);
      if (response.success) {
        // Mark bid as rejected
        setRejectedBids((prev) => new Set([...prev, bidToReject.id]));

        handleCloseRejectDialog();
        alert(response.message || "Bid rejected successfully");
      }
=======
      // TODO: Implement reject bid API call
      // await productApi.rejectBid(parseInt(productId), bidToReject.id);
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Mark bid as rejected
      setRejectedBids((prev) => new Set([...prev, bidToReject.id]));
      
      // Remove rejected bid from history (or keep it with rejected status)
      // Option 1: Remove from list
      // setBidHistory((prev) => prev.filter((bid) => bid.id !== bidToReject.id));
      
      // Option 2: Keep in list but mark as rejected (better UX)
      // Already handled by rejectedBids Set
      
      handleCloseRejectDialog();
>>>>>>> 4908400446e374216968da11da063a748a693559
    } catch (err) {
      console.error("Error rejecting bid:", err);
      alert(err.response?.data?.message || err.message || "Failed to reject bid");
    } finally {
      setRejectingBid(null);
    }
  };

<<<<<<< HEAD
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
=======
  const suggestedBids = product
    ? [
        (product.currentPrice || 0) + (product.stepPrice || 0),
        (product.currentPrice || 0) + (product.stepPrice || 0) * 2,
        (product.currentPrice || 0) + (product.stepPrice || 0) * 3,
>>>>>>> 4908400446e374216968da11da063a748a693559
      ]
    : [];

  // Show loading state
  if (loading.product) {
    return (
      <Page title="Loading Product...">
        <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
<<<<<<< HEAD
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Loading product...
            </Typography>
          </Stack>
=======
          <CircularProgress />
>>>>>>> 4908400446e374216968da11da063a748a693559
        </Box>
      </Page>
    );
  }

  // Show error state
  if (error.product || !product) {
    return (
      <Page title="Product Not Found">
<<<<<<< HEAD
        <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              {error.product || "Product not found"}
            </Typography>
            <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>
              Go to Home
            </Button>
          </Alert>
=======
        <Box sx={{ bgcolor: "grey.50", minHeight: "100vh" }}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Alert severity="error">
              {error.product || "Product not found"}
            </Alert>
            <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
              Go to Home
            </Button>
          </Container>
>>>>>>> 4908400446e374216968da11da063a748a693559
        </Box>
      </Page>
    );
  }
<<<<<<< HEAD

  return (
    <Page title={`${product.title} - Product Detail`}>
=======

  // Map product data to expected format
  const productData = {
    id: product.id,
    title: product.title,
    description: product.description || '',
    currentPrice: product.currentPrice || 0,
    buyNowPrice: product.buyNowPrice || null,
    startingPrice: product.startingPrice || 0,
    bidIncrement: product.stepPrice || 0,
    seller: {
      id: product.sellerId || product.sellerInfo?.id,
      name: product.sellerName || product.sellerInfo?.fullName || 'Unknown Seller',
      rating: (product.sellerRatingPercent || product.sellerInfo?.ratingPercent || 0) / 20, // Convert from percent to 5-star scale
      ratingCount: (product.sellerPositiveReviews || product.sellerInfo?.positiveReviews || 0) + 
                   (product.sellerNegativeReviews || product.sellerInfo?.negativeReviews || 0),
      avatar: `https://i.pravatar.cc/150?img=${product.sellerId || 1}`,
    },
    currentBidder: product.highestBidderMasked ? {
      name: product.highestBidderMasked,
      bidCount: 0, // This would need to come from API
    } : null,
    postedTime: product.createdAt ? new Date(parseInt(product.createdAt)) : new Date(),
    endTime: product.endsAt ? new Date(parseInt(product.endsAt)) : new Date(),
    status: product.status || 'ACTIVE',
    category: {
      id: product.categoryId,
      name: product.categoryName || 'Uncategorized',
    },
    bidCount: product.bidsCount || 0,
    watchCount: product.viewsCount || 0,
  };

  return (
    <Page title={`${productData.title} - Product Detail`}>
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                {product.category && (
                  <Link
                    component="button"
                    variant="body1"
                    onClick={() => navigate(`/category/${product.category.id}`)}
=======
                {productData.category && (
                  <Link
                    component="button"
                    variant="body1"
                    onClick={() => navigate(`/category/${productData.category.id}`)}
>>>>>>> 4908400446e374216968da11da063a748a693559
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
<<<<<<< HEAD
                    {product.category.name}
                  </Link>
                )}
                <Typography variant="body1" color="text.primary" fontWeight={600}>
                  {product.title}
=======
                    {productData.category.name}
                  </Link>
                )}
                <Typography variant="body1" color="text.primary" fontWeight={600}>
                  {productData.title}
>>>>>>> 4908400446e374216968da11da063a748a693559
                </Typography>
              </Breadcrumbs>
            </CardContent>
          </Card>

<<<<<<< HEAD
          <div style={{ display: "flex", gap: 10 }}>
            {/* Left Column - Images */}
            <Card
              elevation={0}
              sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
=======
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            {/* Left Column - Images */}
            <Card
              elevation={0}
              sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", width: "60%", display: "flex", flexDirection: "column" }}
>>>>>>> 4908400446e374216968da11da063a748a693559
            >
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  image={allImages[selectedImage] || "/placeholder-image.jpg"}
<<<<<<< HEAD
                  alt={product.title}
                  sx={{
                    width: "100%",
                    height: { xs: 300, md: 500 },
                    objectFit: "contain",
                    bgcolor: "grey.100",
                  }}
                />
=======
                  alt={productData.title}
                    sx={{
                      width: "100%",
                      height: { xs: 300, md: 500 },
                      objectFit: "contain",
                      bgcolor: "grey.100",
                    }}
                  />
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {/* Title and Status */}
                <Card
                  elevation={0}
                  sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                >
                  <CardContent>
=======
            <div style={{ width: "40%", display: "flex", flexDirection: "column" }}>
              <Stack spacing={3} sx={{ flex: 1, height: "100%" }}>
                {/* Title and Status */}
                <Card
                  elevation={0}
                  sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", height: "100%", display: "flex", flexDirection: "column" }}
                >
                  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
>>>>>>> 4908400446e374216968da11da063a748a693559
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
<<<<<<< HEAD
                          {product.title}
                        </Typography>
                        <Chip
                          label={product.status}
                          color={product.status === "ACTIVE" ? "success" : "default"}
=======
                          {productData.title}
                        </Typography>
                        <Chip
                          label={productData.status}
                          color={productData.status === "ACTIVE" ? "success" : "default"}
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                        {formatPrice(product.currentPrice)}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Starting: {formatPrice(product.startingPrice)}
                        </Typography>
                        {product.buyNowPrice && (
                          <Typography variant="body2" color="text.secondary">
                            Buy Now: {formatPrice(product.buyNowPrice)}
=======
                        {formatPrice(productData.currentPrice)}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Starting: {formatPrice(productData.startingPrice)}
                        </Typography>
                        {productData.buyNowPrice && (
                          <Typography variant="body2" color="text.secondary">
                            Buy Now: {formatPrice(productData.buyNowPrice)}
>>>>>>> 4908400446e374216968da11da063a748a693559
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* Time Left */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime fontSize="small" />
                        <Typography variant="body1" fontWeight="medium">
<<<<<<< HEAD
                          Time Left: {getTimeLeft(product.endTime)}
=======
                          Time Left: {getTimeLeft(productData.endTime)}
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                          {product.bidCount}
=======
                          {productData.bidCount}
>>>>>>> 4908400446e374216968da11da063a748a693559
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Watchers
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
<<<<<<< HEAD
                          {product.watchCount}
=======
                          {productData.watchCount}
>>>>>>> 4908400446e374216968da11da063a748a693559
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Bid Increment
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
<<<<<<< HEAD
                          {formatPrice(product.bidIncrement)}
=======
                          {formatPrice(productData.bidIncrement)}
>>>>>>> 4908400446e374216968da11da063a748a693559
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Current Bidder (if has bids) */}
<<<<<<< HEAD
                    {hasStartedBidding && product.currentBidder && (
=======
                    {hasStartedBidding && productData.currentBidder && (
>>>>>>> 4908400446e374216968da11da063a748a693559
                      <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current Highest Bidder
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
<<<<<<< HEAD
                          {product.currentBidder.name}
                          {product.currentBidder.bidCount > 0 && ` (${product.currentBidder.bidCount} bids)`}
=======
                          {productData.currentBidder.name}
                          {productData.currentBidder.bidCount > 0 && ` (${productData.currentBidder.bidCount} bids)`}
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                        {product.buyNowPrice && (
=======
                        {productData.buyNowPrice && (
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                      onClick={() => navigate(`/seller/${product.seller.id}`)}
=======
                      onClick={() => navigate(`/seller/${productData.seller.id}`)}
>>>>>>> 4908400446e374216968da11da063a748a693559
                      sx={{ cursor: "pointer" }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
<<<<<<< HEAD
                          src={product.seller.avatar}
=======
                          src={productData.seller.avatar}
>>>>>>> 4908400446e374216968da11da063a748a693559
                          sx={{ width: 56, height: 56 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="medium">
<<<<<<< HEAD
                            {product.seller.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Rating
                              value={product.seller.rating}
=======
                            {productData.seller.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Rating
                              value={productData.seller.rating}
>>>>>>> 4908400446e374216968da11da063a748a693559
                              precision={0.1}
                              size="small"
                              readOnly
                            />
                            <Typography variant="body2" color="text.secondary">
<<<<<<< HEAD
                              {product.seller.rating.toFixed(1)} ({product.seller.ratingCount}{" "}
=======
                              {productData.seller.rating.toFixed(1)} ({productData.seller.ratingCount}{" "}
>>>>>>> 4908400446e374216968da11da063a748a693559
                              reviews)
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
<<<<<<< HEAD
            </Grid>
=======
            </div>
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                                      src={product.seller.avatar}
                                      sx={{ width: 24, height: 24 }}
                                    />
                                    <Typography variant="subtitle2" fontWeight="medium">
                                      {product.seller.name} (Seller)
=======
                                      src={productData.seller.avatar}
                                      sx={{ width: 24, height: 24 }}
                                    />
                                    <Typography variant="subtitle2" fontWeight="medium">
                                      {productData.seller.name} (Seller)
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                  Current highest bid: <strong>{formatPrice(product.currentPrice)}</strong>
                  <br />
                  Minimum bid:{" "}
                  <strong>
                    {formatPrice(product.currentPrice + product.bidIncrement)}
=======
                  Current highest bid: <strong>{formatPrice(productData.currentPrice)}</strong>
                  <br />
                  Minimum bid:{" "}
                  <strong>
                    {formatPrice(productData.currentPrice + productData.bidIncrement)}
>>>>>>> 4908400446e374216968da11da063a748a693559
                  </strong>
                </Alert>
                <TextField
                  label="Your Bid Amount"
                  type="number"
                  fullWidth
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
<<<<<<< HEAD
                  helperText={`Bid increment: ${formatPrice(product.bidIncrement)}`}
=======
                  helperText={`Bid increment: ${formatPrice(productData.bidIncrement)}`}
>>>>>>> 4908400446e374216968da11da063a748a693559
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
<<<<<<< HEAD
                  Number(bidAmount) < product.currentPrice + product.bidIncrement
=======
                  Number(bidAmount) < productData.currentPrice + productData.bidIncrement
>>>>>>> 4908400446e374216968da11da063a748a693559
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
