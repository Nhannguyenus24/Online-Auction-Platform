import PropTypes from 'prop-types';
import { Box, LinearProgress, Typography } from '@mui/material';

const ProgressBar = ({ 
  value = 0, 
  showLabel = true, 
  color = 'primary',
  height = 8,
  variant = 'determinate',
  label = null,
  sx = {}
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {showLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label || `${Math.round(normalizedValue)}%`}
            </Typography>
          </Box>
        </Box>
      )}
      <LinearProgress
        variant={variant}
        value={normalizedValue}
        color={color}
        sx={{
          height: height,
          borderRadius: 1,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
          },
        }}
      />
    </Box>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number,
  showLabel: PropTypes.bool,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  height: PropTypes.number,
  variant: PropTypes.oneOf(['determinate', 'indeterminate', 'buffer', 'query']),
  label: PropTypes.string,
  sx: PropTypes.object,
};

export default ProgressBar;
