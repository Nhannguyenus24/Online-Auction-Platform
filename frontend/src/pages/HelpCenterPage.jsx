import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Stack,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  Help,
  Search,
  ContactSupport,
  Email,
  Phone,
  QuestionAnswer,
  Gavel,
  ShoppingCart,
  AccountCircle,
  Payment,
  LocalShipping,
} from '@mui/icons-material';
import Page from '../components/Page';

const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const categories = [
    { label: 'All', icon: <Help />, value: 0 },
    { label: 'Account', icon: <AccountCircle />, value: 1 },
    { label: 'Auction', icon: <Gavel />, value: 2 },
    { label: 'Payment', icon: <Payment />, value: 3 },
    { label: 'Shipping', icon: <LocalShipping />, value: 4 },
  ];

  const faqs = {
    all: [
      {
        category: 'Account',
        question: 'How do I register an account?',
        answer: 'Click the "Register" button in the top right corner, fill in all information (full name, email, address, password). You will receive an OTP code via email to verify your account. After verification, you can log in and start using the service.',
      },
      {
        category: 'Account',
        question: 'I forgot my password, what should I do?',
        answer: 'Click "Forgot Password" on the login page, enter your registered email. You will receive an OTP code via email to reset your password. If you don\'t receive the email, check your spam folder or contact support.',
      },
      {
        category: 'Account',
        question: 'How do I become a seller?',
        answer: 'After having a verified buyer account, go to Profile and select "Request upgrade to Seller". Fill out the request form and wait for Admin approval (usually takes 1-3 business days). You will receive an email notification when approved.',
      },
      {
        category: 'Auction',
        question: 'How do I place a bid?',
        answer: 'Go to the product detail page, enter your bid amount (must be at least one bid increment higher than the current price), click "Place Bid" and confirm. You will receive an immediate notification. Note: Cannot cancel after placing a bid.',
      },
      {
        category: 'Auction',
        question: 'How does auto-bidding work?',
        answer: 'When placing a bid, you can select "Auto Bid" and enter your maximum bid amount. The system will automatically increase your bid (one increment at a time) when someone bids higher, within the maximum limit you set.',
      },
      {
        category: 'Auction',
        question: 'Can I cancel a placed bid?',
        answer: 'No, after successfully placing a bid, you cannot cancel it. This is a rule to ensure fairness. Please consider carefully before placing a bid.',
      },
      {
        category: 'Auction',
        question: 'How do I know if I won the auction?',
        answer: 'After the auction ends, if you are the highest bidder, you will receive an email notification and can view it in the "Won Orders" section in your Dashboard.',
      },
      {
        category: 'Payment',
        question: 'What payment methods are available?',
        answer: 'We support MoMo, ZaloPay, VNPay (for Vietnamese users) and Stripe, PayPal (for international payments). Choose the appropriate method when paying for your order.',
      },
      {
        category: 'Payment',
        question: 'Is online payment safe?',
        answer: 'Yes, all transactions are encrypted with SSL/TLS and processed through reputable payment gateways. We do not store your card information. All transactions are monitored to detect fraud.',
      },
      {
        category: 'Payment',
        question: 'I paid but didn\'t receive confirmation?',
        answer: 'Confirmation is usually sent immediately after successful payment. If you don\'t receive it, check the "Orders" section in your Dashboard or contact support with your transaction ID.',
      },
      {
        category: 'Shipping',
        question: 'How long does delivery take?',
        answer: 'Delivery time depends on the seller and shipping method. Usually 3-7 business days within the city and 7-14 days for remote provinces. You can track your order via the tracking number.',
      },
      {
        category: 'Shipping',
        question: 'What to do when received item doesn\'t match description?',
        answer: 'Contact the seller immediately via the chat feature to clarify. If unresolved, report to support within 48 hours of receiving the item. We will assist in mediation.',
      },
      {
        category: 'Shipping',
        question: 'Can I return items and get a refund?',
        answer: 'This depends on the agreement with the seller and their policy. If the product doesn\'t match the description or is damaged upon delivery, you have the right to request a return and refund. Contact support for assistance.',
      },
    ],
    account: [
      {
        question: 'How do I register an account?',
        answer: 'Click the "Register" button in the top right corner, fill in all information (full name, email, address, password). You will receive an OTP code via email to verify your account. After verification, you can log in and start using the service.',
      },
      {
        question: 'I forgot my password, what should I do?',
        answer: 'Click "Forgot Password" on the login page, enter your registered email. You will receive an OTP code via email to reset your password. If you don\'t receive the email, check your spam folder or contact support.',
      },
      {
        question: 'How do I become a seller?',
        answer: 'After having a verified buyer account, go to Profile and select "Request upgrade to Seller". Fill out the request form and wait for Admin approval (usually takes 1-3 business days). You will receive an email notification when approved.',
      },
      {
        question: 'Can I change my email?',
        answer: 'Yes, go to Profile > Settings > Change Email. You will need to verify both your old and new email via OTP code.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Profile > Settings > Delete Account. Note: You must complete or cancel all ongoing transactions before deletion. Data will be deleted according to the Privacy Policy.',
      },
      {
        question: 'My account is locked, what should I do?',
        answer: 'Check your email to see the reason for the lock. Usually due to terms violation or suspicious activity. Contact support for resolution.',
      },
    ],
    auction: [
      {
        question: 'How do I place a bid?',
        answer: 'Go to the product detail page, enter your bid amount (must be at least one bid increment higher than the current price), click "Place Bid" and confirm. You will receive an immediate notification. Note: Cannot cancel after placing a bid.',
      },
      {
        question: 'How does auto-bidding work?',
        answer: 'When placing a bid, you can select "Auto Bid" and enter your maximum bid amount. The system will automatically increase your bid (one increment at a time) when someone bids higher, within the maximum limit you set.',
      },
      {
        question: 'Can I cancel a placed bid?',
        answer: 'No, after successfully placing a bid, you cannot cancel it. This is a rule to ensure fairness. Please consider carefully before placing a bid.',
      },
      {
        question: 'How do I know if I won the auction?',
        answer: 'After the auction ends, if you are the highest bidder, you will receive an email notification and can view it in the "Won Orders" section in your Dashboard.',
      },
      {
        question: 'What is auto-extension?',
        answer: 'If the seller enables this feature, the auction will automatically extend by a few minutes if someone bids near the end time. This ensures everyone has a fair chance.',
      },
      {
        question: 'Why was I rejected by the seller?',
        answer: 'Sellers have the right to reject bidders for legitimate reasons (e.g., you have a history of non-payment). You can contact the seller or support for clarification.',
      },
    ],
    payment: [
      {
        question: 'What payment methods are available?',
        answer: 'We support MoMo, ZaloPay, VNPay (for Vietnamese users) and Stripe, PayPal (for international payments). Choose the appropriate method when paying for your order.',
      },
      {
        question: 'Is online payment safe?',
        answer: 'Yes, all transactions are encrypted with SSL/TLS and processed through reputable payment gateways. We do not store your card information. All transactions are monitored to detect fraud.',
      },
      {
        question: 'I paid but didn\'t receive confirmation?',
        answer: 'Confirmation is usually sent immediately after successful payment. If you don\'t receive it, check the "Orders" section in your Dashboard or contact support with your transaction ID.',
      },
      {
        question: 'What are the transaction fees?',
        answer: 'Buyers don\'t pay platform fees, only payment gateway fees (usually 1-3%). Sellers pay a 5% fee on successful order value.',
      },
      {
        question: 'How do I get a refund?',
        answer: 'Refunds only occur when the seller cancels the transaction or the product has issues and a refund is agreed upon. Refund time: 5-10 business days depending on payment method.',
      },
      {
        question: 'Can I save my card information?',
        answer: 'No, we do not store your card information for security reasons. You will need to re-enter it each time you make a payment or use a linked e-wallet.',
      },
    ],
    shipping: [
      {
        question: 'How long does delivery take?',
        answer: 'Delivery time depends on the seller and shipping method. Usually 3-7 business days within the city and 7-14 days for remote provinces. You can track your order via the tracking number.',
      },
      {
        question: 'What to do when received item doesn\'t match description?',
        answer: 'Contact the seller immediately via the chat feature to clarify. If unresolved, report to support within 48 hours of receiving the item. We will assist in mediation.',
      },
      {
        question: 'Can I return items and get a refund?',
        answer: 'This depends on the agreement with the seller and their policy. If the product doesn\'t match the description or is damaged upon delivery, you have the right to request a return and refund. Contact support for assistance.',
      },
      {
        question: 'How do I track my order?',
        answer: 'After the seller ships and provides a tracking number, you can view it in "Orders" > Order Details. Click on the tracking number to track on the shipping carrier\'s website.',
      },
      {
        question: 'Who pays for shipping?',
        answer: 'Usually the buyer pays shipping fees. However, some sellers may offer free shipping. Check the information on the product page or ask the seller before bidding.',
      },
      {
        question: 'Item was lost during shipping?',
        answer: 'Contact the seller and shipping carrier immediately. The seller is responsible for handling and ensuring the item reaches you. If unresolved, contact support.',
      },
    ],
  };

  const getCurrentFAQs = () => {
    switch (tabValue) {
      case 0:
        return faqs.all;
      case 1:
        return faqs.account;
      case 2:
        return faqs.auction;
      case 3:
        return faqs.payment;
      case 4:
        return faqs.shipping;
      default:
        return faqs.all;
    }
  };

  const filteredFAQs = getCurrentFAQs().filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Page title="Help Center - Online Auction Platform">
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={2}>
            <Help sx={{ fontSize: 48 }} />
          </Stack>
          <Typography variant="h3" fontWeight="bold" gutterBottom align="center">
            Help Center
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.9, mb: 4 }}>
            We're always here to help you
          </Typography>

          {/* Search box */}
          <Container maxWidth="md">
            <TextField
              fullWidth
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'white',
                  borderRadius: 2,
                },
              }}
            />
          </Container>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>

        {/* FAQ Categories */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              {categories.map((cat) => (
                <Tab
                  key={cat.value}
                  icon={cat.icon}
                  label={cat.label}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            <Box sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Frequently Asked Questions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {filteredFAQs.length} questions
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>

              {filteredFAQs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <QuestionAnswer sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No matching questions found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try searching with different keywords or contact support
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1} sx={{ mt: 3 }}>
                  {filteredFAQs.map((faq, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                          {faq.category && tabValue === 0 && (
                            <Chip label={faq.category} size="small" color="primary" variant="outlined" />
                          )}
                          <Typography variant="subtitle1" fontWeight="medium">
                            {faq.question}
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary">
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default HelpCenterPage;
