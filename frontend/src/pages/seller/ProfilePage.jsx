import { Box, Typography, Container } from '@mui/material';

const SellerProfilePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Seller Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Profile page is under development.
        </Typography>
      </Box>
    </Container>
  );
};

export default SellerProfilePage;

