import { Box, Container, Grid, Typography, Link, Stack, Divider, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  YouTube,
  Email,
  Phone,
  LocationOn,
  Gavel,
} from '@mui/icons-material';

const Footer = () => {
  const navigate = useNavigate();

  const footerLinks = {
    company: [
      { label: 'About Us', path: '/about-us' },
      { label: 'Careers', path: '/careers' },
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'How to Bid', path: '/how-to-bid' },
      { label: 'Seller Guide', path: '/seller-guide' },
    ],
    policies: [
      { label: 'Terms of Service', path: '/terms-of-service' },
      { label: 'Privacy Policy', path: '/privacy-policy' },
      { label: 'Cookie Policy', path: '/cookie-policy' },
    ],
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        pt: 6,
        pb: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Gavel sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h5" fontWeight="bold">
                Auction Platform
              </Typography>
            </Box>
            <Typography variant="body2" color="grey.400" sx={{ mb: 3, lineHeight: 1.8 }}>
              Vietnam's leading online auction platform. Connecting bidders and sellers 
              with thousands of high-quality products every day.
            </Typography>
            
            {/* Contact Info */}
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Email sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" color="grey.400">
                  nhannguyentrong355@gmail.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Phone sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" color="grey.400">
                  0888334107 (8:00 - 18:00)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOn sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" color="grey.400">
                  237 Nguyen Van Cu, District 5, Ho Chi Minh City
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Company */}
              <Grid item xs={6} sm={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Company
                </Typography>
                <Stack spacing={1.5}>
                  {footerLinks.company.map((link) => (
                    <Link
                      key={link.path}
                      component="button"
                      variant="body2"
                      onClick={() => navigate(link.path)}
                      sx={{
                        color: 'grey.400',
                        textDecoration: 'none',
                        textAlign: 'left',
                        '&:hover': {
                          color: 'primary.main',
                        },
                        transition: 'color 0.2s',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Support */}
              <Grid item xs={6} sm={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Support
                </Typography>
                <Stack spacing={1.5}>
                  {footerLinks.support.map((link) => (
                    <Link
                      key={link.path}
                      component="button"
                      variant="body2"
                      onClick={() => navigate(link.path)}
                      sx={{
                        color: 'grey.400',
                        textDecoration: 'none',
                        textAlign: 'left',
                        '&:hover': {
                          color: 'primary.main',
                        },
                        transition: 'color 0.2s',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Policies */}
              <Grid item xs={6} sm={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Policies
                </Typography>
                <Stack spacing={1.5}>
                  {footerLinks.policies.map((link) => (
                    <Link
                      key={link.path}
                      component="button"
                      variant="body2"
                      onClick={() => navigate(link.path)}
                      sx={{
                        color: 'grey.400',
                        textDecoration: 'none',
                        textAlign: 'left',
                        '&:hover': {
                          color: 'primary.main',
                        },
                        transition: 'color 0.2s',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: 'grey.800' }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Copyright */}
          <Typography variant="body2" color="grey.500">
            © {new Date().getFullYear()} Auction Platform. All rights reserved.
          </Typography>

          {/* Social Media */}
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              sx={{
                color: 'grey.400',
                '&:hover': {
                  color: '#1877f2',
                  bgcolor: 'rgba(24, 119, 242, 0.1)',
                },
              }}
              aria-label="Facebook"
            >
              <Facebook />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: 'grey.400',
                '&:hover': {
                  color: '#1da1f2',
                  bgcolor: 'rgba(29, 161, 242, 0.1)',
                },
              }}
              aria-label="Twitter"
            >
              <Twitter />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: 'grey.400',
                '&:hover': {
                  color: '#e4405f',
                  bgcolor: 'rgba(228, 64, 95, 0.1)',
                },
              }}
              aria-label="Instagram"
            >
              <Instagram />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: 'grey.400',
                '&:hover': {
                  color: '#0077b5',
                  bgcolor: 'rgba(0, 119, 181, 0.1)',
                },
              }}
              aria-label="LinkedIn"
            >
              <LinkedIn />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: 'grey.400',
                '&:hover': {
                  color: '#ff0000',
                  bgcolor: 'rgba(255, 0, 0, 0.1)',
                },
              }}
              aria-label="YouTube"
            >
              <YouTube />
            </IconButton>
          </Stack>
        </Box>

      </Container>
    </Box>
  );
};

export default Footer;
