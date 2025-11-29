import { Box, Typography, Container } from '@mui/material';

const BidderHomePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Bidder Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your bidder dashboard. This page is under development.
        </Typography>
      </Box>
    </Container>
  );
};

export default BidderHomePage;

