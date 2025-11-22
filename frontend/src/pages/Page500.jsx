import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Page from "../components/Page";

export default function Page500() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Page title="500 Internal Server Error">
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            py: 5,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 120,
                color: "error.main",
                mb: 2,
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "4rem", sm: "6rem", md: "8rem" },
                fontWeight: 700,
                color: "error.main",
                mb: 2,
              }}
            >
              500
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              Internal Server Error
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                mb: 4,
                maxWidth: 500,
              }}
            >
              Oops! Something went wrong on our end. We're working to fix the
              issue. Please try refreshing the page or come back later. If the
              problem persists, please contact our support team.
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleRefresh}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/")}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Go to Home
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Page>
  );
}
