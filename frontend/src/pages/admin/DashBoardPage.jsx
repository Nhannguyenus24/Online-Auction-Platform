import { useState, useMemo } from 'react';
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
  Edit,
  Delete,
  Add,
  Visibility,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

import StatCard from '../../components/StatCard';

// Mock data generator - in production, replace with API calls
const createMockStats = (period) => {
  const seed = period === 'week' ? 100 : period === 'month' ? 200 : 300;
  const multiplier = period === 'week' ? 1 : period === 'month' ? 4 : 48;
  
  return {
    newAuctions: seed + 20 * multiplier,
    revenue: (seed * 100) + (10000 * multiplier),
    newUsers: (seed / 2) + (30 * multiplier),
    newSellers: (seed / 10) + (5 * multiplier),
    sellerRequests: (seed / 20) + (3 * multiplier),
    trends: {
      newAuctions: seed % 30 - 15,
      revenue: (seed % 20) - 10,
      newUsers: seed % 25 - 12,
      newSellers: seed % 18 - 9,
    },
  };
};

const DashBoardPage = () => {
  const theme = useTheme();
  const [auctionPeriod, setAuctionPeriod] = useState('month');
  const [bidderPeriod, setBidderPeriod] = useState('month');
  const [revenuePeriod, setRevenuePeriod] = useState('month');
  const [auditPeriod, setAuditPeriod] = useState('week');
  
  const auctionStats = useMemo(() => createMockStats(auctionPeriod), [auctionPeriod]);
  const bidderStats = useMemo(() => createMockStats(bidderPeriod), [bidderPeriod]);

  // Revenue chart data
  const revenueData = useMemo(() => {
    if (revenuePeriod === 'week') {
      return [
        { day: 'Mon', revenue: 1200 },
        { day: 'Tue', revenue: 2100 },
        { day: 'Wed', revenue: 1800 },
        { day: 'Thu', revenue: 2800 },
        { day: 'Fri', revenue: 3200 },
        { day: 'Sat', revenue: 4100 },
        { day: 'Sun', revenue: 3500 },
      ];
    } else if (revenuePeriod === 'month') {
      return [
        { day: 'Week 1', revenue: 8500 },
        { day: 'Week 2', revenue: 12300 },
        { day: 'Week 3', revenue: 15600 },
        { day: 'Week 4', revenue: 18900 },
      ];
    } else {
      return [
        { day: 'Jan', revenue: 45000 },
        { day: 'Feb', revenue: 52000 },
        { day: 'Mar', revenue: 48000 },
        { day: 'Apr', revenue: 61000 },
        { day: 'May', revenue: 55000 },
        { day: 'Jun', revenue: 67000 },
        { day: 'Jul', revenue: 72000 },
        { day: 'Aug', revenue: 65000 },
        { day: 'Sep', revenue: 78000 },
        { day: 'Oct', revenue: 82000 },
        { day: 'Nov', revenue: 89000 },
        { day: 'Dec', revenue: 95000 },
      ];
    }
  }, [revenuePeriod]);

  // User growth data
  const { userGrowthData, userGrowthValues, sellerGrowthValues } = useMemo(() => {
    if (bidderPeriod === 'week') {
      return {
        userGrowthData: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        userGrowthValues: [25, 35, 42, 38, 48, 55, 62],
        sellerGrowthValues: [5, 8, 12, 10, 15, 18, 22],
      };
    } else if (bidderPeriod === 'month') {
      return {
        userGrowthData: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        userGrowthValues: [85, 120, 145, 178],
        sellerGrowthValues: [22, 35, 45, 58],
      };
    } else {
      return {
        userGrowthData: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        userGrowthValues: [320, 380, 420, 450, 510, 580, 620, 680, 750, 820, 890, 950],
        sellerGrowthValues: [85, 95, 110, 125, 145, 165, 180, 200, 225, 245, 270, 295],
      };
    }
  }, [bidderPeriod]);

  // Top bidders data
  const topBidders = useMemo(() => [
    {
      id: 1,
      name: 'John Smith',
      totalSpent: 45800,
      auctionsWon: 18,
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    {
      id: 2,
      name: 'Emma Wilson',
      totalSpent: 38200,
      auctionsWon: 15,
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    {
      id: 3,
      name: 'Michael Brown',
      totalSpent: 32500,
      auctionsWon: 12,
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    {
      id: 4,
      name: 'Sophia Davis',
      totalSpent: 28900,
      auctionsWon: 11,
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
    {
      id: 5,
      name: 'James Johnson',
      totalSpent: 25600,
      auctionsWon: 9,
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
  ], []);

  // Category performance data
  const categoryData = useMemo(() => [
    { category: 'Electronics', auctions: 45, revenue: 28500 },
    { category: 'Art', auctions: 32, revenue: 22300 },
    { category: 'Collectibles', auctions: 28, revenue: 18700 },
    { category: 'Fashion', auctions: 25, revenue: 15200 },
    { category: 'Jewelry', auctions: 20, revenue: 12800 },
  ], []);

  // System audit data
  const auditHistory = useMemo(() => {
    const actions = ['Create', 'Update', 'Delete', 'View'];
    const entities = ['Product', 'User', 'Category', 'Auction', 'Bid'];
    const users = ['Admin User', 'Moderator', 'System', 'Super Admin'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      action: actions[i % actions.length],
      entity: entities[i % entities.length],
      user: users[i % users.length],
      timestamp: new Date(Date.now() - i * 3600000).toLocaleString(),
      details: `${actions[i % actions.length]}d ${entities[i % entities.length]} #${100 + i}`,
    }));
  }, []);

  // Audit activity chart data
  const auditActivityData = useMemo(() => {
    if (auditPeriod === 'week') {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        creates: [12, 15, 18, 14, 20, 16, 13],
        updates: [25, 30, 28, 32, 35, 29, 27],
        deletes: [3, 5, 4, 6, 5, 4, 3],
        views: [150, 180, 165, 200, 190, 175, 160],
      };
    } else if (auditPeriod === 'month') {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        creates: [85, 95, 105, 90],
        updates: [180, 200, 195, 210],
        deletes: [25, 30, 28, 32],
        views: [1200, 1350, 1280, 1400],
      };
    } else {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        creates: [320, 350, 380, 360, 400, 420, 410, 430, 450, 440, 470, 490],
        updates: [800, 850, 820, 900, 880, 920, 940, 910, 960, 980, 1000, 1020],
        deletes: [120, 130, 125, 140, 135, 145, 150, 142, 155, 160, 158, 165],
        views: [5000, 5500, 5200, 5800, 5600, 6000, 6200, 5900, 6400, 6600, 6800, 7000],
      };
    }
  }, [auditPeriod]);

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
    </Stack>
  );

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
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your auction platform.
          </Typography>
        </Box>

        {/* SECTION 1: AUCTION ANALYTICS */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <SectionHeader
            title="Auction Analytics"
            icon={Gavel}
            period={auctionPeriod}
            setPeriod={setAuctionPeriod}
          />
          
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="New Auctions"
                value={auctionStats.newAuctions}
                icon={Gavel}
                trend={auctionStats.trends.newAuctions}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Active Auctions"
                value={145}
                icon={Gavel}
                trend={8}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Completed"
                value={892}
                icon={Assignment}
                trend={12}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Bids"
                value={3245}
                icon={TrendingUp}
                trend={15}
                color={theme.palette.warning.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Auction Status Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Overview of all auction statuses
                </Typography>
                <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400, lg: 450 } }}>
                  <BarChart
                    xAxis={[{ 
                      scaleType: 'band', 
                      data: ['Active', 'Pending', 'Completed', 'Cancelled', 'Expired'] 
                    }]}
                    series={[
                      { 
                        data: [145, 45, 892, 23, 67], 
                        label: 'Auctions',
                        color: theme.palette.primary.main,
                      },
                    ]}
                    height={400}
                    weight="auto"
                    margin={{ left: 60, right: 20, top: 20, bottom: 50 }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Category Performance
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Top performing categories
                </Typography>
                <Stack spacing={2.5}>
                  {categoryData.map((cat) => (
                    <Box key={cat.category}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {cat.category}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {cat.auctions} auctions
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(cat.auctions / 50) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* SECTION 2: BIDDER & SELLER ANALYTICS */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
          <SectionHeader
            title="Bidder & Seller Analytics"
            icon={People}
            period={bidderPeriod}
            setPeriod={setBidderPeriod}
          />
          
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="New Users"
                value={bidderStats.newUsers}
                icon={People}
                trend={bidderStats.trends.newUsers}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="New Sellers"
                value={bidderStats.newSellers}
                icon={Store}
                trend={bidderStats.trends.newSellers}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Seller Requests"
                value={bidderStats.sellerRequests}
                icon={Assignment}
                trend={5}
                color={theme.palette.error.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Active Bidders"
                value={1234}
                icon={Gavel}
                trend={10}
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={4}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  User & Seller Growth Trends
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Monitor user registration and seller onboarding over time
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
                      { 
                        data: sellerGrowthValues, 
                        label: 'New Sellers', 
                        color: theme.palette.warning.main,
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

          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Top Bidders Leaderboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Highest spending users on the platform
                </Typography>
              </Box>
              <Chip label="Top 5" color="primary" variant="outlined" />
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Bidder</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell align="right">Auctions Won</TableCell>
                    <TableCell align="right">Avg. Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topBidders.map((bidder, index) => (
                    <TableRow
                      key={bidder.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          color={index === 0 ? 'primary' : 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar src={bidder.avatar} alt={bidder.name} />
                          <Typography fontWeight={500}>{bidder.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color="success.main">
                          ${bidder.totalSpent.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography>{bidder.auctionsWon}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="text.secondary">
                          ${Math.floor(bidder.totalSpent / bidder.auctionsWon).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Paper>

        {/* SECTION 3: REVENUE ANALYTICS */}
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
                value={createMockStats(revenuePeriod).revenue}
                icon={AttachMoney}
                trend={createMockStats(revenuePeriod).trends.revenue}
                color={theme.palette.success.main}
                prefix="$"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Commission Earned"
                value={Math.floor(createMockStats(revenuePeriod).revenue * 0.15)}
                icon={AttachMoney}
                trend={8}
                color={theme.palette.primary.main}
                prefix="$"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Avg. Transaction"
                value={Math.floor(createMockStats(revenuePeriod).revenue / 120)}
                icon={TrendingUp}
                trend={5}
                color={theme.palette.info.main}
                prefix="$"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Transactions"
                value={567}
                icon={Assignment}
                trend={12}
                color={theme.palette.warning.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
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

            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Revenue by Category
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Top revenue generating categories
                </Typography>
                <Stack spacing={2.5}>
                  {categoryData.map((cat) => (
                    <Box key={cat.category}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {cat.category}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ${cat.revenue.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(cat.revenue / 30000) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.success.main,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* SECTION 4: SYSTEM AUDIT */}
        <Paper sx={{ p: 4, bgcolor: alpha(theme.palette.error.main, 0.02) }}>
          <SectionHeader
            title="System Audit & Security"
            icon={Security}
            period={auditPeriod}
            setPeriod={setAuditPeriod}
          />
          
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Actions"
                value={auditActivityData.creates.reduce((a, b) => a + b, 0) + 
                       auditActivityData.updates.reduce((a, b) => a + b, 0) + 
                       auditActivityData.deletes.reduce((a, b) => a + b, 0)}
                icon={History}
                trend={7}
                color={theme.palette.error.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Create Actions"
                value={auditActivityData.creates.reduce((a, b) => a + b, 0)}
                icon={Add}
                trend={12}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Update Actions"
                value={auditActivityData.updates.reduce((a, b) => a + b, 0)}
                icon={Edit}
                trend={5}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Delete Actions"
                value={auditActivityData.deletes.reduce((a, b) => a + b, 0)}
                icon={Delete}
                trend={-3}
                color={theme.palette.warning.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Audit Activity Timeline
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  System actions breakdown over time
                </Typography>
                <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400, lg: 450 } }}>
                  <LineChart
                    xAxis={[{ scaleType: 'point', data: auditActivityData.labels }]}
                    series={[
                      {
                        data: auditActivityData.creates,
                        label: 'Creates',
                        color: theme.palette.success.main,
                        showMark: true,
                      },
                      {
                        data: auditActivityData.updates,
                        label: 'Updates',
                        color: theme.palette.info.main,
                        showMark: true,
                      },
                      {
                        data: auditActivityData.deletes,
                        label: 'Deletes',
                        color: theme.palette.error.main,
                        showMark: true,
                      },
                    ]}
                    height={400}
                    margin={{ left: 60, right: 20, top: 20, bottom: 50 }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Action Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  System activity breakdown
                </Typography>
                <PieChart
                  series={[
                    {
                      data: [
                        { 
                          id: 0, 
                          value: auditActivityData.creates.reduce((a, b) => a + b, 0), 
                          label: 'Create', 
                          color: theme.palette.success.main 
                        },
                        { 
                          id: 1, 
                          value: auditActivityData.updates.reduce((a, b) => a + b, 0), 
                          label: 'Update', 
                          color: theme.palette.info.main 
                        },
                        { 
                          id: 2, 
                          value: auditActivityData.deletes.reduce((a, b) => a + b, 0), 
                          label: 'Delete', 
                          color: theme.palette.error.main 
                        },
                        { 
                          id: 3, 
                          value: Math.floor(auditActivityData.views.reduce((a, b) => a + b, 0) / 10), 
                          label: 'View', 
                          color: theme.palette.grey[400] 
                        },
                      ],
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      faded: { innerRadius: 30, additionalRadius: -30 },
                    },
                  ]}
                  height={300}
                  margin={{ right: 5 }}
                  slotProps={{
                    legend: {
                      direction: 'column',
                      position: { vertical: 'middle', horizontal: 'right' },
                      padding: 0,
                    },
                  }}
                />
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Recent Audit History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest system changes and activities
                </Typography>
              </Box>
              <Badge badgeContent={auditHistory.length} color="error">
                <Chip label="Recent" color="default" variant="outlined" />
              </Badge>
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditHistory.map((record) => {
                    const getActionColor = (action) => {
                      switch (action) {
                        case 'Create': return 'success';
                        case 'Update': return 'info';
                        case 'Delete': return 'error';
                        case 'View': return 'default';
                        default: return 'default';
                      }
                    };
                    
                    const getActionIcon = (action) => {
                      switch (action) {
                        case 'Create': return <Add fontSize="small" />;
                        case 'Update': return <Edit fontSize="small" />;
                        case 'Delete': return <Delete fontSize="small" />;
                        case 'View': return <Visibility fontSize="small" />;
                        default: return <History fontSize="small" />;
                      }
                    };

                    return (
                      <TableRow
                        key={record.id}
                        sx={{
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                        }}
                      >
                        <TableCell>
                          <Chip
                            icon={getActionIcon(record.action)}
                            label={record.action}
                            size="small"
                            color={getActionColor(record.action)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {record.entity}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {record.user}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {record.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {record.timestamp}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashBoardPage;
