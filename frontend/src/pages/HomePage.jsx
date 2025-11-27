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

// Mock data for featured categories
const featuredCategories = [
  {
    id: "electronics",
    name: "Electronics",
    icon: "💻",
    itemCount: 234,
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: "👗",
    itemCount: 456,
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    id: "home",
    name: "Home & Living",
    icon: "🏠",
    itemCount: 189,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    id: "collectibles",
    name: "Collectibles",
    icon: "🎨",
    itemCount: 312,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
];

// Mock products data
const mockEndingSoonProducts = [
  {
    id: 1,
    title: "Luxury Swiss Automatic Watch - Rose Gold",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
    currentPrice: 25000000,
    bidCount: 23,
    endTime: "2025-11-26T18:30:00",
    condition: "New",
  },
  {
    id: 2,
    title: 'MacBook Pro 16" M3 Max - Space Gray',
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    currentPrice: 65000000,
    bidCount: 38,
    endTime: "2025-11-26T20:00:00",
    condition: "New",
  },
  {
    id: 3,
    title: "Vintage Leather Handbag - Designer",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
    currentPrice: 8500000,
    bidCount: 15,
    endTime: "2025-11-26T22:00:00",
    condition: "Used",
  },
  {
    id: 4,
    title: "Gaming Chair RGB - Ergonomic",
    image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400",
    currentPrice: 4200000,
    bidCount: 12,
    endTime: "2025-11-27T08:00:00",
    condition: "New",
  },
  {
    id: 5,
    title: "Canon EOS R5 Camera Body",
    image: "https://images.unsplash.com/photo-1606980707269-0f0e0a0b6aa3?w=400",
    currentPrice: 42000000,
    bidCount: 31,
    endTime: "2025-11-27T10:00:00",
    condition: "New",
  },
];

const mockMostBidsProducts = [
  {
    id: 6,
    title: "iPhone 15 Pro Max 256GB - Titanium",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400",
    currentPrice: 28000000,
    bidCount: 87,
    endTime: "2025-11-28T15:00:00",
    condition: "New",
  },
  {
    id: 7,
    title: "Sony PlayStation 5 Bundle",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400",
    currentPrice: 15000000,
    bidCount: 64,
    endTime: "2025-11-29T12:00:00",
    condition: "New",
  },
  {
    id: 8,
    title: "Rolex Submariner - Black Dial",
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400",
    currentPrice: 180000000,
    bidCount: 56,
    endTime: "2025-11-28T18:00:00",
    condition: "Used",
  },
  {
    id: 9,
    title: "Designer Sneakers Limited Edition",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    currentPrice: 12000000,
    bidCount: 52,
    endTime: "2025-11-30T16:00:00",
    condition: "New",
  },
  {
    id: 10,
    title: "Electric Scooter Pro Max",
    image: "https://images.unsplash.com/photo-1593436878396-ea3fbe0c170f?w=400",
    currentPrice: 9500000,
    bidCount: 48,
    endTime: "2025-11-29T14:00:00",
    condition: "New",
  },
];

const mockHighestPriceProducts = [
  {
    id: 11,
    title: "Rolex Submariner - Black Dial",
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400",
    currentPrice: 180000000,
    bidCount: 56,
    endTime: "2025-11-28T18:00:00",
    condition: "Used",
  },
  {
    id: 12,
    title: 'MacBook Pro 16" M3 Max - Space Gray',
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    currentPrice: 65000000,
    bidCount: 38,
    endTime: "2025-11-26T20:00:00",
    condition: "New",
  },
  {
    id: 13,
    title: "Gaming Laptop RTX 4090 - 32GB RAM",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
    currentPrice: 45000000,
    bidCount: 42,
    endTime: "2025-11-28T16:00:00",
    condition: "New",
  },
  {
    id: 14,
    title: "Canon EOS R5 Camera Body",
    image: "https://images.unsplash.com/photo-1606980707269-0f0e0a0b6aa3?w=400",
    currentPrice: 42000000,
    bidCount: 31,
    endTime: "2025-11-27T10:00:00",
    condition: "New",
  },
  {
    id: 15,
    title: "iPhone 15 Pro Max 256GB - Titanium",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400",
    currentPrice: 28000000,
    bidCount: 87,
    endTime: "2025-11-28T15:00:00",
    condition: "New",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate time left
  const getTimeLeft = (endTime) => {
    const end = new Date(endTime);
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
      onClick={() => navigate(`/products/${product.id}`)}
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
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3, // khoảng cách giữa các card
              width: "100%",
            }}
          >
            {featuredCategories.map((category) => (
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
                {/* Background image */}
                <Box
                  component="img"
                  src={category.image}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.2,
                  }}
                />

                {/* Gradient overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: category.gradient,
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
                    {category.icon}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {category.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {category.itemCount} items
                  </Typography>
                </CardContent>
              </Box>
            ))}
          </Box>
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
                  {mockEndingSoonProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom:
                          index < mockEndingSoonProducts.length - 1
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
                      onClick={() => navigate(`/products/${product.id}`)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.id}`);
                          }}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Bid Now
                        </Button>
                      </td>
                    </tr>
                  ))}
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
                  {mockMostBidsProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom:
                          index < mockMostBidsProducts.length - 1
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
                      onClick={() => navigate(`/products/${product.id}`)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.id}`);
                          }}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Bid Now
                        </Button>
                      </td>
                    </tr>
                  ))}
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
