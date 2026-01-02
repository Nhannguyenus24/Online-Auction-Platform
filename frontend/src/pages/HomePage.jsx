import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  Chip,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  AccessTime,
  LocalOffer,
  TrendingUp,
  Gavel,
  ArrowForward,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import Page from "../components/Page";
import { formatPrice } from "../utils/formatNumber";
import { normalizeTimestamp } from "../utils/formatTime";
import { productApi } from "../services/productApi";
import { categoryApi } from "../services/categoryApi";

// Mock data for banners
const banners = [
  {
    id: 1,
    title: "Black Friday Auction",
    subtitle: "Exclusive deals up to 70% off",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
    backgroundColor: "#1a1a2e",
    textColor: "white",
  },
  {
    id: 2,
    title: "Luxury Watch Collection",
    subtitle: "Premium timepieces from top brands",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200",
    backgroundColor: "#0f4c75",
    textColor: "white",
  },
  {
    id: 3,
    title: "Tech Gadgets Auction",
    subtitle: "Latest electronics at unbeatable prices",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200",
    backgroundColor: "#2c3e50",
    textColor: "white",
  },
];

// Category icons mapping
const categoryIcons = {
  'Electronics': '💻',
  'Fashion': '👗',
  'Home & Living': '🏠',
  'Collectibles': '🎨',
  'Sports': '⚽',
  'Books': '📚',
  'Toys': '🎮',
  'Art': '🎨',
  'Jewelry': '💎',
  'Vehicles': '🚗',
};

// Category gradients
const categoryGradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
];

// Helper function to map API product to component format
const mapProductFromAPI = (apiProduct) => {
  // Find primary image or use first image
  const primaryImage = apiProduct.images?.find(img => img.isPrimary) || apiProduct.images?.[0];
  const imageUrl = primaryImage?.url || '/placeholder-image.jpg';
  
  return {
    id: apiProduct.id,
    title: apiProduct.title,
    image: imageUrl,
    currentPrice: apiProduct.currentPrice || 0,
    bidCount: apiProduct.bidsCount || 0,
    endTime: apiProduct.endsAt ? normalizeTimestamp(apiProduct.endsAt) : (apiProduct.timeRemaining ? normalizeTimestamp(apiProduct.timeRemaining) : null),
    condition: apiProduct.status === 'ended' ? 'Used' : 'New', // Default to 'New' for active products
  };
};

const HomePage = () => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Product states
  const [endingSoonProducts, setEndingSoonProducts] = useState([]);
  const [mostBidsProducts, setMostBidsProducts] = useState([]);
  const [highestPriceProducts, setHighestPriceProducts] = useState([]);
  
  // Category states
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    endingSoon: true,
    mostBids: true,
    highestPrice: true,
  });
  const [errors, setErrors] = useState({
    endingSoon: null,
    mostBids: null,
    highestPrice: null,
  });

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryApi.getCategories();
        if (response.success) {
          // Chỉ lấy 6 categories đầu tiên để hiển thị
          setCategories(response.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch top products from API
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        // Fetch all 3 APIs in parallel
        const [endingSoonRes, mostBidsRes, highestPriceRes] = await Promise.all([
          productApi.getTopEndingProducts(5).catch(err => ({ success: false, products: [], error: err })),
          productApi.getTopBidCountProducts(5).catch(err => ({ success: false, products: [], error: err })),
          productApi.getTopPriceProducts(5).catch(err => ({ success: false, products: [], error: err })),
        ]);

        // Process ending soon products
        if (endingSoonRes.success) {
          const mappedProducts = (endingSoonRes.products || []).map(mapProductFromAPI);
          setEndingSoonProducts(mappedProducts);
          setLoading(prev => ({ ...prev, endingSoon: false }));
          setErrors(prev => ({ ...prev, endingSoon: null }));
        } else {
          setEndingSoonProducts([]);
          setLoading(prev => ({ ...prev, endingSoon: false }));
          setErrors(prev => ({ ...prev, endingSoon: endingSoonRes.error?.message || 'Failed to load ending soon products' }));
        }

        // Process most bids products
        if (mostBidsRes.success) {
          const mappedProducts = (mostBidsRes.products || []).map(mapProductFromAPI);
          setMostBidsProducts(mappedProducts);
          setLoading(prev => ({ ...prev, mostBids: false }));
          setErrors(prev => ({ ...prev, mostBids: null }));
        } else {
          setMostBidsProducts([]);
          setLoading(prev => ({ ...prev, mostBids: false }));
          setErrors(prev => ({ ...prev, mostBids: mostBidsRes.error?.message || 'Failed to load most popular products' }));
        }

        // Process highest price products
        if (highestPriceRes.success) {
          const mappedProducts = (highestPriceRes.products || []).map(mapProductFromAPI);
          setHighestPriceProducts(mappedProducts);
          setLoading(prev => ({ ...prev, highestPrice: false }));
          setErrors(prev => ({ ...prev, highestPrice: null }));
        } else {
          setHighestPriceProducts([]);
          setLoading(prev => ({ ...prev, highestPrice: false }));
          setErrors(prev => ({ ...prev, highestPrice: highestPriceRes.error?.message || 'Failed to load highest price products' }));
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
        setLoading({ endingSoon: false, mostBids: false, highestPrice: false });
        setErrors({
          endingSoon: 'Failed to load products',
          mostBids: 'Failed to load products',
          highestPrice: 'Failed to load products',
        });
      }
    };

    fetchTopProducts();
  }, []);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    if (!endTime) return "N/A";
    const end = normalizeTimestamp(endTime);
    const now = currentTime;
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Pad numbers with leading zeros for consistent width
    const pad = (num) => String(num).padStart(2, "0");

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
    if (hours > 0) return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    return `${pad(minutes)}m ${pad(seconds)}s`;
  };

  const handleNextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const ProductCard = ({ product }) => (
    <Card
      elevation={0}
      sx={{
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        overflow: "hidden",
        transition: "all 0.3s",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transform: "translateY(-4px)",
          borderColor: "primary.main",
        },
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <Box sx={{ position: "relative", paddingTop: "75%", bgcolor: "grey.50" }}>
        <CardMedia
          component="img"
          image={product.image}
          alt={product.title}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            bgcolor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
            boxShadow: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <LocalOffer sx={{ fontSize: 14, color: "primary.main" }} />
          <Typography variant="caption" fontWeight="bold" color="primary">
            {product.bidCount} bids
          </Typography>
        </Box>
        <Chip
          label={product.condition}
          size="small"
          color={product.condition === "New" ? "success" : "default"}
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            fontWeight: "bold",
            fontSize: "0.7rem",
          }}
        />
      </Box>
      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2 }}
      >
        <Typography
          variant="body1"
          gutterBottom
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: 48,
            fontWeight: 600,
            lineHeight: 1.4,
            mb: 2,
          }}
        >
          {product.title}
        </Typography>
        <Box sx={{ mt: "auto" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Bid
          </Typography>
          <Typography
            variant="h6"
            color="primary"
            fontWeight="bold"
            sx={{ mb: 1.5 }}
          >
            {formatPrice(product.currentPrice)}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              pt: 1.5,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <AccessTime sx={{ fontSize: 16, color: "error.main" }} />
            <Typography variant="caption" color="error.main" fontWeight="bold">
              {getTimeLeft(product.endTime)} left
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Page title="Home - Online Auction Platform">
      <Box sx={{ bgcolor: "grey.50", minHeight: "100vh" }}>
        {/* Hero Banner Carousel */}
        <Box
          sx={{
            position: "relative",
            bgcolor: banners[currentBanner].backgroundColor,
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                height: { xs: 300, md: 450 },
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <Box
                component="img"
                src={banners[currentBanner].image}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  color: banners[currentBanner].textColor,
                  py: 4,
                }}
              >
                <Typography
                  variant="h2"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ fontSize: { xs: "2rem", md: "3.5rem" } }}
                >
                  {banners[currentBanner].title}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontSize: { xs: "1rem", md: "1.5rem" },
                  }}
                >
                  {banners[currentBanner].subtitle}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate("/category/electronics/watches")}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                >
                  Start Bidding
                </Button>
              </Box>

              {/* Banner Indicators */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
              >
                {banners.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    sx={{
                      width: currentBanner === index ? 40 : 12,
                      height: 12,
                      borderRadius: 6,
                      bgcolor:
                        currentBanner === index
                          ? "white"
                          : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* Featured Categories */}
        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Browse Categories
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explore our diverse auction categories
            </Typography>
          </Box>
          
          {categoriesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                width: "100%",
              }}
            >
              {categories.map((category, index) => (
                <Box
                  key={category.id}
                  sx={{
                    flex: {
                      xs: "1 1 100%",
                      sm: "1 1 calc(50% - 12px)",
                      md: "1 1 calc(20%)",
                    },
                    height: 200,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 3,
                    transition: "all 0.3s",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                    },
                  }}
                  onClick={() => navigate(`/category/${category.id}`)}
                >
                  {/* Gradient overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      background: categoryGradients[index % categoryGradients.length],
                      opacity: 0.9,
                    }}
                  />

                  {/* Card content */}
                  <CardContent
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "white",
                    }}
                  >
                    <Typography variant="h2" sx={{ mb: 1.5 }}>
                      {categoryIcons[category.name] || '📦'}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {category.name}
                    </Typography>
                  </CardContent>
                </Box>
              ))}
            </Box>
          )}
        </Container>

        {/* Ending Soon Products */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AccessTime sx={{ fontSize: 32, color: "error.main" }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Ending Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Don't miss out on these auctions
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/category/electronics/watches")}
              sx={{ fontWeight: "bold" }}
            >
              View All
            </Button>
          </Box>
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f5f5f5",
                      borderBottom: "2px solid #e0e0e0",
                    }}
                  >
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Condition
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Current Bid
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Bids
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Time Left
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading.endingSoon ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                        <CircularProgress />
                      </td>
                    </tr>
                  ) : errors.endingSoon ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '20px' }}>
                        <Alert severity="error">{errors.endingSoon}</Alert>
                      </td>
                    </tr>
                  ) : endingSoonProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                        <Typography color="text.secondary">No products available</Typography>
                      </td>
                    </tr>
                  ) : (
                    endingSoonProducts.map((product, index) => (
                    <tr
                      key={`ending-soon-${product.id}-${index}`}
                      style={{
                        borderBottom:
                          index < endingSoonProducts.length - 1
                            ? "1px solid #e0e0e0"
                            : "none",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f9f9f9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <td style={{ padding: "16px" }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.title}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "grey.200",
                            }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ maxWidth: 300 }}
                          >
                            {product.title}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <Chip
                          label={product.condition}
                          size="small"
                          color={
                            product.condition === "New" ? "success" : "default"
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="primary"
                        >
                          {formatPrice(product.currentPrice)}
                        </Typography>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <LocalOffer
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {product.bidCount}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <AccessTime
                            sx={{ fontSize: 16, color: "error.main" }}
                          />
                          <Typography
                            variant="body2"
                            color="error.main"
                            fontWeight={600}
                            sx={{
                              minWidth: "85px",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {getTimeLeft(product.endTime)}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={getTimeLeft(product.endTime) === "Ended"}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product.id}`);
                          }}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          {getTimeLeft(product.endTime) === "Ended" ? "Ended" : "Bid Now"}
                        </Button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </Box>
          </Box>
        </Container>

        {/* Most Bids Products */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Gavel sx={{ fontSize: 32, color: "primary.main" }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Most Popular
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trending auctions with the most bids
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/category/electronics/smartphones")}
              sx={{ fontWeight: "bold" }}
            >
              View All
            </Button>
          </Box>
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f5f5f5",
                      borderBottom: "2px solid #e0e0e0",
                    }}
                  >
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Condition
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Current Bid
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Bids
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Time Left
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#666",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading.mostBids ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                        <CircularProgress />
                      </td>
                    </tr>
                  ) : errors.mostBids ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '20px' }}>
                        <Alert severity="error">{errors.mostBids}</Alert>
                      </td>
                    </tr>
                  ) : mostBidsProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                        <Typography color="text.secondary">No products available</Typography>
                      </td>
                    </tr>
                  ) : (
                    mostBidsProducts.map((product, index) => (
                    <tr
                      key={`most-bids-${product.id}-${index}`}
                      style={{
                        borderBottom:
                          index < mostBidsProducts.length - 1
                            ? "1px solid #e0e0e0"
                            : "none",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f9f9f9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <td style={{ padding: "16px" }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.title}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "grey.200",
                            }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ maxWidth: 300 }}
                          >
                            {product.title}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <Chip
                          label={product.condition}
                          size="small"
                          color={
                            product.condition === "New" ? "success" : "default"
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="primary"
                        >
                          {formatPrice(product.currentPrice)}
                        </Typography>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <LocalOffer
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {product.bidCount}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <AccessTime
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{
                              minWidth: "85px",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {getTimeLeft(product.endTime)}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={getTimeLeft(product.endTime) === "Ended"}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product.id}`);
                          }}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          {getTimeLeft(product.endTime) === "Ended" ? "Ended" : "Bid Now"}
                        </Button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Box>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default HomePage;
