import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Save,
  Cancel,
  Info,
  AddPhotoAlternate,
  Delete as DeleteIcon,
  CloudUpload,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';

// Validation schema
const auctionSchema = yup.object({
  title: yup.string().required('Product title is required').min(5, 'Title must be at least 5 characters'),
  startingPrice: yup
    .number()
    .required('Starting price is required')
    .positive('Starting price must be positive')
    .min(1000, 'Starting price must be at least 1,000 VND'),
  bidIncrement: yup
    .number()
    .required('Bid increment is required')
    .positive('Bid increment must be positive')
    .min(1000, 'Bid increment must be at least 1,000 VND'),
  buyNowPrice: yup
    .number()
    .nullable()
    .transform((value) => {
      if (value === '' || value === null || value === undefined) return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    })
    .test('positive-if-provided', 'Buy now price must be positive', function(value) {
      if (value === null || value === undefined || value === '') return true;
      return value > 0;
    }),
  description: yup.string().required('Description is required').min(20, 'Description must be at least 20 characters'),
  autoExtend: yup.boolean(),
  images: yup
    .array()
    .min(3, 'Please upload at least 3 images')
    .required('At least 3 images are required'),
});

const defaultValues = {
  title: '',
  startingPrice: '',
  bidIncrement: '',
  buyNowPrice: '',
  description: '',
  autoExtend: false,
};

const SellerCreateAuctionPage = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [images, setImages] = useState([]); // Array of { file: File, preview: string }

  const validateField = async (field, valueOverride) => {
    if (!auctionSchema.fields[field]) return;
    try {
      await auctionSchema.validateAt(field, {
        ...formValues,
        [field]: valueOverride ?? formValues[field],
      });
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (error) {
      setFormErrors((prev) => ({ ...prev, [field]: error.message }));
    }
  };

  const validateForm = async () => {
    try {
      await auctionSchema.validate({ ...formValues, images }, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (error) {
      const formattedErrors = error.inner.reduce((acc, current) => {
        if (current.path && !acc[current.path]) {
          acc[current.path] = current.message;
        }
        return acc;
      }, {});
      setFormErrors((prev) => ({ ...prev, ...formattedErrors }));
      return false;
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    setImages((prev) => [...prev, ...newImages]);
    
    // Validate images count
    if (images.length + newImages.length < 3) {
      setFormErrors((prev) => ({
        ...prev,
        images: `Please upload at least ${3 - (images.length + newImages.length)} more image(s)`,
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== imageId);
      // Clean up object URLs to prevent memory leaks
      const removed = prev.find((img) => img.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      
      // Validate images count
      if (updated.length < 3) {
        setFormErrors((prev) => ({
          ...prev,
          images: `Please upload at least ${3 - updated.length} more image(s)`,
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, images: '' }));
      }
      
      return updated;
    });
  };

  const handleChange = async (event) => {
    const { name, value, checked, type } = event.target;
    const nextValue = type === 'checkbox' ? checked : value === '' ? '' : type === 'number' ? Number(value) : value;

    setFormValues((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    await validateField(name, nextValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = await validateForm();
    if (!isValid) {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setSubmitting(true);
    setStatus(null);

    // Will be implemented with API call later
    // Images will be sent as FormData
    setTimeout(() => {
      setSubmitting(false);
      setStatus('success');
      console.log('Form submitted:', {
        ...formValues,
        images: images.map((img) => img.file),
      });
      // Navigate to product detail or seller home after success
      setTimeout(() => {
        navigate('/seller/home');
      }, 2000);
    }, 1500);
  };

  const handleCancel = () => {
    navigate('/seller/home');
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page title="Create Auction - Online Auction Platform">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Create New Auction
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill in the details below to list your product for auction
          </Typography>
        </Box>


        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack component="form" spacing={3} onSubmit={handleSubmit}>
              {status === 'success' && (
                <Alert severity="success">
                  Auction created successfully! Redirecting...
                </Alert>
              )}

              {/* Product Title */}
              <TextField
                fullWidth
                label="Product Title"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                placeholder="e.g., Luxury Swiss Automatic Watch - Rose Gold"
              />

              <Divider />

              {/* Images Upload Section */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Product Images
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload at least 3 images of your product. The first image will be used as the main image.
                </Typography>

                {/* Upload Area */}
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: formErrors.images ? 'error.main' : 'grey.300',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                    mb: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                    },
                  }}
                >
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mb: 1 }}
                    >
                      Upload Images
                    </Button>
                  </label>
                  <Typography variant="body2" color="text.secondary">
                    Click to select or drag and drop images here
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Supported formats: JPG, PNG, GIF (Max 5MB per image)
                  </Typography>
                </Box>

                {/* Error Message */}
                {formErrors.images && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formErrors.images}
                  </Alert>
                )}

                {/* Images Preview Grid */}
                {images.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {images.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={image.id}>
                        <Box
                          sx={{
                            position: 'relative',
                            paddingTop: '75%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'grey.100',
                          }}
                        >
                          <Box
                            component="img"
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {index === 0 && (
                            <Chip
                              label="Main"
                              size="small"
                              color="primary"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                fontWeight: 'bold',
                              }}
                            />
                          )}
                          <IconButton
                            onClick={() => handleRemoveImage(image.id)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': {
                                bgcolor: 'error.main',
                                color: 'white',
                              },
                            }}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              p: 0.5,
                            }}
                          >
                            <Typography variant="caption" noWrap>
                              {image.file.name}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Images Count Info */}
                <Typography
                  variant="caption"
                  color={images.length >= 3 ? 'success.main' : 'text.secondary'}
                  sx={{ mt: 1, display: 'block' }}
                >
                  {images.length} / 3 images uploaded {images.length >= 3 && '✓'}
                </Typography>
              </Box>

              <Divider />

              {/* Pricing Section */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Pricing
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Starting Price (VND)"
                      name="startingPrice"
                      type="number"
                      value={formValues.startingPrice}
                      onChange={handleChange}
                      error={!!formErrors.startingPrice}
                      helperText={formErrors.startingPrice || 'Minimum bid amount'}
                      required
                      InputProps={{
                        inputProps: { min: 1000, step: 1000 },
                      }}
                    />
                    {formValues.startingPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatPrice(Number(formValues.startingPrice))}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Bid Increment (VND)"
                      name="bidIncrement"
                      type="number"
                      value={formValues.bidIncrement}
                      onChange={handleChange}
                      error={!!formErrors.bidIncrement}
                      helperText={formErrors.bidIncrement || 'Minimum increase per bid'}
                      required
                      InputProps={{
                        inputProps: { min: 1000, step: 1000 },
                      }}
                    />
                    {formValues.bidIncrement && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatPrice(Number(formValues.bidIncrement))}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Buy Now Price (VND)"
                      name="buyNowPrice"
                      type="number"
                      value={formValues.buyNowPrice}
                      onChange={handleChange}
                      error={!!formErrors.buyNowPrice}
                      helperText={formErrors.buyNowPrice || 'Optional - allows instant purchase'}
                      InputProps={{
                        inputProps: { min: 0, step: 1000 },
                      }}
                    />
                    {formValues.buyNowPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatPrice(Number(formValues.buyNowPrice))}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Description Section */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Product Description
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  WYSIWYG editor will be added in Step 3. For now, use plain text.
                </Typography>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={8}
                  value={formValues.description}
                  onChange={handleChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description || 'Minimum 20 characters. Rich text editor coming in Step 3.'}
                  required
                  placeholder="Describe your product in detail..."
                />
              </Box>

              <Divider />

              {/* Auto-Extend Section */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Auction Settings
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        name="autoExtend"
                        checked={formValues.autoExtend}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          Auto-Extend Auction
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          If enabled, the auction will automatically extend by 10 minutes when a new bid is placed within the last 5 minutes before the end time.
                          This helps prevent last-second bidding wars.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  disabled={submitting}
                  sx={{ minWidth: 150 }}
                >
                  {submitting ? 'Creating...' : 'Create Auction'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default SellerCreateAuctionPage;
