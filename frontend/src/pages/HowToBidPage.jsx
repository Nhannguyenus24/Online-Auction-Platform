import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import {
  ExpandMore,
  CheckCircle,
  Gavel,
  Favorite,
  History,
  ShoppingCart,
  AccountCircle,
  NotificationsActive,
  QuestionAnswer,
  TrendingUp,
  Warning,
  Info,
  ArrowForward,
} from "@mui/icons-material";
import Page from "../components/Page";

const HowToBidPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: "Create Account",
      description: "Register to participate in auctions",
      icon: <AccountCircle />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            To participate in auctions, you need to register with the following
            information:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Full name"
                secondary="This information will be used for transactions"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Valid email"
                secondary="Used to verify account via OTP and receive notifications"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Shipping address"
                secondary="Delivery address when you win an auction"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Secure password"
                secondary="Strong password to protect your account"
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Email verification:</strong> After registration, you will
            receive an OTP code via email to verify your account.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/auth/register")}
            sx={{ mt: 2 }}
          >
            Register now
          </Button>
        </Box>
      ),
    },
    {
      label: "Search Products",
      description: "Discover and find your favorite products",
      icon: <TrendingUp />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            There are many ways to find auction products:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔍 Search by name
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the search bar to find products by name. The system
                    supports full-text search without diacritics.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📂 Browse by category
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select categories from the menu to view products by group:
                    Electronics, Fashion, Collectibles...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⏰ Ending soon
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View top 5 products ending soon to not miss opportunities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔥 Most popular
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Products with the most bids and highest prices are getting
                    attention.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Smart filters:</strong> Use filters by price, time remaining
            to find suitable products.
          </Alert>
        </Box>
      ),
    },
    {
      label: "View Product Details",
      description: "Learn complete information about products",
      icon: <Info />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Product detail page provides complete information:
          </Typography>
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📷 Product images
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View main image and at least 3 additional images to evaluate the
                product.
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                💰 Price information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Current price:</strong> The highest current bid
                <br />• <strong>Buy now price:</strong> If available, you can
                buy immediately at this price
                <br />• <strong>Bid increment:</strong> Minimum increase for
                each bid
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                ⏱️ Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View posting time and end time of auction. Products with &lt; 3
                days remaining show relative time.
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                👤 Seller information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View seller information and ratings to ensure credibility.
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📊 Auction history
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track bid history (bidder information is partially hidden for
                privacy).
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                💬 Q&A
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View questions and answers or send new questions to the seller.
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                🔗 Related products
              </Typography>
              <Typography variant="body2" color="text.secondary">
                5 similar products in the same category for your reference.
              </Typography>
            </Paper>
          </Stack>
        </Box>
      ),
    },
    {
      label: "Watch List",
      description: "Track products of interest",
      icon: <Favorite />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Add products to your Watch List for easy tracking:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Favorite color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Click the Favorite button"
                secondary="On the product detail page, click the heart icon to save"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <NotificationsActive color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Receive notifications"
                secondary="Get notified when there are changes in price or end time"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <History color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Easy management"
                secondary="View all your favorite products in your Dashboard"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Note:</strong> You need to log in to use the watch list
            feature.
          </Alert>
        </Box>
      ),
    },
    {
      label: "Place Bid",
      description: "Participate in product auctions",
      icon: <Gavel />,
      content: (
        <Box>
          <Typography variant="body1" paragraph fontWeight="bold">
            Bidding process:
          </Typography>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: "50%",
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    1
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Enter bid amount
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The system will suggest valid bid amounts based on current
                      price and bid increment.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: "50%",
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    2
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Confirm bid
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review the bid amount and click confirm. You will receive
                      notification immediately.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: "50%",
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    3
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Track auction
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track in Dashboard or auction history to see status.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Bidding conditions:</strong>
            </Typography>
            <Typography variant="body2">
              • Account must have verified email
              <br />
              • Bid amount must be higher than current price by at least one bid
              increment
              <br />
              • Cannot bid on your own products
              <br />• Seller may reject bidders if there are violations
            </Typography>
          </Alert>

          <Alert severity="warning" icon={<Warning />} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Automatic bidding:</strong>
            </Typography>
            <Typography variant="body2">
              You can set a maximum bid amount, the system will automatically
              increase your bid when someone bids higher (within your maximum
              limit).
            </Typography>
          </Alert>
        </Box>
      ),
    },
    {
      label: "Win Auction",
      description: "Complete transaction",
      icon: <ShoppingCart />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            When you win an auction, follow these steps:
          </Typography>
          <Stepper orientation="vertical">
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">
                  Receive notification
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  You will receive an email notification about winning the
                  auction and payment instructions.
                </Typography>
              </StepContent>
            </Step>
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">
                  Payment
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Choose payment method:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip label="MoMo" color="primary" variant="outlined" />
                  <Chip label="ZaloPay" color="primary" variant="outlined" />
                  <Chip label="VNPay" color="primary" variant="outlined" />
                  <Chip label="Stripe" color="primary" variant="outlined" />
                  <Chip label="PayPal" color="primary" variant="outlined" />
                </Stack>
              </StepContent>
            </Step>
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">
                  Enter shipping address
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  Confirm or update your shipping address.
                </Typography>
              </StepContent>
            </Step>
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">
                  Receive goods
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  Seller will ship and provide tracking number. Track your order
                  in Dashboard.
                </Typography>
              </StepContent>
            </Step>
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight="bold">
                  Confirm and rate
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  After receiving goods, confirm receipt and leave a rating for
                  the seller.
                </Typography>
              </StepContent>
            </Step>
          </Stepper>

          <Alert severity="success" sx={{ mt: 3 }}>
            <strong>Support:</strong> You can chat directly with the seller
            throughout the transaction process.
          </Alert>
        </Box>
      ),
    },
  ];

  const faqs = [
    {
      question: "How do I know my bid was successful?",
      answer:
        'You will receive immediate notification on the system and via email. You can also check in the "Currently Bidding" section in your Dashboard.',
    },
    {
      question: "Can I cancel my bid?",
      answer:
        "No, after successfully placing a bid, you cannot cancel it. This is a rule to ensure fairness for all participants. Please consider carefully before bidding.",
    },
    {
      question: "What happens if someone bids higher than me?",
      answer:
        "You will receive a notification and can bid again if you wish. If you have set up automatic bidding, the system will automatically increase your bid within your maximum limit.",
    },
    {
      question: "Can I bid in the last minute?",
      answer:
        "Yes, you can bid anytime before the auction ends. However, some products have auto-extend feature if someone bids in the last minute.",
    },
    {
      question: "How do I contact the seller?",
      answer:
        "You can send questions in the Q&A section on the product page. After winning an auction, you can chat directly with the seller.",
    },
    {
      question: "Can I buy without bidding?",
      answer:
        'If the product has a "Buy Now" price, you can purchase immediately at that price without waiting for the auction to end.',
    },
  ];

  return (
    <Page title="How to Bid - Online Auction Platform">
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            align="center"
          >
            How to Bid
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
            Learn how to participate in auctions and win your favorite products
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Step-by-step guide */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Step-by-step bidding process
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Follow these 6 simple steps to start bidding
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} expanded>
                  <StepLabel
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: "pointer" }}
                    icon={step.icon}
                  >
                    <Typography variant="h6">{step.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ py: 2 }}>{step.content}</Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Quick tips */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              💡 Tips for successful bidding
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 3, // khoảng cách giữa 2 cột
                mt: 2,
                flexDirection: { xs: "column", md: "row" }, // responsive: mobile 1 cột, desktop 2 cột
              }}
            >
              {/* Do's Column */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "success.lighter",
                  flex: 1, // chiếm đều 50% width
                  height: "100%",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  gutterBottom
                  color="success.dark"
                >
                  ✅ Do's
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• Research product thoroughly before bidding" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Set maximum amount you're willing to pay" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Check seller's ratings" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Read description and terms carefully" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Use automatic bidding for convenience" />
                  </ListItem>
                </List>
              </Paper>

              {/* Don'ts Column */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "error.lighter",
                  flex: 1, // chiếm đều 50% width
                  height: "100%",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  gutterBottom
                  color="error.dark"
                >
                  ❌ Don'ts
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• Bid beyond your financial capacity" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Make impulsive bids in the last minute" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Skip reading transaction terms" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Forget to check end time" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Violate auction rules" />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </CardContent>
        </Card>

        {/* CTA */}
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Ready to start?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Join today and discover thousands of auction products
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 3 }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/auth/register")}
            >
              Register now
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/")}
            >
              Explore products
            </Button>
          </Stack>
        </Box>
      </Container>
    </Page>
  );
};

export default HowToBidPage;
