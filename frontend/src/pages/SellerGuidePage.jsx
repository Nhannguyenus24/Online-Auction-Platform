import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ExpandMore,
  CheckCircle,
  Store,
  AddPhotoAlternate,
  Description,
  Settings,
  QuestionAnswer,
  Block,
  ShoppingCart,
  LocalShipping,
  Star,
  Chat,
  TrendingUp,
  Warning,
  Info,
  ArrowForward,
  Assignment,
  Edit,
  Visibility,
} from '@mui/icons-material';
import Page from '../components/Page';

const SellerGuidePage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Register as a Seller',
      description: 'Request account upgrade',
      icon: <Store />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            To become a seller on the platform, you need to:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Have a verified buyer account" 
                secondary="Bidder account with verified email"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Submit upgrade request" 
                secondary="Fill out the request form in your Profile section"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Wait for admin approval" 
                secondary="Admin will review and approve your request"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Receive confirmation notification" 
                secondary="You will receive an email when successfully upgraded"
              />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Note:</strong> Admin may take 1-3 business days to review your request. 
            Ensure your account information is complete and accurate to increase approval chances.
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/bidder/profile')}
            sx={{ mt: 2 }}
          >
            Submit Request Now
          </Button>
        </Box>
      ),
    },
    {
      label: 'Create Auction',
      description: 'List product on the system',
      icon: <Assignment />,
      content: (
        <Box>
          <Typography variant="body1" paragraph fontWeight="bold">
            Required information when creating an auction:
          </Typography>
          
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📝 Basic Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="• Product title" 
                    secondary="Short, concise name, easy to search"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="• Category" 
                    secondary="Choose appropriate category for the product"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="• Detailed description" 
                    secondary="Use WYSIWYG editor to create comprehensive description"
                  />
                </ListItem>
              </List>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📷 Images (≥ 3 photos)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Upload at least 3 high-quality images<br />
                • First image will be the main image<br />
                • Take photos from multiple angles for buyer assessment
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                💰 Pricing Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="• Starting Price" 
                    secondary="Initial price to start the auction"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="• Bid Increment" 
                    secondary="Minimum increase for each bid"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="• Buy Now Price - Optional" 
                    secondary="Buyer can purchase immediately at this price"
                  />
                </ListItem>
              </List>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                ⏰ Time Settings
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="• End time" 
                    secondary="Choose auction end date and time"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="• Auto-extend" 
                    secondary="Automatically extend if someone bids in final minutes"
                  />
                </ListItem>
              </List>
            </Paper>
          </Stack>

          <Alert severity="success" sx={{ mt: 3 }}>
            <strong>Tip:</strong> Products with beautiful images, detailed descriptions, and reasonable starting prices will attract more bidders.
          </Alert>
        </Box>
      ),
    },
    {
      label: 'Manage Auctions',
      description: 'Monitor and edit',
      icon: <Edit />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            After creating an auction, you can:
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Visibility color="primary" />
                    <Typography variant="h6">View List</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    • Active auctions<br />
                    • Ended auctions<br />
                    • Auctions with winners<br />
                    • Filter and sort by criteria
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Edit color="primary" />
                    <Typography variant="h6">Edit</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    • Add to description (append only, no deletion)<br />
                    • Update auto-extend settings<br />
                    • View statistics and bid history<br />
                    • Cannot edit price or delete after posting
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <QuestionAnswer color="primary" />
                    <Typography variant="h6">Answer Questions</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    • Buyers can ask questions<br />
                    • You receive email notifications<br />
                    • Quick response increases credibility<br />
                    • Questions/answers displayed publicly
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Block color="error" />
                    <Typography variant="h6">Block Bidders</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    • Right to block users with bad behavior<br />
                    • Blocked users cannot bid again<br />
                    • Use carefully with valid reasons<br />
                    • System logs this action
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <strong>Important:</strong> After someone places a bid, you cannot delete the auction. 
            Any description changes can only be additions (append-only) to ensure transparency.
          </Alert>
        </Box>
      ),
    },
    {
      label: 'End of auction',
      description: 'Determine Winner',
      icon: <TrendingUp />,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            When the auction ends:
          </Typography>

          <Timeline position="alternate">
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                Automation
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <CheckCircle />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" component="h1">
                    Determine Winner
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System automatically determines the highest bidder as the winner
                  </Typography>
                </Paper>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                Immediately
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <Chat />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" component="h1">
                    Notification
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Both you and the winner receive email notifications
                  </Typography>
                </Paper>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                Buyer
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="info">
                  <ShoppingCart />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" component="h1">
                    Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Winner completes payment through payment gateway
                  </Typography>
                </Paper>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                You
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="warning">
                  <LocalShipping />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h6" component="h1">
                    Delivery
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You prepare and ship the product to the buyer
                  </Typography>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          </Timeline>

          <Alert severity="info" sx={{ mt: 3 }}>
            You can chat directly with the winner to discuss delivery and payment details.
          </Alert>
        </Box>
      ),
    },
    {
      label: 'Manage Orders',
      description: 'Process transactions',
      icon: <ShoppingCart />,
      content: (
        <Box>
          <Typography variant="body1" paragraph fontWeight="bold">
            Seller responsibilities:
          </Typography>

          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    1
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Confirm Payment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verify and confirm receipt of payment from buyer
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
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    2
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Pack and Ship
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pack carefully and ship to the address provided by buyer
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
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    3
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Provide Tracking Number
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Update tracking code in the system for buyer to monitor
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
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    4
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Customer Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Answer questions and support buyer during delivery process
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
                      bgcolor: 'success.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    5
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Complete and Rate
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      After buyer confirms receipt, you can rate the buyer
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <strong>Cancel Transaction:</strong> In special cases, you can cancel the transaction. 
            However, this may affect your reputation. Consider carefully before cancelling.
          </Alert>
        </Box>
      ),
    },
  ];

  const bestPractices = [
    {
      title: 'High-Quality Images',
      description: 'Take clear photos from all angles with good lighting to attract buyers',
      icon: <AddPhotoAlternate />,
    },
    {
      title: 'Detailed and Honest Description',
      description: 'Provide complete information about the product, condition, and origin',
      icon: <Description />,
    },
    {
      title: 'Reasonable Starting Price',
      description: 'Set a starting price appropriate to the product value to attract bidders',
      icon: <TrendingUp />,
    },
    {
      title: 'Quick Response',
      description: 'Answer questions and process orders quickly to increase credibility',
      icon: <QuestionAnswer />,
    },
    {
      title: 'Careful Packaging',
      description: 'Ensure goods are safely packed for delivery',
      icon: <LocalShipping />,
    },
    {
      title: 'Professional Communication',
      description: 'Always be polite and professional with buyers',
      icon: <Chat />,
    },
  ];

  const faqs = [
    {
      question: 'Can I delete an auction after posting it?',
      answer: 'If no one has bid yet, you can delete it. However, after someone places a bid, you cannot delete it to ensure fairness.',
    },
    {
      question: 'What are the service fees for sellers?',
      answer: 'The platform charges a fee based on the % of successful transaction value. Please see details in the Terms of Service section.',
    },
    {
      question: 'What happens if the winner does not pay?',
      answer: 'You can report to admin. The buyer will be penalized for violation and you can offer to the second-highest bidder.',
    },
    {
      question: 'Can I edit the price after posting?',
      answer: 'No, starting price, bid increment, and buy now price cannot be changed after posting to ensure fairness.',
    },
    {
      question: 'How can I increase the chance of selling at a high price?',
      answer: 'Post during high-traffic times, use beautiful images, detailed descriptions, and set a reasonable starting price to attract many participants.',
    },
    {
      question: 'Can I sell multiple products at once?',
      answer: 'Yes, you can create multiple auctions simultaneously with no quantity limit.',
    },
  ];

  return (
    <Page title="Seller Guide - Online Auction Platform">
      <Box
        sx={{
          bgcolor: 'success.main',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" gutterBottom align="center">
            Seller Guide
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
            Everything you need to know to sell successfully on the platform
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Step-by-step guide */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Step-by-Step Selling Process
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Follow these 5 steps to start selling
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} expanded>
                  <StepLabel
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
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


        {/* Policies */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              📋 Policies and Regulations
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                What to Avoid:
              </Typography>
              <Typography variant="body2">
                ❌ Posting counterfeit or fake products<br />
                ❌ Using images not of the actual product<br />
                ❌ Dishonest description of product condition<br />
                ❌ Refusing delivery after confirmation<br />
                ❌ Requesting payment outside the system<br />
                ❌ Price manipulation or shill bidding
              </Typography>
            </Alert>
            <Alert severity="info">
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Violations may result in:
              </Typography>
              <Typography variant="body2">
                • Auction deletion<br />
                • Temporary or permanent account suspension<br />
                • Loss of selling privileges<br />
                • Legal liability if damages occur
              </Typography>
            </Alert>
          </CardContent>
        </Card>


        {/* CTA */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Ready to Start Selling?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Start your business on the leading auction platform
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              color="success"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/bidder/profile')}
            >
              Register to Sell
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/seller/create-auction')}
            >
              Create Auction
            </Button>
          </Stack>
        </Box>
      </Container>
    </Page>
  );
};

export default SellerGuidePage;
