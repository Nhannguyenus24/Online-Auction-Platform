import { Link as RouterLink } from "react-router-dom";
import Grid from "@mui/material/Grid";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Link,
  Chip,
  Divider,
  alpha,
} from "@mui/material";
import {
  Gavel,
  AccessTime,
  VerifiedUser,
  Security,
} from "@mui/icons-material";

const heroHighlights = [
  {
    icon: <Gavel fontSize="small" />,
    label: "Real-time bidding insights",
  },
  {
    icon: <AccessTime fontSize="small" />,
    label: "24/7 auction monitoring",
  },
  {
    icon: <VerifiedUser fontSize="small" />,
    label: "Bank-grade security",
  },
];

const AuthLayout = ({ title, subtitle, icon, footerLinks = [], children }) => (
  <Box
    sx={{
      minHeight: { xs: "100vh" },
      height: { md: "100vh" },
      background: "linear-gradient(135deg, #f8fbff 0%, #f2f4f7 100%)",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      px: { xs: 2, md: 6 },
      py: { xs: 4, md: 3 },
      overflow: { md: "hidden" },
    }}
  >
    <Grid
      container
      component={Paper}
      elevation={0}
      maxWidth="lg"
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 25px 70px rgba(15, 23, 42, 0.12)",
        height: { md: "100%" },
      }}
    >
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: { xs: "none", md: "flex" },
          position: "relative",
          background: "linear-gradient(135deg, #0d5c63 0%, #0b3d4a 100%)",
          color: "white",
          p: 6,
          overflow: { md: "hidden" },
        }}
      >
        <Stack spacing={4} justifyContent="space-between">
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
              Online Auction Platform
            </Typography>
            <Typography variant="h3" fontWeight={600}>
              Secure, fast, and transparent bidding experience
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Manage listings, monitor bids, and stay ahead with insights built
              for serious sellers and collectors.
            </Typography>
          </Stack>

          <Divider
            flexItem
            sx={{
              borderColor: alpha("#ffffff", 0.18),
            }}
          />

          <Stack spacing={2}>
            {heroHighlights.map((item) => (
              <Stack
                key={item.label}
                direction="row"
                alignItems="center"
                spacing={1.5}
              >
                <Chip
                  icon={item.icon}
                  size="small"
                  sx={{
                    backgroundColor: alpha("#ffffff", 1),
                    color: "white",
                  }}
                />
                <Typography variant="body1">{item.label}</Typography>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Security fontSize="large" />
            <Stack spacing={0}>
              <Typography variant="subtitle2">
                2FA & transaction monitoring
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Every session is protected with adaptive security checks.
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Grid>

      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          bgcolor: "background.default",
          p: { xs: 3, sm: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: { md: "hidden" },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            p: { xs: 0, sm: 1 },
            bgcolor: "transparent",
          }}
        >
          <Stack spacing={1} mb={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {icon}
              <Typography variant="overline" color="text.secondary">
                Access Portal
              </Typography>
            </Stack>
            <Typography variant="h5" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          {children}

          {!!footerLinks.length && (
            <Stack
              mt={2.5}
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
            >
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  underline="hover"
                  variant="body2"
                  color="primary"
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default AuthLayout;