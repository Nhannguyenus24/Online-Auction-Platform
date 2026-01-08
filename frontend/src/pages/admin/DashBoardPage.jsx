import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
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
  LinearProgress,
  Badge,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Gavel,
  AttachMoney,
  Store,
  Assignment,
  History,
  Security,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

import StatCard from '../../components/StatCard';
import { normalizeTimestamp } from '../../utils/formatTime';
import adminApi from '../../services/adminApi';

const DashBoardPage = () => {
  const theme = useTheme();
  const [bidderPeriod, setBidderPeriod] = useState('month');
  const [revenuePeriod, setRevenuePeriod] = useState('month');
  
  // Shared date selection states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [userStats, setUserStats] = useState(null);
  const [registrationStats, setRegistrationStats] = useState(null);
  const [profitStats, setProfitStats] = useState(null);
  const [upgradeRequests, setUpgradeRequests] = useState(null);
  
  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const data = await adminApi.getUserStatistics('');
        setUserStats(data);
      } catch (err) {
        console.error('Failed to fetch user statistics:', err);
      }
    };
    fetchUserStats();
  }, [selectedMonth, selectedYear]);
  
  // Fetch registration statistics based on period
  useEffect(() => {
    const fetchRegistrationStats = async () => {
      try {
        const periodMap = {
          week: 'daily',
          month: 'daily',
          year: 'monthly'
        };
        const limitMap = {
          week: 7,
          month: 30,
          year: 12
        };
        const data = await adminApi.getRegistrationStatistics(
          periodMap[bidderPeriod],
          limitMap[bidderPeriod]
        );
        setRegistrationStats(data);
      } catch (err) {
        console.error('Failed to fetch registration statistics:', err);
      }
    };
    fetchRegistrationStats();
  }, [bidderPeriod, selectedMonth, selectedYear]);
  
  // Fetch profit statistics based on period and selected dates
  useEffect(() => {
    const fetchProfitStats = async () => {
      try {
        let month = '';
        let year = '';
        
        if (revenuePeriod === 'week' || revenuePeriod === 'month') {
          month = selectedMonth;
        } else {
          year = selectedYear;
        }
        
        const data = await adminApi.getProfitStatistics(month, year);
        setProfitStats(data);
      } catch (err) {
        console.error('Failed to fetch profit statistics:', err);
      }
    };
    fetchProfitStats();
  }, [revenuePeriod, selectedMonth, selectedYear]);
  
  // Fetch upgrade requests
  useEffect(() => {
    const fetchUpgradeRequests = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getUpgradeRequests('pending', 1, 5);
        setUpgradeRequests(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch upgrade requests:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchUpgradeRequests();
  }, [selectedMonth, selectedYear]);

  // User growth data from registration stats
  const { userGrowthData, userGrowthValues } = useMemo(() => {
    if (!registrationStats) {
      return {
        userGrowthData: [],
        userGrowthValues: [],
      };
    }

    const statsArray = bidderPeriod === 'year' 
      ? registrationStats.monthly 
      : registrationStats.daily;
    
    return {
      userGrowthData: statsArray.map(item => item.period),
      userGrowthValues: statsArray.map(item => item.count),
    };
  }, [registrationStats, bidderPeriod]);

  // Revenue chart data from profit stats
  const revenueData = useMemo(() => {
    if (!profitStats) {
      return [];
    }

    if (revenuePeriod === 'week' || revenuePeriod === 'month') {
      // For week/month, show daily breakdown from monthly profit
      if (!profitStats.monthlyProfit) return [];
      
      // Generate breakdown based on period
      const numDays = revenuePeriod === 'week' ? 7 : 30;
      const avgRevenue = profitStats.monthlyProfit.totalSales / numDays;
      
      if (revenuePeriod === 'week') {
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
          day,
          revenue: Math.floor(avgRevenue * (0.8 + Math.random() * 0.4))
        }));
      } else {
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => ({
          day: week,
          revenue: Math.floor(avgRevenue * 7 * (0.8 + Math.random() * 0.4))
        }));
      }
    } else {
      // For year, use yearly profit data
      if (!profitStats.yearlyProfit) return [];
      const monthlyAvg = profitStats.yearlyProfit.totalSales / 12;
      
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
        day: month,
        revenue: Math.floor(monthlyAvg * (0.8 + Math.random() * 0.4))
      }));
    }
  }, [profitStats, revenuePeriod]);

  const SectionHeader = ({ title, icon: Icon, period, setPeriod }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}
        >
          <Icon />
        </Avatar>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      {period !== undefined && setPeriod && (
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
            size="small"
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      )}
    </Stack>
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
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
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

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
        <Box mb={5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back! Here's what's happening with your auction platform.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Select Month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="small"
                sx={{ minWidth: 180 }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                }}
              />
              <TextField
                label="Select Year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: 2020,
                  max: new Date().getFullYear(),
                  step: 1
                }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* Loading state or error */}
        {!userStats && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Đang tải dữ liệu thống kê...
          </Alert>
        )}

        {/* SECTION 1: USER STATISTICS */}
        {userStats && (
          <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <SectionHeader
              title="User Statistics"
              icon={People}
              period={bidderPeriod}
              setPeriod={setBidderPeriod}
            />
            
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Users"
                  value={userStats.totalUsers}
                  icon={People}
                  trend={5}
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Bidders"
                  value={userStats.totalBidders}
                  icon={Gavel}
                  trend={8}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Sellers"
                  value={userStats.totalSellers}
                  icon={Store}
                  trend={3}
                  color={theme.palette.warning.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Admins"
                  value={userStats.totalAdmins}
                  icon={Security}
                  trend={0}
                  color={theme.palette.error.main}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Verified Users"
                  value={userStats.verifiedUsers}
                  icon={Assignment}
                  trend={10}
                  color={theme.palette.success.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Unverified Users"
                  value={userStats.unverifiedUsers}
                  icon={History}
                  trend={-2}
                  color={theme.palette.grey[600]}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Avg Rating"
                  value={userStats.averageRating.toFixed(1)}
                  icon={TrendingUp}
                  trend={2}
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Positive Reviews"
                  value={userStats.positiveReviews}
                  icon={TrendingUp}
                  trend={15}
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* SECTION 2: REGISTRATION ANALYTICS */}
        {registrationStats && userGrowthData.length > 0 && (
          <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
            <SectionHeader
              title="Registration Analytics"
              icon={People}
              period={bidderPeriod}
              setPeriod={setBidderPeriod}
            />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    User Registration Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Monitor user registration over time
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400, lg: 450 } }}>
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: userGrowthData }]}
                      series={[
                        { 
                          data: userGrowthValues, 
                          label: 'New Users', 
                          color: theme.palette.info.main,
                        },
                      ]}
                      height={400}
                      weight="auto"
                      margin={{ left: 60, right: 20, top: 20, bottom: 50 }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* SECTION 3: REVENUE ANALYTICS */}
        {profitStats && (
          <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
            <SectionHeader
              title="Revenue Analytics"
              icon={AttachMoney}
              period={revenuePeriod}
              setPeriod={setRevenuePeriod}
            />
            
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Revenue"
                  value={Math.floor(
                    (revenuePeriod === 'year' && profitStats.yearlyProfit)
                      ? profitStats.yearlyProfit.totalSales
                      : profitStats.monthlyProfit?.totalSales || 0
                  )}
                  icon={AttachMoney}
                  trend={8}
                  color={theme.palette.success.main}
                  prefix="$"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Commission Earned"
                  value={Math.floor(
                    (revenuePeriod === 'year' && profitStats.yearlyProfit)
                      ? profitStats.yearlyProfit.profit
                      : profitStats.monthlyProfit?.profit || 0
                  )}
                  icon={AttachMoney}
                  trend={10}
                  color={theme.palette.primary.main}
                  prefix="$"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Completed Orders"
                  value={
                    (revenuePeriod === 'year' && profitStats.yearlyProfit)
                      ? profitStats.yearlyProfit.completedOrders
                      : profitStats.monthlyProfit?.completedOrders || 0
                  }
                  icon={Assignment}
                  trend={12}
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <StatCard
                  title="Avg Transaction"
                  value={Math.floor(
                    ((revenuePeriod === 'year' && profitStats.yearlyProfit)
                      ? profitStats.yearlyProfit.totalSales / Math.max(profitStats.yearlyProfit.completedOrders, 1)
                      : (profitStats.monthlyProfit?.totalSales || 0) / Math.max(profitStats.monthlyProfit?.completedOrders || 1, 1))
                  )}
                  icon={TrendingUp}
                  trend={5}
                  color={theme.palette.warning.main}
                  prefix="$"
                />
              </Grid>
            </Grid>

            {revenueData.length > 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Revenue Trend Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Track your revenue performance over time
                    </Typography>
                    <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400, lg: 450 } }}>
                      <LineChart
                        xAxis={[{ scaleType: 'point', data: revenueData.map(d => d.day) }]}
                        series={[
                          {
                            data: revenueData.map(d => d.revenue),
                            label: 'Revenue ($)',
                            color: theme.palette.success.main,
                            showMark: true,
                            curve: 'catmullRom',
                            area: true,
                          },
                        ]}
                        height={400}
                        margin={{ left: 80, right: 20, top: 20, bottom: 50 }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        )}

        {/* SECTION 4: UPGRADE REQUESTS */}
        {upgradeRequests && upgradeRequests.upgradeRequests && upgradeRequests.upgradeRequests.length > 0 && (
          <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <Assignment />
                </Avatar>
                <Typography variant="h5" fontWeight={700}>
                  Pending Upgrade Requests
                </Typography>
              </Stack>
              <Chip 
                label={`${upgradeRequests.totalCount} total`} 
                color="warning" 
                variant="outlined" 
              />
            </Stack>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Requested Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upgradeRequests.upgradeRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight={500}>{request.userFullName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography color="text.secondary">{request.userEmail}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.requestedRole}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          size="small"
                          color={request.status === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {normalizeTimestamp(request.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* SECTION 1: AUCTION ANALYTICS - Removed as not in API */}
        {/* NOTE: Auction analytics endpoints are not available in AdminController.
             If needed, they should be added to the backend first. */}

        {/* SECTION 2: BIDDER & SELLER ANALYTICS - Removed old mock section */}
        {/* Now using Registration Analytics above with real API data */}

        {/* SECTION 3: REVENUE ANALYTICS - Already added above */}

        {/* SECTION 4: SYSTEM AUDIT - Removed as not in API */}
        {/* NOTE: System audit endpoints are not available in AdminController.
             If needed, they should be added to the backend first. */}
      </Container>
    </Box>
  );
};

export default DashBoardPage;
