import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { Work, CheckCircle, LocationOn } from "@mui/icons-material";
import Page from "../components/Page";

const CareersPage = () => {
  const openPositions = [
    {
      title: "Senior Backend Developer (Java/Spring Boot)",
      department: "Engineering",
      location: "Ho Chi Minh City",
      type: "Full-time",
      salary: "25M - 40M VND",
      description:
        "Develop and optimize backend systems for the auction platform. Requirements: 3+ years experience with Java/Spring Boot, knowledge of microservices, database design.",
    },
    {
      title: "Frontend Developer (React/Vue)",
      department: "Engineering",
      location: "Ho Chi Minh City",
      type: "Full-time",
      salary: "18M - 30M VND",
      description:
        "Build responsive user interfaces and optimize UX. Requirements: 2+ years experience with React or Vue, Material UI, state management.",
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Ho Chi Minh City / Remote",
      type: "Full-time",
      salary: "22M - 35M VND",
      description:
        "Manage infrastructure, CI/CD, monitoring. Requirements: Experience with Docker, Kubernetes, AWS/GCP, Grafana/ELK.",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Ho Chi Minh City",
      type: "Full-time",
      salary: "25M - 40M VND",
      description:
        "Define product direction, analyze users, coordinate with engineering team. Requirements: 3+ years PM experience, understanding of marketplace/e-commerce.",
    },
    {
      title: "UI/UX Designer",
      department: "Design",
      location: "Ho Chi Minh City",
      type: "Full-time",
      salary: "15M - 25M VND",
      description:
        "Design interfaces, user research, create prototypes. Requirements: Impressive portfolio, proficient in Figma/Sketch, understanding of design systems.",
    },
    {
      title: "Marketing Executive",
      department: "Marketing",
      location: "Ho Chi Minh City",
      type: "Full-time",
      salary: "12M - 20M VND",
      description:
        "Plan and execute online marketing campaigns. Requirements: Digital marketing experience, SEO/SEM, content marketing.",
    },
    {
      title: "Customer Support Specialist",
      department: "Support",
      location: "Ho Chi Minh City",
      type: "Full-time",
      salary: "10M - 15M VND",
      description:
        "Support customers via email, chat, phone. Requirements: Good communication skills, patience, ability to work in shifts.",
    },
    {
      title: "Data Analyst",
      department: "Data",
      location: "Ho Chi Minh City / Remote",
      type: "Full-time",
      salary: "18M - 28M VND",
      description:
        "Analyze user data, create insight reports. Requirements: SQL, Python, Tableau/Power BI, analytical thinking.",
    },
  ];

  const values = [
    {
      title: "Innovation",
      description:
        "We encourage new ideas, experimentation, and learning from failures",
    },
    {
      title: "Customer-Centric",
      description:
        "Every decision is aimed at delivering the best user experience",
    },
    {
      title: "Teamwork",
      description: "Collaborate, share knowledge, and grow together",
    },
    {
      title: "Transparency & Integrity",
      description: "Open communication and honesty in all interactions",
    },
    {
      title: "Excellence in Execution",
      description: "Commitment to high quality and continuous improvement",
    },
    {
      title: "Diversity & Inclusion",
      description:
        "Respect differences and create an equal working environment",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Submit Application",
      desc: "Send your CV and cover letter via email or website form",
    },
    {
      number: 2,
      title: "Screening",
      desc: "HR reviews applications and contacts suitable candidates (1-2 days)",
    },
    {
      number: 3,
      title: "Interview",
      desc: "1-2 interview rounds with team leader and HR (online/offline)",
    },
    {
      number: 4,
      title: "Offer",
      desc: "Receive offer, negotiate salary, and onboarding",
      color: "success.main",
    },
  ];

  const half = Math.ceil(values.length / 2);
  const col1 = values.slice(0, half);
  const col2 = values.slice(half);
  const left = steps.slice(0, 2);
  const right = steps.slice(2, 4);

  return (
    <Page title="Careers - Online Auction Platform">
      <Box
        sx={{
          bgcolor: "success.main",
          color: "white",
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            mb={2}
          >
            <Work sx={{ fontSize: 48 }} />
          </Stack>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            align="center"
          >
            Career Opportunities
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.9, mb: 2 }}>
            Join us in building Vietnam's leading auction platform
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* About us */}
        <Card sx={{ mb: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              align="center"
            >
              About Us
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              align="center"
              sx={{ maxWidth: 800, mx: "auto" }}
            >
              Online Auction Platform is a leading online auction platform,
              connecting millions of buyers and sellers. We believe in the power
              of technology to create unique, transparent, and exciting shopping
              experiences.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ maxWidth: 800, mx: "auto" }}
            >
              Our team is passionate about technology, creative, and always
              focused on delivering the best value to customers. Join us to
              build the future of e-commerce together!
            </Typography>
          </CardContent>
        </Card>

        {/* Core values */}
        <Card sx={{ mb: 6, bgcolor: "background.default" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ mb: 4 }}
            >
              Core Values
            </Typography>
            <Grid container spacing={4}>
              {/* Column 1 */}
              <Grid item xs={12} md={6}>
                <Stack spacing={4}>
                  {col1.map((value, index) => (
                    <Stack direction="row" spacing={2} key={index}>
                      <CheckCircle color="success" />
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {value.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {value.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Grid>

              {/* Column 2 */}
              <Grid item xs={12} md={6}>
                <Stack spacing={4}>
                  {col2.map((value, index) => (
                    <Stack direction="row" spacing={2} key={index}>
                      <CheckCircle color="success" />
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {value.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {value.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Open positions */}
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            align="center"
            sx={{ mb: 4 }}
          >
            Open Positions
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            paragraph
            sx={{ mb: 4 }}
          >
            {openPositions.length} positions available
          </Typography>

          <Stack spacing={3}>
            {openPositions.map((position, index) => (
              <Card key={index} variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {position.title}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        gap={1}
                        mb={2}
                      >
                        <Chip
                          label={position.department}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          icon={<LocationOn />}
                          label={position.location}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={position.type}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={position.salary}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {position.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Button variant="contained" color="success">
                        Apply Now
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        <Card sx={{ mt: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              align="center"
              sx={{ mb: 4 }}
            >
              Recruitment Process
            </Typography>

            <Box sx={{ display: "flex", gap: 4 }}>
              {/* Left column */}
              <Box sx={{ flex: 1 }}>
                {left.map((s, i) => (
                  <Card
                    key={i}
                    variant="outlined"
                    sx={{ mb: 3, p: 2, textAlign: "center" }}
                  >
                    <Box
                      sx={{
                        bgcolor: s.color || "primary.main",
                        color: "white",
                        borderRadius: "50%",
                        width: 48,
                        height: 48,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mx: "auto",
                        mb: 2,
                        fontWeight: "bold",
                        fontSize: 20,
                      }}
                    >
                      {s.number}
                    </Box>

                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {s.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {s.desc}
                    </Typography>
                  </Card>
                ))}
              </Box>

              {/* Right column */}
              <Box sx={{ flex: 1 }}>
                {right.map((s, i) => (
                  <Card
                    key={i}
                    variant="outlined"
                    sx={{ mb: 3, p: 2, textAlign: "center" }}
                  >
                    <Box
                      sx={{
                        bgcolor: s.color || "primary.main",
                        color: "white",
                        borderRadius: "50%",
                        width: 48,
                        height: 48,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mx: "auto",
                        mb: 2,
                        fontWeight: "bold",
                        fontSize: 20,
                      }}
                    >
                      {s.number}
                    </Box>

                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {s.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {s.desc}
                    </Typography>
                  </Card>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default CareersPage;
