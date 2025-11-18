import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function AboutUs() {
  const developers = [
    {
      name: 'Nhan Nguyen',
      role: 'Full Stack Developer & Project Lead',
      avatar: '/avatars/nhan.jpg',
      bio: 'Passionate about building scalable web applications with modern technologies. Specializes in React, Spring Boot, and microservices architecture.',
      skills: ['React', 'Spring Boot', 'Java', 'PostgreSQL', 'AWS'],
      github: 'https://github.com/Nhannguyenus24',
      linkedin: 'https://linkedin.com/in/nhan-nguyen',
      email: 'nhan.nguyen@auction-platform.com',
    },
    {
      name: 'Alex Chen',
      role: 'Backend Developer & DevOps Engineer',
      avatar: '/avatars/alex.jpg',
      bio: 'Expert in backend systems and cloud infrastructure. Focuses on API development, database optimization, and deployment automation.',
      skills: ['Java', 'Microservices', 'Docker', 'Kubernetes', 'CI/CD'],
      github: 'https://github.com/alexchen',
      linkedin: 'https://linkedin.com/in/alex-chen',
      email: 'alex.chen@auction-platform.com',
    },
  ];

  const features = [
    {
      icon: <GavelIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
      title: 'Live Bidding',
      description:
        'Experience real-time auction excitement with our live bidding system. Place bids instantly and watch as prices update in real-time.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
      title: 'Secure Transactions',
      description:
        'Your security is our priority. All transactions are encrypted and protected with industry-standard security measures.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
      title: 'Fast & Reliable',
      description:
        'Built with modern technologies for optimal performance. Enjoy a smooth and responsive bidding experience on any device.',
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
      title: 'Verified Sellers',
      description:
        'All sellers go through a verification process to ensure authenticity and trustworthiness in every transaction.',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', py: 8 }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ textAlign: 'center', mb: 8 }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            About Our Auction Platform
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.8 }}
          >
            Welcome to the future of online auctions. We've created a platform that brings
            buyers and sellers together in a secure, transparent, and exciting marketplace.
          </Typography>
        </MotionBox>

        {/* Platform Introduction */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{ mb: 10 }}
        >
          <Card
            sx={{
              p: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
              Our Online Auction Platform is designed to revolutionize the way people buy and
              sell items online. We provide a trustworthy, user-friendly environment where
              anyone can participate in exciting auctions from the comfort of their home.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              Whether you're a collector looking for rare items, a seller wanting to reach a
              global audience, or someone who loves the thrill of bidding, our platform offers
              the perfect solution for all your auction needs.
            </Typography>
          </Card>
        </MotionBox>

        {/* Features Section */}
        <Box sx={{ mb: 10 }}>
          <Typography
            variant="h3"
            sx={{ textAlign: 'center', fontWeight: 600, mb: 6 }}
          >
            What Makes Us Special
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 8 }} />

        {/* Development Team Section */}
        <Box>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            sx={{ textAlign: 'center', mb: 6 }}
          >
            <Typography variant="h3" sx={{ fontWeight: 600, mb: 2 }}>
              Meet Our Development Team
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              The talented developers maintaining and improving this platform
            </Typography>
          </MotionBox>

          <Grid container spacing={4}>
            {developers.map((dev, index) => (
              <Grid item xs={12} md={6} key={index}>
                <MotionCard
                  initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  sx={{
                    height: '100%',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        src={dev.avatar}
                        alt={dev.name}
                        sx={{
                          width: 80,
                          height: 80,
                          mr: 3,
                          bgcolor: 'primary.main',
                          fontSize: '2rem',
                        }}
                      >
                        {dev.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {dev.name}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                          {dev.role}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 3, lineHeight: 1.7 }}
                    >
                      {dev.bio}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}
                      >
                        Technical Skills
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {dev.skills.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Box
                        component="a"
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'text.secondary',
                          textDecoration: 'none',
                          transition: 'color 0.3s',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <GitHubIcon sx={{ mr: 0.5 }} />
                      </Box>
                      <Box
                        component="a"
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'text.secondary',
                          textDecoration: 'none',
                          transition: 'color 0.3s',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <LinkedInIcon sx={{ mr: 0.5 }} />
                      </Box>
                      <Box
                        component="a"
                        href={`mailto:${dev.email}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'text.secondary',
                          textDecoration: 'none',
                          transition: 'color 0.3s',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <EmailIcon sx={{ mr: 0.5 }} />
                      </Box>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Statistics Section */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          sx={{ mt: 10 }}
        >
          <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
              Platform Statistics
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  10K+
                </Typography>
                <Typography variant="body1">Active Users</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  50K+
                </Typography>
                <Typography variant="body1">Successful Auctions</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  99.9%
                </Typography>
                <Typography variant="body1">Uptime</Typography>
              </Grid>
            </Grid>
          </Card>
        </MotionBox>
      </Container>
    </Box>
  );
}
