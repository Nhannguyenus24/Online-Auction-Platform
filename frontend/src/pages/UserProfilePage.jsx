import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  ThumbUp,
  ThumbDown,
  CheckCircle,
  Cancel,
  AccessTime,
} from '@mui/icons-material';
import Page from '../components/Page';
import { authApi } from '../utils/api';
import { fVNDate } from '../utils/formatTime';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('User ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await authApi.getProfileById(userId);
        
        if (response.data.success && response.data.profile) {
          setProfile(response.data.profile);
        } else {
          setError(response.data.message || 'User not found');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <Page title="Loading Profile...">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Page>
    );
  }

  if (error || !profile) {
    return (
      <Page title="Profile Not Found">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'User profile not found'}
          </Alert>
        </Container>
      </Page>
    );
  }

  const positiveReviews = profile.positiveReviews || 0;
  const negativeReviews = profile.negativeReviews || 0;
  const totalReviews = positiveReviews + negativeReviews;
  const ratingPercent = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

  return (
    <Page title={`${profile.fullName || 'User'} - Profile`}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
              <Avatar
                sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}
              >
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h4" fontWeight={600}>
                    {profile.fullName || 'No name'}
                  </Typography>
                  {profile.isVerified && (
                    <Chip
                      icon={<CheckCircle />}
                      label="Verified"
                      color="success"
                      size="small"
                    />
                  )}
                  <Chip
                    label={profile.role || 'bidder'}
                    color={profile.role === 'seller' ? 'primary' : 'default'}
                    size="small"
                  />
                </Stack>
                {profile.email && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <Email sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    {profile.email}
                  </Typography>
                )}
                {profile.createdAt && (
                  <Typography variant="body2" color="text.secondary">
                    <AccessTime sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Member since {fVNDate(profile.createdAt)}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Rating Section */}
            {totalReviews > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Rating & Reviews
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" fontWeight="bold" color="primary.main">
                            {ratingPercent.toFixed(0)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Positive Rating
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold">
                            {totalReviews}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Reviews
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ThumbUp color="success" />
                          <Typography variant="body1" fontWeight="medium">
                            Positive Reviews
                          </Typography>
                          <Box sx={{ flex: 1 }} />
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            {positiveReviews}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ThumbDown color="error" />
                          <Typography variant="body1" fontWeight="medium">
                            Negative Reviews
                          </Typography>
                          <Box sx={{ flex: 1 }} />
                          <Typography variant="h6" fontWeight="bold" color="error.main">
                            {negativeReviews}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            )}

            {totalReviews === 0 && (
              <Box sx={{ mb: 4 }}>
                <Alert severity="info">
                  This user hasn't received any reviews yet.
                </Alert>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Contact Information */}
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Contact Information
              </Typography>
              <Stack spacing={2}>
                {profile.phoneNumber && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Phone color="action" />
                    <Typography variant="body1">{profile.phoneNumber}</Typography>
                  </Stack>
                )}
                {profile.address && (
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <LocationOn color="action" sx={{ mt: 0.5 }} />
                    <Typography variant="body1">{profile.address}</Typography>
                  </Stack>
                )}
                {!profile.phoneNumber && !profile.address && (
                  <Typography variant="body2" color="text.secondary">
                    No contact information available.
                  </Typography>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default UserProfilePage;
