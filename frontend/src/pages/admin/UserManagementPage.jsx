import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Menu,
  ListItemIcon,
  ListItemText,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Gavel,
  Warning,
  Search,
  FilterList,
  MoreVert,
  Block,
  CheckCircle,
  FileDownload,
  Refresh,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

import StatCard from '../../components/StatCard';
import { adminApi } from '../../services/adminApi';

const UserManagementPage = () => {
  const theme = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState(0); // 0: All Users, 1: Upgrade Requests
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [usersTotalCount, setUsersTotalCount] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Dialog states
  const [approvalDialog, setApprovalDialog] = useState({ open: false, request: null, action: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch user statistics
  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const data = await adminApi.getUserStatistics('');
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load statistics',
        severity: 'error'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const roleParam = roleFilter === 'All' ? '' : roleFilter.toLowerCase();
      const data = await adminApi.getAllUsers(searchQuery, roleParam, page + 1, rowsPerPage);
      setUsers(data.users || []);
      setUsersTotalCount(data.totalCount || 0);
      setUsersTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch upgrade requests
  const fetchUpgradeRequests = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'All' ? '' : statusFilter.toLowerCase();
      const data = await adminApi.getUpgradeRequests(statusParam, page + 1, rowsPerPage);
      setUpgradeRequests(data.upgradeRequests || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch upgrade requests:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load upgrade requests',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchAllUsers();
    } else {
      fetchUpgradeRequests();
    }
  }, [page, rowsPerPage, statusFilter, roleFilter, searchQuery, activeTab]);

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery) return upgradeRequests;
    
    const query = searchQuery.toLowerCase();
    return upgradeRequests.filter(request => 
      request.userFullName?.toLowerCase().includes(query) ||
      request.userEmail?.toLowerCase().includes(query) ||
      request.id?.toString().includes(query) ||
      request.userId?.toString().includes(query)
    );
  }, [upgradeRequests, searchQuery]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchQuery('');
    setRoleFilter('All');
    setStatusFilter('All');
  };

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, request) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  const handleRefresh = () => {
    fetchStatistics();
    if (activeTab === 0) {
      fetchAllUsers();
    } else {
      fetchUpgradeRequests();
    }
  };

  const handleOpenApprovalDialog = (request, action) => {
    setApprovalDialog({ open: true, request, action });
    handleMenuClose();
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialog({ open: false, request: null, action: '' });
  };

  const handleProcessRequest = async () => {
    const { request, action } = approvalDialog;
    if (!request) return;

    try {
      const response = await adminApi.processUpgradeRequest(
        request.id,
        action,
        action === 'reject' ? 'Does not meet seller requirements' : ''
      );

      if (response.success) {
        setSnackbar({
          open: true,
          message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
          severity: 'success'
        });
        fetchUpgradeRequests();
        fetchStatistics();
      } else {
        setSnackbar({
          open: true,
          message: response.message || `Failed to ${action} request`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Process request error:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${action} request`,
        severity: 'error'
      });
    } finally {
      handleCloseApprovalDialog();
    }
  };

  const getRoleColor = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'admin': return 'error';
      case 'seller': return 'primary';
      case 'bidder': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'N/A';
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    if (activeTab === 0) {
      // Export users
      const exportData = users.map(user => ({
        'User ID': user.id,
        'Name': user.fullName,
        'Email': user.email,
        'Phone': user.phone || 'N/A',
        'Address': user.address || 'N/A',
        'Role': user.role,
        'Email Verified': user.isEmailVerified ? 'Yes' : 'No',
        'Positive Reviews': user.positiveReviews,
        'Negative Reviews': user.negativeReviews,
        'Rating %': user.ratingPercent.toFixed(2),
        'Created Date': formatDate(user.createdAt),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const columnWidths = [
        { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 18 },
        { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 18 },
        { wch: 18 }, { wch: 12 }, { wch: 20 }
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      const date = new Date().toISOString().split('T')[0];
      const fileName = `users_export_${date}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else {
      // Export upgrade requests (existing code)
      const exportData = filteredRequests.map(request => ({
        'Request ID': request.id,
        'User ID': request.userId,
        'Name': request.userFullName,
        'Email': request.userEmail,
        'Requested Role': request.requestedRole,
        'Status': request.status,
        'Created Date': formatDate(request.createdAt),
        'Reviewed Date': formatDate(request.reviewedAt),
        'Reason': request.reason || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const columnWidths = [
        { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 30 },
        { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 40 }
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Upgrade Requests');

      const date = new Date().toISOString().split('T')[0];
      const fileName = `upgrade_requests_${date}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }
  };

  // Render Users Table
  const renderUsersTable = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      );
    }

    if (users.length === 0) {
      return (
        <Box py={8} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {searchQuery || roleFilter !== 'All' 
              ? 'Try adjusting your filters' 
              : 'There are no users at this time'}
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reviews</TableCell>
                <TableCell>Created Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      #{user.id}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.fullName || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.email || 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.phone || 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={user.role?.toUpperCase() || 'BIDDER'}
                      size="small"
                      color={getRoleColor(user.role)}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={user.isEmailVerified ? 'VERIFIED' : 'UNVERIFIED'}
                      size="small"
                      color={user.isEmailVerified ? 'success' : 'warning'}
                      icon={user.isEmailVerified ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color="success.main">
                        👍 {user.positiveReviews || 0}
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        👎 {user.negativeReviews || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={usersTotalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
          sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
        />
      </>
    );
  };

  // Render Upgrade Requests Table
  const renderUpgradeRequestsTable = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <Box py={8} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            No upgrade requests found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {searchQuery || statusFilter !== 'All' 
              ? 'Try adjusting your filters' 
              : 'There are no upgrade requests at this time'}
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Requested Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Reviewed Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow
                  key={request.id}
                  sx={{
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      #{request.id}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {request.userFullName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {request.userFullName || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {request.userEmail || 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      #{request.userId}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={request.requestedRole?.toUpperCase() || 'SELLER'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={request.status?.toUpperCase() || 'PENDING'}
                      size="small"
                      color={getStatusColor(request.status)}
                      icon={
                        request.status?.toLowerCase() === 'approved' ? <CheckCircle fontSize="small" /> :
                        request.status?.toLowerCase() === 'rejected' ? <Block fontSize="small" /> : undefined
                      }
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(request.createdAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(request.reviewedAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, request)}
                      disabled={request.status?.toLowerCase() !== 'pending'}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
          sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
        />
      </>
    );
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
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all users, upgrade requests and monitor statistics
          </Typography>
        </Box>

        {/* Overview Section */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <People />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              Overview
            </Typography>
          </Stack>
          
          {statsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : statistics ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Users"
                  value={statistics.totalUsers || 0}
                  icon={People}
                  trend={12}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Bidders"
                  value={statistics.totalBidders || 0}
                  icon={Gavel}
                  trend={8}
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Sellers"
                  value={statistics.totalSellers || 0}
                  icon={PersonAdd}
                  trend={15}
                  color={theme.palette.success.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Verified Users"
                  value={statistics.verifiedUsers || 0}
                  icon={CheckCircle}
                  trend={-5}
                  color={theme.palette.warning.main}
                />
              </Grid>
            </Grid>
          ) : (
            <Alert severity="error">Failed to load statistics</Alert>
          )}
        </Paper>

        {/* User List Section */}
        <Paper sx={{ p: 4 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="All Users" icon={<People />} iconPosition="start" />
              <Tab label="Upgrade Requests" icon={<PersonAdd />} iconPosition="start" />
            </Tabs>
          </Box>

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
              {activeTab === 0 ? 'All Users' : 'Upgrade Requests (Bidder → Seller)'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Refresh">
              <IconButton color="primary" onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to Excel">
              <IconButton color="primary" onClick={handleExportToExcel}>
                <FileDownload />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Filters and Search */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <TextField
              fullWidth
              placeholder={activeTab === 0 ? "Search by name, email, or phone..." : "Search by name, email, or ID..."}
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

            {activeTab === 0 ? (
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="All">All Roles</MenuItem>
                  <MenuItem value="Bidder">Bidder</MenuItem>
                  <MenuItem value="Seller">Seller</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            )}

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setRoleFilter('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </Stack>

          {/* Results Summary */}
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 
                ? `Showing ${users.length} of ${usersTotalCount} users${(roleFilter !== 'All' || searchQuery) ? ' (filtered)' : ''}`
                : `Showing ${filteredRequests.length} of ${totalCount} requests${(statusFilter !== 'All' || searchQuery) ? ' (filtered)' : ''}`
              }
            </Typography>
          </Box>

          {/* Content based on active tab */}
          {activeTab === 0 ? renderUsersTable() : renderUpgradeRequestsTable()}
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleOpenApprovalDialog(selectedRequest, 'approve')}>
            <ListItemIcon>
              <ThumbUp fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Approve Request</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleOpenApprovalDialog(selectedRequest, 'reject')}>
            <ListItemIcon>
              <ThumbDown fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Reject Request</ListItemText>
          </MenuItem>
        </Menu>

        {/* Approval Dialog */}
        <Dialog
          open={approvalDialog.open}
          onClose={handleCloseApprovalDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {approvalDialog.action === 'approve' ? 'Approve Upgrade Request' : 'Reject Upgrade Request'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to {approvalDialog.action} this upgrade request?
            </Typography>
            {approvalDialog.request && (
              <Box mt={2} p={2} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  <strong>User:</strong> {approvalDialog.request.userFullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {approvalDialog.request.userEmail}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Requested Role:</strong> {approvalDialog.request.requestedRole?.toUpperCase()}
                </Typography>
                {approvalDialog.request.reason && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    <strong>Reason:</strong> {approvalDialog.request.reason}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseApprovalDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessRequest}
              variant="contained"
              color={approvalDialog.action === 'approve' ? 'success' : 'error'}
              startIcon={approvalDialog.action === 'approve' ? <ThumbUp /> : <ThumbDown />}
            >
              {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default UserManagementPage;
