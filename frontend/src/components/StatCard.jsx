import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  alpha,
  Stack,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ErrorOutline,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, trend, color, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const isPositive = trend >= 0;
  const IconComponent = icon;
  
  // Check if value is null, undefined, or not a valid number
  const isNoData = value === null || value === undefined || (typeof value === 'number' && isNaN(value));
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isAnimatable = !isNoData && !isNaN(numericValue);

  useEffect(() => {
    if (!isAnimatable) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = numericValue / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(increment * currentStep);
      } else {
        setDisplayValue(numericValue);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numericValue, isAnimatable]);

  // Format display value
  const formatValue = (val) => {
    if (Number.isInteger(numericValue)) {
      return Math.floor(val).toLocaleString();
    }
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: isNoData 
          ? `linear-gradient(135deg, ${alpha('#9e9e9e', 0.1)} 0%, ${alpha('#9e9e9e', 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(isNoData ? '#9e9e9e' : color, 0.2)}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}    
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
              {title}
            </Typography>
            
            {isNoData ? (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 1.5 }}>
                <ErrorOutline sx={{ fontSize: 20, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.disabled" fontWeight={600}>
                  No Data
                </Typography>
              </Stack>
            ) : (
              <>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  color={color} 
                  gutterBottom
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {prefix}{formatValue(displayValue)}{suffix}
                </Typography>
                
                {trend !== undefined && trend !== null && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {isPositive ? (
                      <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 18, color: 'error.main' }} />
                    )}
                    <Typography
                      variant="caption"
                      color={isPositive ? 'success.main' : 'error.main'}
                      fontWeight={600}
                    >
                      {Math.abs(trend)}% vs last period
                    </Typography>
                  </Stack>
                )}
              </>
            )}
          </Box>
          
          <Avatar
            sx={{
              bgcolor: alpha(isNoData ? '#9e9e9e' : color, 0.2),
              color: isNoData ? '#9e9e9e' : color,
              width: 56,
              height: 56,
            }}
          >
            <IconComponent sx={{ fontSize: 28 }} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StatCard;