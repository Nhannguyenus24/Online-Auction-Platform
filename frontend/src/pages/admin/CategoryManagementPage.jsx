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
  CircularProgress,
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
import { useSnackbar } from 'notistack';
import { normalizeTimestamp } from '../../utils/formatTime';
import { categoryApi } from '../../services/categoryApi';
import { adminApi } from '../../services/adminApi';

const CategoryManagementPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getCategories();
      if (response.success) {
        // Flatten the nested structure into a flat list
        const flatCategories = [];
        response.data.forEach(parent => {
          flatCategories.push({
            id: parent.id,
            name: parent.name,
            parentId: null,
            description: '',
            productCount: 0,
            status: 'Active',
            createdAt: normalizeTimestamp(parent.createdAt).toISOString().split('T')[0],
            updatedAt: normalizeTimestamp(parent.createdAt).toISOString().split('T')[0],
          });
          
          if (parent.children && parent.children.length > 0) {
            parent.children.forEach(child => {
              flatCategories.push({
                id: child.id,
                name: child.name,
                parentId: parent.id,
                description: '',
                productCount: 0,
                status: 'Active',
                createdAt: normalizeTimestamp(child.createdAt).toISOString().split('T')[0],
                updatedAt: normalizeTimestamp(child.createdAt).toISOString().split('T')[0],
              });
            });
          }
        });
        setAllCategories(flatCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi tải danh mục', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      enqueueSnackbar('Vui lòng nhập tên danh mục', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === 'create') {
        const response = await adminApi.createCategory(
          formData.name,
          formData.parentId || 0
        );
        
        if (response.success) {
          enqueueSnackbar(response.message || 'Tạo danh mục thành công', { variant: 'success' });
          await fetchCategories();
          handleCloseDialog();
        } else {
          enqueueSnackbar(response.message || 'Tạo danh mục thất bại', { variant: 'error' });
        }
      } else if (dialogMode === 'edit' && selectedCategory) {
        const response = await adminApi.updateCategory(
          selectedCategory.id,
          formData.name,
          formData.parentId || 0
        );
        
        if (response.success) {
          enqueueSnackbar(response.message || 'Cập nhật danh mục thành công', { variant: 'success' });
          await fetchCategories();
          handleCloseDialog();
        } else {
          enqueueSnackbar(response.message || 'Cập nhật danh mục thất bại', { variant: 'error' });
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Lỗi khi lưu danh mục', 
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setSaving(true);
    try {
      const response = await adminApi.deleteCategory(selectedCategory.id);
      
      if (response.success) {
        enqueueSnackbar(response.message || 'Xóa danh mục thành công', { variant: 'success' });
        await fetchCategories();
        handleCloseDialog();
      } else {
        if (response.hasProducts) {
          enqueueSnackbar('Không thể xóa danh mục đang có sản phẩm', { variant: 'error' });
        } else {
          enqueueSnackbar(response.message || 'Xóa danh mục thất bại', { variant: 'error' });
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Lỗi khi xóa danh mục', 
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
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
              disabled={loading}
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

          {/* Loading State */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
            </Box>
          ) : (
            <>
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
            </>
          )}
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
            <Button onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory} 
              variant="contained"
              disabled={!formData.name || saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Saving...' : (dialogMode === 'create' ? 'Create' : 'Save Changes')}
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
            <Button onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteCategory} 
              variant="contained"
              color="error"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CategoryManagementPage;
