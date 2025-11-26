/**
 * Format a number as Vietnamese currency (VND)
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string
 */
export const formatPrice = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number with thousand separators
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Format a number as a compact string (e.g., 1.2K, 3.5M)
 * @param {number} value - The number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

/**
 * Format a percentage value
 * @param {number} value - The percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};
