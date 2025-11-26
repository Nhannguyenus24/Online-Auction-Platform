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
import { Gavel } from '@mui/icons-material';
import Page from '../components/Page';

const TermOfServicePage = () => {
  return (
    <Page title="Terms of Service - Online Auction Platform">
      <Box
        sx={{
          bgcolor: 'error.main',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={2}>
            <Gavel sx={{ fontSize: 48 }} />
          </Stack>
          <Typography variant="h3" fontWeight="bold" gutterBottom align="center">
            Terms of Service
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
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Welcome to Online Auction Platform. By accessing and using our services, 
              you agree to comply with and be bound by these Terms of Service. If you do not agree with 
              any part of these terms, please do not use the service.
            </Typography>
            <Alert severity="warning">
              Please read these terms carefully before using the service. 
              We may update the terms from time to time and you are responsible for reviewing them periodically.
            </Alert>
          </CardContent>
        </Card>

        {/* Account registration */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              2. Account Registration
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  2.1. Registration Requirements
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  To register an account, you must:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Be at least 18 years old or have guardian consent
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Provide accurate, complete and updated information
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Verify email through OTP code
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Complete reCaptcha verification
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Take responsibility for maintaining account security
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  2.2. Account Security
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  You are responsible for:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Keeping your password and login information confidential
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Notifying us immediately if you detect unauthorized access
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Taking responsibility for all activities that occur under your account
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Not sharing your account with others
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  2.3. Account Types
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  The system has 3 account types:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Bidder (Buyer):</strong> Can participate in auctions and place bids on products
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Seller:</strong> Can create auction sessions and sell products
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Admin:</strong> Manages the system, users and products
                    </Typography>
                  </li>
                </ul>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Buyers can request an upgrade to seller through the Profile feature, 
                  subject to Admin approval.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Bidding rules */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              3. Bidding Rules
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  3.1. Bidding Process
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Each bid must be higher than the current price by at least one bid increment
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Once a bid is placed, you cannot cancel it
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      You can use the automatic bidding feature with a maximum bid amount
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      The highest bidder when the auction ends will win
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Sellers have the right to reject bidders if there is a legitimate reason
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  3.2. Auto-extend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If the seller enables this feature, the auction will automatically extend 
                  if someone places a bid in the final minutes. This ensures all participants 
                  have a fair opportunity.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  3.3. Buy Now
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If a product has a "Buy Now" price, you can purchase it immediately at that price without waiting 
                  for the auction to end. When someone uses Buy Now, the auction will end immediately.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  3.4. Payment Commitment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When placing a bid, you commit to payment if you win the auction. Violating this commitment 
                  may result in:
                </Typography>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Receiving negative feedback from the seller
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Restricted bidding privileges
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Temporary or permanent account suspension
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Seller obligations */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              4. Seller Obligations
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  4.1. Listing Products
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Sellers must:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Provide accurate and truthful information about the product
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Upload at least 3 actual images of the product
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Fully describe the condition, origin, and material
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Not list products that violate the law or counterfeit goods
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Answer buyer questions in a timely manner
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  4.2. Managing Auction Sessions
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Cannot delete the auction after bids have been placed
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Can only append information to the description (append-only), cannot edit or delete
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Have the right to reject bidders with bad behavior
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Cannot change the starting price or bid increment after listing
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  4.3. Completing Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  After the auction is won, sellers must:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Confirm the order within 24 hours
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Pack and ship the item after receiving payment
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Provide tracking number for buyer to monitor
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Ensure the item shipped matches the description
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Support the buyer during the receiving process
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  4.4. Canceling Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sellers may only cancel transactions in special cases (product damaged, 
                  stolen, etc.). Unjustified cancellation will seriously affect reputation 
                  and may lead to account suspension.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              5. Payments and Service Fees
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  5.1. Payment Methods
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  The platform supports the following payment methods:
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      MoMo
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      ZaloPay
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      VNPay
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Stripe (international cards)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      PayPal
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  5.2. Service Fees
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Buyers:</strong>
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Free registration and participation in auctions
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Payment fees depend on the chosen payment gateway
                    </Typography>
                  </li>
                </ul>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 2 }}>
                  <strong>Sellers:</strong>
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Product listing fees: Free
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Success fees: 5% of the transaction value (deducted after order completion)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Withdrawal fees: Depending on the withdrawal method
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  5.3. Refunds
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refunds are only processed in the following cases:
                </Typography>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Seller cancels the transaction
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Product not as described and seller agrees to refund
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Payment system errors
                    </Typography>
                  </li>
                </ul>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Refund time: 5-10 business days depending on the payment method.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Prohibited activities */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              6. Prohibited Activities
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Users are not allowed to engage in the following activities:
            </Typography>

            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Serious violations may result in permanent account suspension and legal liability.
              </Typography>
            </Alert>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ❌ Fraud and Scamming
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Posting counterfeit, fake, or prohibited products
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Using images that do not belong to the actual product
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Misrepresenting the product
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Price manipulation or creating fake accounts to bid
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ❌ Vi phạm quy tắc đấu giá
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Đặt giá không có ý định mua (bid spamming)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Sử dụng nhiều tài khoản để thao túng giá
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Liên hệ người mua/bán ngoài hệ thống để giao dịch
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Từ chối thanh toán sau khi thắng đấu giá
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ❌ Lạm dụng hệ thống
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Tấn công, hack, hoặc phá hoại hệ thống
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Sử dụng bot, script tự động không được phép
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Spam, gửi nội dung quảng cáo không liên quan
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Thu thập dữ liệu người dùng trái phép
                    </Typography>
                  </li>
                </ul>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ❌ Nội dung không phù hợp
                </Typography>
                <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Nội dung khiêu dâm, bạo lực, phân biệt chủng tộc
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Xúc phạm, quấy rối người dùng khác
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      Vi phạm bản quyền, sở hữu trí tuệ
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Intellectual property */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              7. Intellectual Property Rights
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              All content on the platform, including design, logos, text, images, source code, 
              is owned by Online Auction Platform or its licensors. You are not allowed to:
            </Typography>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Copy, modify, or distribute content without permission
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Use our logos or trademarks without authorization
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Create derivative works from our platform
                </Typography>
              </li>
            </ul>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The content you upload (product descriptions, images, reviews) remains your property, 
              but you grant us the right to use, display, and distribute that content on the platform.
            </Typography>
          </CardContent>
        </Card>

        {/* Limitation of liability */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              8. Limitation of Liability
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Online Auction Platform provides a platform connecting buyers and sellers. We:
            </Typography>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Are not responsible for the quality or accuracy of the products listed for sale
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Do not guarantee successful completion of transactions between buyers and sellers
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Are not responsible for disputes between users (but will assist in resolution)
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Do not guarantee 100% service availability due to technical issues or maintenance
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Are not responsible for indirect or incidental damages arising from the use of the service
                </Typography>
              </li>
            </ul>
            <Alert severity="info" sx={{ mt: 2 }}>
              We encourage users to carefully inspect products and review sellers/buyers before making transactions.
            </Alert>
          </CardContent>
        </Card>

        {/* Dispute resolution */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              9. Dispute Resolution
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              In case of a dispute between the buyer and the seller:
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Step 1: Direct Contact
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Both parties should contact each other and try to resolve the issue directly through the chat feature on the platform.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Step 2: Request Support
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If the issue cannot be resolved, contact the customer support team. We will review 
                  and provide mediation support.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Step 3: Final Decision
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If the dispute cannot be resolved, the Admin's decision is final. 
                  Parties may pursue legal action if necessary.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              10. Termination
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              <strong>By you:</strong> You may delete your account at any time in the Settings section. 
              Personal data will be deleted according to the Privacy Policy, except for data required to be retained by law.
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              <strong>By us:</strong> We reserve the right to temporarily suspend or delete your account if:
            </Typography>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Violation of the Terms of Service
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Fraudulent or deceptive behavior
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Inactive account for more than 2 years
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  As required by law enforcement agencies
                </Typography>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Changes to terms */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              11. Changes to Terms
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              We reserve the right to change, modify, or update these Terms of Service at any time. 
              Significant changes will be notified via email or platform notification at least 
              7 days before they take effect.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your continued use of the service after changes take effect constitutes your acceptance of the new terms.
            </Typography>
          </CardContent>
        </Card>

        {/* Governing law */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              12. Applicable law
            </Typography>
            <Typography variant="body1" color="text.secondary">
              These Terms of Service are governed by and construed in accordance with the laws of Vietnam. 
              Any disputes arising will be resolved in the competent courts of Ho Chi Minh City.
            </Typography>
          </CardContent>
        </Card>

      </Container>
    </Page>
  );
};

export default TermOfServicePage;
