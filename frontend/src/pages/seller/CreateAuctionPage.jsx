import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
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
import RichTextEditor from '../../components/RichTextEditor';
import CategorySelector from '../../components/CategorySelector';
import { formatPrice } from '../../utils/formatNumber';
import { sellerApi } from '../../services/sellerApi';

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
  description: yup
    .string()
    .required('Description is required')
    .test('min-length', 'Description must be at least 20 characters', function(value) {
      if (!value) return false;
      // Strip HTML tags to count actual text length
      const textContent = value.replace(/<[^>]*>/g, '').trim();
      return textContent.length >= 20;
    }),
  autoExtend: yup.boolean(),
  images: yup
    .array()
    .min(3, 'Please upload at least 3 images')
    .required('At least 3 images are required'),
  parentCategory: yup.string().required('Parent category is required'),
  childCategory: yup.string().required('Subcategory is required'),
  startsAt: yup
    .string()
    .required('Start date and time is required')
    .test('valid-datetime', 'Invalid date format', function(value) {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test('future-date', 'Start date must be in the future', function(value) {
      if (!value) return false;
      const date = new Date(value);
      return date > new Date();
    }),
  endsAt: yup
    .string()
    .required('End date and time is required')
    .test('valid-datetime', 'Invalid date format', function(value) {
      if (!value) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .test('after-start', 'End date must be after start date', function(value) {
      if (!value || !this.parent.startsAt) return false;
      const endDate = new Date(value);
      const startDate = new Date(this.parent.startsAt);
      return endDate > startDate;
    }),
});

// Helper function to format date for input[type="datetime-local"]
const formatDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to convert datetime-local format to API format
const formatDateTimeForAPI = (dateTimeLocal) => {
  if (!dateTimeLocal) return '';
  // datetime-local format: YYYY-MM-DDTHH:mm
  // API format: yyyy-MM-dd'T'HH:mm:ss
  return dateTimeLocal + ':00';
};

// Set default dates: start = now + 1 hour, end = now + 7 days
const getDefaultStartDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return formatDateTimeLocal(date);
};

const getDefaultEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatDateTimeLocal(date);
};

const defaultValues = {
  title: '',
  startingPrice: '',
  bidIncrement: '',
  buyNowPrice: '',
  description: '',
  autoExtend: false,
  parentCategory: '',
  childCategory: '',
  startsAt: getDefaultStartDate(),
  endsAt: getDefaultEndDate(),
};

const SellerCreateAuctionPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [images, setImages] = useState([]); // Array of { file: File, preview: string }

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm({
    resolver: yupResolver(auctionSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // Only watch specific fields that need to display formatted values
  const startingPrice = watch('startingPrice');
  const bidIncrement = watch('bidIncrement');
  const buyNowPrice = watch('buyNowPrice');

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    
    // Update form value for validation
    setValue('images', updatedImages, { shouldValidate: true });
  };

  const handleRemoveImage = (imageId) => {
    const removed = images.find((img) => img.id === imageId);
    if (removed) {
      URL.revokeObjectURL(removed.preview);
    }
    
    const updated = images.filter((img) => img.id !== imageId);
    setImages(updated);
    
    // Update form value for validation
    setValue('images', updated, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    // Scroll to first error if any
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      enqueueSnackbar('Vui lòng kiểm tra lại các trường bắt buộc', { variant: 'warning' });
      return;
    }

    try {
      // Prepare data for API
      const listingData = {
        title: data.title,
        description: data.description,
        categoryId: data.childCategory, // Use child category ID
        startingPrice: Number(data.startingPrice),
        stepPrice: Number(data.bidIncrement),
        startsAt: formatDateTimeForAPI(data.startsAt),
        endsAt: formatDateTimeForAPI(data.endsAt),
        buyNowPrice: data.buyNowPrice ? Number(data.buyNowPrice) : null,
        isAutoExtend: data.autoExtend,
        autoExtendSeconds: data.autoExtend ? 600 : null, // Default 10 minutes (600 seconds)
        images: images.map((img) => img.file),
      };

      const response = await sellerApi.createAuctionListing(listingData);
      
      if (response.success) {
        enqueueSnackbar('Create auction listing successfully!', { 
          variant: 'success',
          autoHideDuration: 3000,
        });
        // Navigate to seller home after success
        setTimeout(() => {
          navigate('/seller/home');
        }, 3000);
      } else {
        enqueueSnackbar(response.message || 'Create auction listing failed', { 
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating auction listing:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Create auction listing failed. Please try again.';
      enqueueSnackbar(errorMsg, { 
        variant: 'error',
      });
    }
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
            <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
              {/* Product Title */}
              <TextField
                fullWidth
                label="Product Title"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
                required
                placeholder="e.g., Luxury Swiss Automatic Watch - Rose Gold"
              />

              <Divider />

              {/* Category Selection */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Product Category
                </Typography>
                <Controller
                  name="parentCategory"
                  control={control}
                  render={({ field: parentField }) => (
                    <Controller
                      name="childCategory"
                      control={control}
                      render={({ field: childField }) => (
                        <CategorySelector
                          parentCategory={parentField.value}
                          childCategory={childField.value}
                          onChange={(event) => {
                            const { name, value } = event.target;
                            if (name === 'parentCategory') {
                              parentField.onChange(value);
                              // Reset child category when parent changes
                              if (childField.value) {
                                childField.onChange('');
                              }
                              trigger('parentCategory');
                            } else {
                              childField.onChange(value);
                              trigger('childCategory');
                            }
                          }}
                          error={errors.parentCategory?.message || errors.childCategory?.message}
                          helperText="Select the most appropriate category for your product"
                        />
                      )}
                    />
                  )}
                />
              </Box>

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
                    borderColor: errors.images ? 'error.main' : images.length >= 3 ? 'success.main' : 'grey.300',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: images.length >= 3 ? 'success.50' : 'grey.50',
                    mb: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: images.length >= 3 ? 'success.100' : 'primary.50',
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
                      variant={images.length >= 3 ? 'contained' : 'outlined'}
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mb: 1 }}
                    >
                      {images.length > 0 ? 'Add More Images' : 'Upload Images'}
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
                {errors.images && (
                  <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 500 }}>
                    {errors.images.message}
                  </Typography>
                )}

                {/* Images Preview Grid */}
                {images.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                      Uploaded Images ({images.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {images.map((image, index) => (
                        <Grid item xs={6} sm={4} md={3} key={image.id}>
                          <Box
                            sx={{
                              position: 'relative',
                              border: '2px solid',
                              borderColor: index === 0 ? 'primary.main' : 'divider',
                              borderRadius: 2,
                              overflow: 'hidden',
                              bgcolor: 'grey.100',
                            }}
                          >
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                display: 'block',
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
                                p: 1,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                              }}
                            >
                              <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                                {image.file.name}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Images Count Info */}
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color={images.length >= 3 ? 'success.main' : 'text.secondary'}
                    sx={{
                      fontWeight: images.length >= 3 ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    {images.length >= 3 && '✓ '}
                    {images.length} / 3 images uploaded
                    {images.length >= 3 && ' (Minimum requirement met)'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Auction Dates Section */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Auction Schedule
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date & Time"
                      type="datetime-local"
                      {...register('startsAt')}
                      error={!!errors.startsAt}
                      helperText={errors.startsAt?.message || 'When the auction will start accepting bids'}
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="End Date & Time"
                      type="datetime-local"
                      {...register('endsAt')}
                      error={!!errors.endsAt}
                      helperText={errors.endsAt?.message || 'When the auction will end'}
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
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
                      type="number"
                      {...register('startingPrice', { valueAsNumber: true })}
                      error={!!errors.startingPrice}
                      helperText={errors.startingPrice?.message || 'Minimum bid amount'}
                      required
                      InputProps={{
                        inputProps: { min: 1000, step: 1000 },
                      }}
                    />
                    {startingPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatPrice(Number(startingPrice))}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Bid Increment (VND)"
                      type="number"
                      {...register('bidIncrement', { valueAsNumber: true })}
                      error={!!errors.bidIncrement}
                      helperText={errors.bidIncrement?.message || 'Minimum increase per bid'}
                      required
                      InputProps={{
                        inputProps: { min: 1000, step: 1000 },
                      }}
                    />
                    {bidIncrement && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatPrice(Number(bidIncrement))}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Buy Now Price (VND)"
                      type="number"
                      {...register('buyNowPrice', { valueAsNumber: true })}
                      error={!!errors.buyNowPrice}
                      helperText={errors.buyNowPrice?.message || 'Optional - allows instant purchase'}
                      InputProps={{
                        inputProps: { min: 0, step: 1000 },
                      }}
                    />
                    {buyNowPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatPrice(Number(buyNowPrice))}
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
                  Use the rich text editor to format your product description. Minimum 20 characters of text content.
                </Typography>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={(event) => {
                        const value = event.target?.value || event.target?.innerHTML || '';
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Minimum 20 characters of text content'}
                      placeholder="Describe your product in detail..."
                      minHeight={300}
                    />
                  )}
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
                  <Controller
                    name="autoExtend"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
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
                    )}
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
                  disabled={isSubmitting}
                  sx={{ minWidth: 150 }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Auction'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={isSubmitting}
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
