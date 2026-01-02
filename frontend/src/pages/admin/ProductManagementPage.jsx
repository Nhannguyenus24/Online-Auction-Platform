import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  useTheme,
  alpha,
  Stack,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Inventory,
  Search,
  FilterList,
  Visibility,
  Delete,
  CheckCircle,
  Cancel,
  Gavel,
  AttachMoney,
  Person,
  Schedule,
  Warning,
  EmojiEvents,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { normalizeTimestamp } from '../../utils/formatTime';
import { categoryApi } from '../../services/categoryApi';
import { adminApi } from '../../services/adminApi';
import axiosInstance from '../../utils/axios';

const ProductManagementPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [removeReason, setRemoveReason] = useState('');

  // Fetch categories and products on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Reset page to 0 when any filter changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, categoryFilter]);

  const initializeData = async () => {
    setLoading(true);
    try {
      // First fetch categories
      const categoryResponse = await categoryApi.getCategories();
      if (categoryResponse.success) {
        const cats = [];
        categoryResponse.data.forEach(parent => {
          cats.push({ id: parent.id, name: parent.name });
          if (parent.children) {
            parent.children.forEach(child => {
              cats.push({ id: child.id, name: child.name });
            });
          }
        });
        setCategories(cats);

        // Set first category as default and fetch its products
        if (cats.length > 0) {
          setCategoryFilter(cats[0].name);
          await fetchProductsByCategory(cats[0].name);
        }
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      enqueueSnackbar('Lỗi khi tải dữ liệu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async (categoriesToFetch = categories) => {
    try {
      const allProductsData = [];
      
      // Fetch products from all categories in parallel
      const fetchPromises = categoriesToFetch.map(cat => 
        axiosInstance.get('/api/guest/products/by-category', {
          params: {
            categoryId: cat.id,
            status: 'all',
            page: 1,
            limit: 100,
          }
        }).then(response => {
          if (response.data.success && response.data.products) {
            return response.data.products;
          }
          return [];
        }).catch(error => {
          console.error(`Error fetching products for category ${cat.id}:`, error);
          return [];
        })
      );

      const results = await Promise.all(fetchPromises);
      results.forEach(products => {
        allProductsData.push(...products);
      });

      // Remove duplicates by product id
      const uniqueProducts = allProductsData.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      // Transform products to match the expected format
      const transformedProducts = uniqueProducts.map(product => ({
        id: product.id,
        name: product.title,
        image: product.images && product.images.length > 0 ? product.images[0].url : '',
        category: product.categoryName || 'Unknown',
        categoryId: product.categoryId,
        startPrice: product.startingPrice || 0,
        currentPrice: product.currentPrice || 0,
        buyNowPrice: product.buyNowPrice || 0,
        bidCount: product.bidsCount || 0,
        status: product.status === 'active' ? 'Active' : 
                product.status === 'ended' ? 'Completed' : 
                product.status === 'cancelled' ? 'Cancelled' : 'Pending',
        seller: {
          id: product.sellerId,
          name: product.sellerName || 'Unknown',
          rating: product.sellerRatingPercent ? (product.sellerRatingPercent / 20).toFixed(1) : '0.0',
        },
        startDate: product.startsAt ? normalizeTimestamp(product.startsAt).toLocaleDateString() : '',
        endDate: product.endsAt ? normalizeTimestamp(product.endsAt).toLocaleDateString() : '',
        description: product.description || '',
        views: product.viewsCount || 0,
        isFlagged: false,
        winner: product.status === 'ended' && product.highestBidderMasked ? {
          name: product.highestBidderMasked,
          finalPrice: product.currentPrice,
        } : null,
      }));

      setAllProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      enqueueSnackbar('Lỗi khi tải danh sách sản phẩm', { variant: 'error' });
    }
  };

  const fetchProductsByCategory = async (categoryName) => {
    setLoading(true);
    try {
      // Find category by name
      const category = categories.find(cat => cat.name === categoryName);
      if (!category) {
        enqueueSnackbar('Không tìm thấy danh mục', { variant: 'error' });
        return;
      }

      const response = await axiosInstance.get('/api/guest/products/by-category', {
        params: {
          categoryId: category.id,
          status: '',
          page: 1,
          limit: 20,
        }
      });

      if (response.data.success && response.data.products) {
        // Transform products
        const transformedProducts = response.data.products.map(product => ({
          id: product.id,
          name: product.title,
          image: product.images && product.images.length > 0 ? product.images[0].url : '',
          category: product.categoryName || 'Unknown',
          categoryId: product.categoryId,
          startPrice: product.startingPrice || 0,
          currentPrice: product.currentPrice || 0,
          buyNowPrice: product.buyNowPrice || 0,
          bidCount: product.bidsCount || 0,
          status: product.status === 'active' ? 'Active' : 
                  product.status === 'ended' ? 'Completed' : 
                  product.status === 'cancelled' ? 'Cancelled' : 'Pending',
          seller: {
            id: product.sellerId,
            name: product.sellerName || 'Unknown',
            rating: product.sellerRatingPercent ? (product.sellerRatingPercent / 20).toFixed(1) : '0.0',
          },
          startDate: product.startsAt ? normalizeTimestamp(product.startsAt).toLocaleDateString() : '',
          endDate: product.endsAt ? normalizeTimestamp(product.endsAt).toLocaleDateString() : '',
          description: product.description || '',
          views: product.viewsCount || 0,
          isFlagged: false,
          winner: product.status === 'ended' && product.highestBidderMasked ? {
            name: product.highestBidderMasked,
            finalPrice: product.currentPrice,
          } : null,
        }));

        setAllProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      enqueueSnackbar('Lỗi khi tải sản phẩm theo danh mục', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toString().includes(searchQuery);
      
      const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allProducts, searchQuery, statusFilter, categoryFilter]);

  // Paginated data
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allProducts.length,
      active: allProducts.filter(p => p.status === 'Active').length,
      completed: allProducts.filter(p => p.status === 'Completed').length,
      cancelled: allProducts.filter(p => p.status === 'Cancelled').length,
    };
  }, [allProducts]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setOpenViewDialog(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setOpenDeleteDialog(true);
  };

  const handleCategoryFilterChange = async (newCategory) => {
    setCategoryFilter(newCategory);
    setPage(0); // Reset to first page
    
    // Fetch products for specific category
    await fetchProductsByCategory(newCategory);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct || !removeReason.trim()) {
      enqueueSnackbar('Vui lòng nhập lý do xóa sản phẩm', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.removeProduct(selectedProduct.id, removeReason);
      
      if (response.success) {
        enqueueSnackbar(response.message || 'Xóa sản phẩm thành công', { variant: 'success' });
        await fetchAllProducts();
        setOpenDeleteDialog(false);
        setSelectedProduct(null);
        setRemoveReason('');
      } else {
        enqueueSnackbar(response.message || 'Xóa sản phẩm thất bại', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error removing product:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Lỗi khi xóa sản phẩm', 
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'info';
      case 'Cancelled': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: 3,
        pb: 6,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Product Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage all auction products
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Products
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.total}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                    <Inventory fontSize="large" />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Active Auctions
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {stats.active}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                    <Gavel fontSize="large" />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {stats.completed}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56 }}>
                    <EmojiEvents fontSize="large" />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cancelled
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {stats.cancelled}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.error.main, width: 56, height: 56 }}>
                    <Cancel fontSize="large" />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Paper sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
              }}
            >
              <FilterList />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              Products List
            </Typography>
          </Stack>

          {/* Filters and Search */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <TextField
              fullWidth
              placeholder="Search by product name, seller, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { sm: 400 } }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                disabled={loading}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setStatusFilter('All');
                if (categories.length > 0) {
                  handleCategoryFilterChange(categories[0].name);
                }
                setSearchQuery('');
              }}
            >
              Clear
            </Button>
          </Stack>

          {/* Results Summary */}
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedProducts.length} of {filteredProducts.length} products
              {(statusFilter !== 'All' || categoryFilter !== 'All' || searchQuery) && ' (filtered)'}
            </Typography>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            <>
          {/* Products Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell align="right">Start Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="center">Bids</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        #{product.id}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          variant="rounded"
                          src={product.image}
                          alt={product.name}
                          sx={{ width: 56, height: 56 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {product.name}
                          </Typography>
                          {product.isFlagged && (
                            <Chip
                              icon={<Warning fontSize="small" />}
                              label="Flagged"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={product.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {product.seller.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ⭐ {product.seller.rating}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        ${product.startPrice.toFixed(2)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        ${product.currentPrice.toFixed(2)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Badge badgeContent={product.bidCount} color="primary">
                        <Gavel color="action" />
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={product.status}
                        size="small"
                        color={getStatusColor(product.status)}
                        icon={
                          product.status === 'Active' ? <CheckCircle fontSize="small" /> :
                          product.status === 'Completed' ? <EmojiEvents fontSize="small" /> :
                          product.status === 'Cancelled' ? <Cancel fontSize="small" /> : undefined
                        }
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {product.endDate}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Product">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <RemoveCircleOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredProducts.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
          />
            </>
          )}
        </Paper>

        {/* View Product Dialog */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Product Details
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={5}>
                  <CardMedia
                    component="img"
                    image={selectedProduct.image}
                    alt={selectedProduct.name}
                    sx={{ borderRadius: 2, width: '100%' }}
                  />
                </Grid>
                <Grid item xs={12} md={7}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {selectedProduct.name}
                      </Typography>
                      <Chip
                        label={selectedProduct.status}
                        size="small"
                        color={getStatusColor(selectedProduct.status)}
                      />
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Category</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedProduct.category}</Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Start Price</Typography>
                        <Typography variant="h6" color="text.primary">
                          ${selectedProduct.startPrice.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Current Price</Typography>
                        <Typography variant="h6" color="success.main">
                          ${selectedProduct.currentPrice.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {selectedProduct.buyNowPrice && selectedProduct.buyNowPrice > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Buy Now Price</Typography>
                        <Typography variant="h6" color="primary.main">
                          ${selectedProduct.buyNowPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Seller</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Person fontSize="small" />
                        <Typography variant="body1" fontWeight={600}>
                          {selectedProduct.seller.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (⭐ {selectedProduct.seller.rating})
                        </Typography>
                      </Stack>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total Bids</Typography>
                        <Typography variant="h6">{selectedProduct.bidCount}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Views</Typography>
                        <Typography variant="h6">{selectedProduct.views}</Typography>
                      </Grid>
                    </Grid>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Auction Period</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Schedule fontSize="small" />
                        <Typography variant="body2">
                          {selectedProduct.startDate} - {selectedProduct.endDate}
                        </Typography>
                      </Stack>
                    </Box>
                    
                    {selectedProduct.winner && (
                      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <EmojiEvents color="success" />
                          <Typography variant="subtitle1" fontWeight={700} color="success.main">
                            Auction Winner
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          <strong>Winner:</strong> {selectedProduct.winner.name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Final Price:</strong> ${selectedProduct.winner.finalPrice.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: {selectedProduct.winner.email}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {selectedProduct.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={openDeleteDialog} 
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <Warning color="error" />
              <Typography variant="h6">Confirm Remove Product</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove "<strong>{selectedProduct?.name}</strong>" from the platform?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action will take down the product listing. This cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Reason for removal"
              multiline
              rows={3}
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              required
              sx={{ mt: 2 }}
              placeholder="Please provide a reason for removing this product..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDeleteDialog(false);
              setRemoveReason('');
            }} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained"
              color="error"
              disabled={!removeReason.trim() || saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Removing...' : 'Remove Product'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProductManagementPage;
