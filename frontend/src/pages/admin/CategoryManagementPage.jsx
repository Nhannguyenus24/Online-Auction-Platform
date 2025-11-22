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
} from '@mui/material';
import {
  Category,
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Warning,
  CheckCircle,
} from '@mui/icons-material';

// Mock data generator
const generateMockCategories = () => {
  const categories = [
    { id: 1, name: 'Electronics', parentId: null, description: 'Electronic devices and gadgets', productCount: 245, status: 'Active', createdAt: '2024-01-15', updatedAt: '2024-11-20' },
    { id: 2, name: 'Smartphones', parentId: 1, description: 'Mobile phones and accessories', productCount: 120, status: 'Active', createdAt: '2024-01-16', updatedAt: '2024-11-18' },
    { id: 3, name: 'Laptops', parentId: 1, description: 'Portable computers', productCount: 85, status: 'Active', createdAt: '2024-01-16', updatedAt: '2024-11-15' },
    { id: 4, name: 'Tablets', parentId: 1, description: 'Tablet devices', productCount: 40, status: 'Active', createdAt: '2024-01-17', updatedAt: '2024-11-10' },
    
    { id: 5, name: 'Fashion', parentId: null, description: 'Clothing and accessories', productCount: 180, status: 'Active', createdAt: '2024-02-01', updatedAt: '2024-11-19' },
    { id: 6, name: 'Men\'s Clothing', parentId: 5, description: 'Clothing for men', productCount: 75, status: 'Active', createdAt: '2024-02-02', updatedAt: '2024-11-17' },
    { id: 7, name: 'Women\'s Clothing', parentId: 5, description: 'Clothing for women', productCount: 95, status: 'Active', createdAt: '2024-02-02', updatedAt: '2024-11-16' },
    { id: 8, name: 'Accessories', parentId: 5, description: 'Fashion accessories', productCount: 10, status: 'Active', createdAt: '2024-02-03', updatedAt: '2024-11-14' },
    
    { id: 9, name: 'Home & Garden', parentId: null, description: 'Home and garden products', productCount: 156, status: 'Active', createdAt: '2024-02-10', updatedAt: '2024-11-21' },
    { id: 10, name: 'Furniture', parentId: 9, description: 'Home furniture', productCount: 65, status: 'Active', createdAt: '2024-02-11', updatedAt: '2024-11-12' },
    { id: 11, name: 'Garden Tools', parentId: 9, description: 'Tools for gardening', productCount: 45, status: 'Active', createdAt: '2024-02-11', updatedAt: '2024-11-11' },
    { id: 12, name: 'Decor', parentId: 9, description: 'Home decoration items', productCount: 46, status: 'Active', createdAt: '2024-02-12', updatedAt: '2024-11-09' },
    
    { id: 13, name: 'Sports', parentId: null, description: 'Sports equipment and apparel', productCount: 98, status: 'Active', createdAt: '2024-03-01', updatedAt: '2024-11-08' },
    { id: 14, name: 'Fitness Equipment', parentId: 13, description: 'Gym and fitness equipment', productCount: 42, status: 'Active', createdAt: '2024-03-02', updatedAt: '2024-11-07' },
    { id: 15, name: 'Outdoor Sports', parentId: 13, description: 'Outdoor sporting goods', productCount: 56, status: 'Active', createdAt: '2024-03-02', updatedAt: '2024-11-06' },
    
    { id: 16, name: 'Books', parentId: null, description: 'Books and literature', productCount: 0, status: 'Inactive', createdAt: '2024-03-10', updatedAt: '2024-11-05' },
    { id: 17, name: 'Art & Collectibles', parentId: null, description: 'Artwork and collectible items', productCount: 134, status: 'Active', createdAt: '2024-03-15', updatedAt: '2024-11-04' },
    { id: 18, name: 'Jewelry', parentId: null, description: 'Jewelry and watches', productCount: 89, status: 'Active', createdAt: '2024-03-20', updatedAt: '2024-11-03' },
    { id: 19, name: 'Automotive', parentId: null, description: 'Car parts and accessories', productCount: 67, status: 'Active', createdAt: '2024-04-01', updatedAt: '2024-11-02' },
    { id: 20, name: 'Toys & Games', parentId: null, description: 'Toys and gaming products', productCount: 112, status: 'Active', createdAt: '2024-04-10', updatedAt: '2024-11-01' },
  ];
  
  return categories;
};

const CategoryManagementPage = () => {
  const theme = useTheme();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    description: '',
    status: 'Active',
  });

  // Generate mock data
  const allCategories = useMemo(() => generateMockCategories(), []);

  // Filter logic
  const filteredCategories = useMemo(() => {
    return allCategories.filter(category => {
      const matchesSearch = 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.id.toString().includes(searchQuery);
      
      return matchesSearch;
    });
  }, [allCategories, searchQuery]);

  // Paginated data
  const paginatedCategories = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredCategories.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCategories, page, rowsPerPage]);

  // Parent categories for dropdown
  const parentCategories = useMemo(() => 
    allCategories.filter(cat => cat.parentId === null),
    [allCategories]
  );

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode, category = null) => {
    setDialogMode(mode);
    setSelectedCategory(category);
    
    if (mode === 'create') {
      setFormData({
        name: '',
        parentId: '',
        description: '',
        status: 'Active',
      });
    } else if (mode === 'edit' && category) {
      setFormData({
        name: category.name,
        parentId: category.parentId || '',
        description: category.description,
        status: category.status,
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = () => {
    // Here you would call your API
    console.log('Saving category:', formData);
    handleCloseDialog();
  };

  const handleDeleteCategory = () => {
    // Here you would call your API
    console.log('Deleting category:', selectedCategory);
    handleCloseDialog();
  };

  const getParentCategoryName = (parentId) => {
    if (!parentId) return '—';
    const parent = allCategories.find(cat => cat.id === parentId);
    return parent ? parent.name : '—';
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
            Category Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage product categories and subcategories
          </Typography>
        </Box>

        {/* Main Content */}
        <Paper sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <Category />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              Categories List
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog('create')}
            >
              Add Category
            </Button>
          </Stack>

          {/* Search */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <TextField
              fullWidth
              placeholder="Search by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { sm: 500 } }}
            />
          </Stack>

          {/* Results Summary */}
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedCategories.length} of {filteredCategories.length} categories
              {searchQuery && ' (filtered)'}
            </Typography>
          </Box>

          {/* Categories Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Category Name</TableCell>
                  <TableCell>Parent Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCategories.map((category) => (
                  <TableRow
                    key={category.id}
                    sx={{
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        #{category.id}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {category.name}
                        </Typography>
                        {category.parentId && (
                          <Chip
                            label="Sub"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getParentCategoryName(category.parentId)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {category.description}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip
                        label={category.productCount}
                        size="small"
                        color={category.productCount > 0 ? 'primary' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={category.status}
                        size="small"
                        color={category.status === 'Active' ? 'success' : 'default'}
                        icon={category.status === 'Active' ? <CheckCircle fontSize="small" /> : undefined}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.createdAt}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Category">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog('edit', category)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip 
                          title={category.productCount > 0 
                            ? "Cannot delete - products exist" 
                            : "Delete Category"
                          }
                        >
                          <span>
                            <IconButton 
                              size="small" 
                              color="error"
                              disabled={category.productCount > 0}
                              onClick={() => handleOpenDialog('delete', category)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
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
            count={filteredCategories.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
          />
        </Paper>

        {/* Create/Edit Dialog */}
        <Dialog 
          open={openDialog && dialogMode !== 'delete'} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogMode === 'create' ? 'Create New Category' : 'Edit Category'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Category Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              
              <FormControl fullWidth>
                <InputLabel>Parent Category</InputLabel>
                <Select
                  value={formData.parentId}
                  label="Parent Category"
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None (Main Category)</em>
                  </MenuItem>
                  {parentCategories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSaveCategory} 
              variant="contained"
              disabled={!formData.name}
            >
              {dialogMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={openDialog && dialogMode === 'delete'} 
          onClose={handleCloseDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <Warning color="error" />
              <Typography variant="h6">Confirm Delete</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the category "<strong>{selectedCategory?.name}</strong>"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleDeleteCategory} 
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CategoryManagementPage;
