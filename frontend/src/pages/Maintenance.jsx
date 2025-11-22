import { Box, Container, Typography, Chip, Stack, Card } from "@mui/material";
import { motion } from "framer-motion";
import BuildIcon from "@mui/icons-material/Build";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import UpdateIcon from "@mui/icons-material/Update";
import Page from "../components/Page";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function Maintenance() {
  const maintenanceUpdates = [
    {
      icon: <UpdateIcon sx={{ color: "primary.main" }} />,
      title: "System Upgrade",
      description: "Upgrading to latest server infrastructure",
      status: "In Progress",
    },
    {
      icon: <UpdateIcon sx={{ color: "primary.main" }} />,
      title: "Security Updates",
      description: "Applying latest security patches",
      status: "In Progress",
    },
  ];

  return (
    <Page title="Under Maintenance">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          bgcolor: "background.default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            background: `
            radial-gradient(circle at 20% 50%, currentColor 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, currentColor 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, currentColor 0%, transparent 50%)
          `,
            color: "primary.main",
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              py: 5,
            }}
          >
            {/* Animated Icon */}
            <MotionBox
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              sx={{ mb: 3 }}
            >
              <Box
                sx={{
                  bgcolor: "primary.main",
                  borderRadius: "50%",
                  p: 3,
                  display: "inline-flex",
                  boxShadow: 3,
                }}
              >
                <BuildIcon sx={{ fontSize: 80, color: "white" }} />
              </Box>
            </MotionBox>

            {/* Main Content */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: "2rem", sm: "3rem", md: "3.5rem" },
                  color: "text.primary",
                }}
              >
                Under Maintenance
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 2, maxWidth: 600, mx: "auto", lineHeight: 1.8 }}
              >
                We're currently performing scheduled maintenance to improve your
                experience. We'll be back online shortly!
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                alignItems="center"
                sx={{ mb: 4 }}
              >
                <AccessTimeIcon sx={{ color: "primary.main" }} />
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Estimated downtime: 2-4 hours
                </Typography>
              </Stack>
            </MotionBox>

            {/* Maintenance Updates */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              sx={{ width: "100%", maxWidth: 700 }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                What We're Working On
              </Typography>

              <Stack spacing={2}>
                {maintenanceUpdates.map((update, index) => (
                  <MotionCard
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    sx={{
                      p: 2.5,
                      display: "flex",
                      alignItems: "center",
                      textAlign: "left",
                      transition: "transform 0.3s",
                      "&:hover": {
                        transform: "translateX(8px)",
                      },
                    }}
                  >
                    <Box sx={{ mr: 2, display: "flex" }}>{update.icon}</Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {update.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {update.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={update.status}
                      size="small"
                      color={"primary"}
                      variant={"outlined"}
                    />
                  </MotionCard>
                ))}
              </Stack>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              sx={{ mt: 6 }}
            >
              <Card
                sx={{
                  p: 3,
                  bgcolor: "primary.main",
                  color: "white",
                  maxWidth: 600,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Need Immediate Assistance?
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  If you have urgent concerns, please contact our support team:
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Email:
                    </Typography>
                    <Typography variant="body2">
                      ntnhan223@clc.fitus.edu.vn
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Phone:
                    </Typography>
                    <Typography variant="body2">+84 (888) 33-4107</Typography>
                  </Box>
                </Stack>
              </Card>
            </MotionBox>

            {/* Footer Note */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 4, fontStyle: "italic" }}
            >
              Thank you for your patience and understanding. We apologize for
              any inconvenience.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Page>
  );
}
