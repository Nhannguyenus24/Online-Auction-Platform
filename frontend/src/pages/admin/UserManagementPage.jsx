import { useState, useMemo } from 'react';
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
  Rating,
  AvatarGroup,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Gavel,
  Warning,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Visibility,
  FileDownload,
  Refresh,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

import StatCard from '../../components/StatCard';

// Mock data generator
const generateMockUsers = (count) => {
  const roles = ['Bidder', 'Seller', 'Admin'];
  const statuses = ['Active', 'Inactive', 'Suspended', 'Pending'];
  const firstNames = ['John', 'Emma', 'Michael', 'Sophia', 'James', 'Olivia', 'William', 'Ava', 'David', 'Isabella'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const role = roles[i % roles.length];
    const status = statuses[i % statuses.length];
    const reputationScore = Math.floor(Math.random() * 500) + 1;
    const hasParticipated = Math.random() > 0.3;
    
    return {
      id: 1000 + i,
      avatar: `https://i.pravatar.cc/150?img=${(i % 50) + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      role,
      reputationScore,
      status,
      registrationDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      auctionsParticipated: hasParticipated ? Math.floor(Math.random() * 50) + 1 : 0,
      totalSpent: hasParticipated ? Math.floor(Math.random() * 50000) + 1000 : 0,
      isRisky: status === 'Suspended' || reputationScore < 100,
    };
  });
};

const UserManagementPage = () => {
  const theme = useTheme();
  
  // State management
  const [currentDate] = useState(() => Date.now());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Generate mock data
  const allUsers = useMemo(() => generateMockUsers(156), []);

  // Week ago date for filtering new registrations
  const weekAgoDate = useMemo(() => new Date(currentDate - 7 * 24 * 60 * 60 * 1000), [currentDate]);

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery);
      
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allUsers, searchQuery, roleFilter, statusFilter]);

  // Paginated data
  const paginatedUsers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    const newRegistrations = allUsers.filter(u => {
      const regDate = new Date(u.registrationDate);
      return regDate > weekAgoDate;
    }).length;
    const participatedUsers = allUsers.filter(u => u.auctionsParticipated > 0).length;
    const riskyAccounts = allUsers.filter(u => u.isRisky).length;
    
    return {
      totalUsers,
      newRegistrations,
      participatedUsers,
      riskyAccounts,
    };
  }, [allUsers, weekAgoDate]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Suspended': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'error';
      case 'Seller': return 'primary';
      case 'Bidder': return 'info';
      default: return 'default';
    }
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredUsers.map(user => ({
      'ID': user.id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone,
      'Role': user.role,
      'Reputation Score': user.reputationScore,
      'Status': user.status,
      'Registration Date': user.registrationDate,
      'Last Active': user.lastActive,
      'Auctions Participated': user.auctionsParticipated,
      'Total Spent': `$${user.totalSpent.toLocaleString()}`,
      'Is Risky': user.isRisky ? 'Yes' : 'No',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = [
      { wch: 8 },  // ID
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 18 }, // Phone
      { wch: 10 }, // Role
      { wch: 15 }, // Reputation Score
      { wch: 12 }, // Status
      { wch: 18 }, // Registration Date
      { wch: 18 }, // Last Active
      { wch: 20 }, // Auctions Participated
      { wch: 15 }, // Total Spent
      { wch: 10 }, // Is Risky
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate file name with current date
    const date = new Date().toISOString().split('T')[0];
    const fileName = `users_export_${date}.xlsx`;

    // Export file
    XLSX.writeFile(workbook, fileName);
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
            Manage and monitor all user accounts on your platform
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
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={People}
                trend={12}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="New Registrations"
                value={stats.newRegistrations}
                icon={PersonAdd}
                trend={8}
                color={theme.palette.success.main}
                subtitle="Last 7 days"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Auction Participants"
                value={stats.participatedUsers}
                icon={Gavel}
                trend={15}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Risky Accounts"
                value={stats.riskyAccounts}
                icon={Warning}
                trend={-5}
                color={theme.palette.error.main}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* User List Section */}
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
              User List
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Refresh">
              <IconButton color="primary">
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
              placeholder="Search by name, email, or ID..."
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

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>

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
              Showing {paginatedUsers.length} of {filteredUsers.length} users
              {(roleFilter !== 'All' || statusFilter !== 'All' || searchQuery) && ' (filtered)'}
            </Typography>
          </Box>

          {/* User Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="center">Reputation</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
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
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: user.status === 'Active' ? '#44b700' : '#ccc',
                              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                            },
                          }}
                        >
                          <Avatar src={user.avatar} alt={user.name} />
                        </Badge>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name}
                          </Typography>
                          {user.isRisky && (
                            <Chip
                              icon={<Warning fontSize="small" />}
                              label="Risky"
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
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.phone}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role)}
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {user.reputationScore}
                        </Typography>
                        <Rating
                          value={Math.min(5, user.reputationScore / 100)}
                          readOnly
                          size="small"
                          precision={0.5}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={getStatusColor(user.status)}
                        icon={
                          user.status === 'Active' ? <CheckCircle fontSize="small" /> :
                          user.status === 'Suspended' ? <Block fontSize="small" /> : undefined
                        }
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.registrationDate}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastActive}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
          />
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Block fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Suspend Account</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default UserManagementPage;
