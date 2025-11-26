import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import { Security } from '@mui/icons-material';
import Page from '../components/Page';

const PrivacyPage = () => {
  return (
    <Page title="Privacy Policy - Online Auction Platform">
      <Box
        sx={{
          bgcolor: 'info.main',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={2}>
            <Security sx={{ fontSize: 48 }} />
          </Stack>
          <Typography variant="h3" fontWeight="bold" gutterBottom align="center">
            Privacy Policy
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
              Introduction
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Online Auction Platform is committed to protecting the privacy and personal information of our users. 
              This Privacy Policy explains how we collect, use, store, and protect 
              your personal information when you use our services.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              By using our platform, you agree to the terms described 
              in this policy. Please read carefully to understand your rights and responsibilities.
            </Typography>
          </CardContent>
        </Card>

        {/* Information we collect */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Information We Collect
            </Typography>
            
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  1. Information You Provide
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  When you register and use our services, you provide:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Account information:</strong> Full name, email, password, phone number
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Profile information:</strong> Profile picture, address, date of birth
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Transaction information:</strong> Payment information, shipping address
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>User-generated content:</strong> Product descriptions, questions, reviews, messages
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  2. Automatically Collected Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  When you use our platform, we automatically collect:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Device information:</strong> Device type, operating system, browser
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Usage data:</strong> Pages you visit, access times, content interactions
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Location information:</strong> IP address, timezone, language
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cookies and tracking technologies:</strong> See Cookie Policy
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  3. Information from Third Parties
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  If you log in via OAuth (Google, Facebook, GitHub, Twitter), 
                  we receive information from these platforms:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Name, email, profile picture
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      User ID from that platform
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Permissions you have granted to the application
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* How we use information */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              How We Use Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              We use your information for the following purposes:
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ✅ Provide and Improve Services
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Create and manage your account
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Process auction transactions and payments
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Provide customer support
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Improve user experience
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📧 Communication
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Send notifications about auction activities
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Respond to questions and support requests
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Send updates about services and policies
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Marketing and advertising (with your consent)
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🔒 Security and Fraud Prevention
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Authenticate user identity
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Detect and prevent fraud, spam
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Protect the rights of users and the platform
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Comply with legal obligations
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📊 Analysis and Research
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Analyze trends and user behavior
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Measure the effectiveness of features
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Research and develop new products
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Sharing information */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Sharing Information
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We do not sell your personal information. We only share information in the following cases:
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • With Other Users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Public information such as username, reviews, bidding history (anonymized) 
                  to create transparency in transactions.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • With Service Providers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Partners handling payments, shipping, data storage, and analytics 
                  (e.g., MoMo, VNPay, Google Analytics) to operate the service.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • For Legal Reasons
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When required by law, competent authorities, or to protect our legitimate rights 
                  and those of users.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  • In Case of Merger or Acquisition
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If the company is merged, acquired, or assets are sold, user information may 
                  be transferred as part of the transaction.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Data security */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Data Security
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We implement technical and organizational security measures to protect your information:
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🔐 Encryption
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All sensitive data is encrypted in transit (SSL/TLS) and at rest. 
                  Passwords are hashed using bcrypt/scrypt.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🛡️ Access Control
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only authorized staff have access to personal data, 
                  and they must comply with strict confidentiality obligations.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🔍 Monitoring and Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Continuous monitoring systems to detect and prevent unauthorized access, 
                  using technologies like Grafana and ELK stack.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  💾 Regular Backups
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data is backed up regularly to prevent data loss.
                </Typography>
              </Box>
            </Stack>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <strong>Important note:</strong> Although we make every effort to protect data, 
              no method of transmission or storage over the Internet is 100% secure. 
              Please protect your login information and notify us immediately if you detect 
              suspicious activity.
            </Alert>
          </CardContent>
        </Card>

        {/* User rights */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Your Rights
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              You have the following rights regarding your personal information:
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  👁️ Right to Access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have the right to view the personal information we store about you.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ✏️ Right to Edit
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can update or modify your personal information through your Profile page.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🗑️ Right to Delete
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can request deletion of your account and personal data (except data required by law).
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📤 Right to Data Portability
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have the right to request a copy of your personal data in a readable format.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🚫 Right to Object
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can opt out of marketing emails or restrict certain forms of data processing.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ⚖️ Right to Complain
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have the right to complain to the data protection authority if you believe your rights have been violated.
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              To exercise these rights, please contact us via email: 
              <strong> privacy@onlineauction.com</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Data retention */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Data Retention Period
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We only retain your personal information for as long as necessary to:
            </Typography>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Provide the services you request
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Comply with legal obligations (e.g., storing invoices, transactions)
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Resolve disputes and enforce agreements
                </Typography>
              </li>
            </ul>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              When no longer necessary, data will be securely deleted or anonymized.
            </Typography>
          </CardContent>
        </Card>

        {/* Children's privacy */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Children's Privacy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Our service is not intended for persons under 18 years of age. We do not knowingly collect 
              personal information from children under 18. If you are a parent and discover that your child has 
              provided information to us, please contact us to have that information deleted.
            </Typography>
          </CardContent>
        </Card>

        {/* Changes to policy */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Policy Changes
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We may update this Privacy Policy from time to time. We will notify 
              you of significant changes via email or notification on the platform.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your continued use of the service after changes take effect is considered acceptance 
              of the new policy. Please review periodically to stay informed of the latest information.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default PrivacyPage;
