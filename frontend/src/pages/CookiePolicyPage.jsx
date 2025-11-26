import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { ExpandMore, Cookie } from '@mui/icons-material';
import Page from '../components/Page';

const CookiePolicyPage = () => {
  const cookieTypes = [
    {
      name: 'Essential Cookies',
      purpose: 'Allow you to navigate the website and use essential features',
      examples: [
        'Session login cookies',
        'User authentication cookies',
        'Security cookies',
      ],
      duration: 'Session or up to 30 days',
      canDisable: false,
    },
    {
      name: 'Functional Cookies',
      purpose: 'Remember your choices and provide personalized experience',
      examples: [
        'Preferred language',
        'Watchlist',
        'Theme settings',
      ],
      duration: 'Up to 1 year',
      canDisable: true,
    },
    {
      name: 'Analytics Cookies',
      purpose: 'Collect information about how you use the website to improve our service',
      examples: [
        'Google Analytics',
        'Visit statistics',
        'User behavior analysis',
      ],
      duration: 'Up to 2 years',
      canDisable: true,
    },
    {
      name: 'Advertising Cookies',
      purpose: 'Display advertisements that match your interests',
      examples: [
        'Ad tracking cookies',
        'Retargeting cookies',
        'Third-party advertising network cookies',
      ],
      duration: 'Up to 1 year',
      canDisable: true,
    },
  ];

  return (
    <Page title="Cookie Policy - Online Auction Platform">
      <Box
        sx={{
          bgcolor: 'warning.main',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={2}>
            <Cookie sx={{ fontSize: 48 }} />
          </Stack>
          <Typography variant="h3" fontWeight="bold" gutterBottom align="center">
            Cookie Policy
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
            Last updated: November 26, 2025
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Introduction */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              What are Cookies?
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Cookies are small text files stored on your device (computer, phone, tablet) 
              when you visit our website. Cookies help the website remember information about your visit, 
              making your next visit easier and the website more useful to you.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Online Auction Platform uses cookies to improve user experience, ensure security, 
              and provide customized features that suit your needs.
            </Typography>
          </CardContent>
        </Card>

        {/* Types of cookies */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Types of Cookies We Use
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              We use the following types of cookies on our platform:
            </Typography>
            <Stack spacing={3} sx={{ mt: 3 }}>
              {cookieTypes.map((type, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {type.name}
                      </Typography>
                      <Chip
                        label={type.canDisable ? 'Optional' : 'Required'}
                        color={type.canDisable ? 'default' : 'primary'}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Purpose:</strong> {type.purpose}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Examples:</strong>
                    </Typography>
                    <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                      {type.examples.map((example, i) => (
                        <li key={i}>
                          <Typography variant="body2" color="text.secondary">
                            {example}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Duration:</strong> {type.duration}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* How we use cookies */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              How We Use Cookies
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We use cookies for the following purposes:
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🔐 Authentication and Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cookies help us authenticate your identity and protect your account from unauthorized access. 
                  When you log in, cookies store session information so you don't have to log in again 
                  every time you navigate to a new page.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🎨 Personalized Experience
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cookies remember your preferences such as language, theme, and watchlist 
                  to provide the most suitable experience.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📊 Analysis and Improvement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We use analytics cookies to understand how users interact with the platform, 
                  thereby improving the interface and functionality. This data is collected in aggregate form and 
                  does not identify individuals.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🛒 Shopping Cart and Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cookies track products you've viewed, your watchlist, and auctions 
                  you're participating in to provide a seamless shopping experience.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📢 Advertising and Marketing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advertising cookies help us display ads that match your interests on 
                  our platform and partner websites. You can opt out of these cookies without affecting 
                  the main functionality of the website.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Third-party cookies */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Third-Party Cookies
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              In addition to our cookies, some third parties may also set cookies on your device 
              when you visit our website. These third parties include:
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • Google Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  To analyze traffic and user behavior
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • Payment Gateways
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  MoMo, ZaloPay, VNPay, Stripe, PayPal for secure payment processing
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • Social Networks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Facebook, Google, GitHub, Twitter for OAuth login functionality
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • Advertising Networks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advertising partners to display relevant ads
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Note:</strong> These third parties have their own cookie policies. 
              We recommend you review their policies to better understand how they use cookies.
            </Typography>
          </CardContent>
        </Card>

        {/* Managing cookies */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Managing Cookies
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              You have the right to control and manage cookies on your device:
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Browser Settings
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Most browsers allow you to:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      View stored cookies
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Delete existing cookies
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Block cookies from specific websites
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Block all third-party cookies
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Delete all cookies when closing the browser
                    </Typography>
                  </li>
                </ul>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Platform Settings
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  You can manage cookies directly on our platform through 
                  Settings {">"} Privacy {">"} Cookies. Here, you can enable/disable 
                  each type of cookie (except essential cookies).
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Consequences of Disabling Cookies
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  If you choose to disable or delete cookies, some features of the website 
                  may not work properly. For example:
                </Typography>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      You may need to log in again each time you visit
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Watchlist and shopping cart may be lost
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Personalization preferences will not be saved
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Some features may be limited or unavailable
                    </Typography>
                  </li>
                </ul>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Policy Updates
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We may update this Cookie Policy from time to time to reflect changes 
              in how we use cookies or for legal, operational, or regulatory reasons.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We encourage you to review this policy periodically to stay informed about 
              how we use cookies. The date of the last update is displayed at the top of this page.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default CookiePolicyPage;
