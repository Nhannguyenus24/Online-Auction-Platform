import { Box, Typography, Container } from '@mui/material';

const SellerHomePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Seller Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your seller dashboard. This page is under development.
        </Typography>
      </Box>
    </Container>
  );
};

export default SellerHomePage;

