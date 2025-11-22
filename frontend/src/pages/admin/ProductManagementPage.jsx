import { useState, useMemo } from 'react';
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

// Mock data generator
const generateMockProducts = (count) => {
  const statuses = ['Active', 'Completed', 'Cancelled', 'Pending'];
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Art & Collectibles', 'Jewelry', 'Automotive'];
  const productNames = [
    'iPhone 15 Pro Max', 'MacBook Pro M3', 'Sony WH-1000XM5', 'Samsung Galaxy S24',
    'Nike Air Jordan 1', 'Vintage Rolex Watch', 'Gaming PC RTX 4090', 'Canon EOS R5',
    'Designer Handbag', 'Antique Painting', 'Mountain Bike', 'Smart Home Hub',
    'Leather Jacket', 'Diamond Ring', 'Vintage Car Parts', 'Professional Camera Lens',
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[i % statuses.length];
    const isCompleted = status === 'Completed';
    const currentPrice = Math.floor(Math.random() * 5000) + 500;
    const startPrice = Math.floor(currentPrice * 0.6);
    const bidCount = Math.floor(Math.random() * 50) + 1;
    const winner = isCompleted ? {
      id: 2000 + i,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      finalPrice: currentPrice,
    } : null;
    
    return {
      id: 5000 + i,
      name: productNames[i % productNames.length] + ` #${i + 1}`,
      image: `https://picsum.photos/seed/${i + 100}/400/300`,
      category: categories[i % categories.length],
      startPrice,
      currentPrice,
      buyNowPrice: isCompleted ? null : Math.floor(currentPrice * 1.5),
      bidCount,
      status,
      seller: {
        id: 1000 + i,
        name: `Seller ${i + 1}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
      },
      winner,
      startDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      endDate: isCompleted 
        ? new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()
        : new Date(Date.now() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
      views: Math.floor(Math.random() * 1000) + 50,
      isFlagged: Math.random() > 0.9,
    };
  });
};

const ProductManagementPage = () => {
  const theme = useTheme();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Generate mock data
  const allProducts = useMemo(() => generateMockProducts(125), []);

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

  // Unique categories for filter
  const categories = useMemo(() => 
    [...new Set(allProducts.map(p => p.category))],
    [allProducts]
  );

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

  const handleConfirmDelete = () => {
    console.log('Removing product:', selectedProduct);
    setOpenDeleteDialog(false);
    setSelectedProduct(null);
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
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setStatusFilter('All');
                setCategoryFilter('All');
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
                        ${product.startPrice.toLocaleString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        ${product.currentPrice.toLocaleString()}
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
                          ${selectedProduct.startPrice.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Current Price</Typography>
                        <Typography variant="h6" color="success.main">
                          ${selectedProduct.currentPrice.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {selectedProduct.buyNowPrice && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Buy Now Price</Typography>
                        <Typography variant="h6" color="primary.main">
                          ${selectedProduct.buyNowPrice.toLocaleString()}
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
                          <strong>Final Price:</strong> ${selectedProduct.winner.finalPrice.toLocaleString()}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained"
              color="error"
            >
              Remove Product
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProductManagementPage;
