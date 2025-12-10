package utils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Locale;

public class NumberUtils {
    
    private NumberUtils() {}

    /**
     * Safely parse string to Integer
     */
    public static Integer toInteger(String str) {
        if (str == null || str.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(str.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Parse string to Integer with default value
     */
    public static Integer toInteger(String str, Integer defaultValue) {
        Integer result = toInteger(str);
        return result != null ? result : defaultValue;
    }

    /**
     * Safely parse string to Long
     */
    public static Long toLong(String str) {
        if (str == null || str.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(str.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Parse string to Long with default value
     */
    public static Long toLong(String str, Long defaultValue) {
        Long result = toLong(str);
        return result != null ? result : defaultValue;
    }

    /**
     * Safely parse string to Double
     */
    public static Double toDouble(String str) {
        if (str == null || str.trim().isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(str.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Parse string to Double with default value
     */
    public static Double toDouble(String str, Double defaultValue) {
        Double result = toDouble(str);
        return result != null ? result : defaultValue;
    }

    /**
     * Safely parse string to BigDecimal
     */
    public static BigDecimal toBigDecimal(String str) {
        if (str == null || str.trim().isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(str.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Parse string to BigDecimal with default value
     */
    public static BigDecimal toBigDecimal(String str, BigDecimal defaultValue) {
        BigDecimal result = toBigDecimal(str);
        return result != null ? result : defaultValue;
    }

    /**
     * Round double to specified decimal places
     */
    public static double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException("Decimal places must be >= 0");
        
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    /**
     * Round BigDecimal to specified decimal places
     */
    public static BigDecimal round(BigDecimal value, int places) {
        if (value == null) {
            return null;
        }
        return value.setScale(places, RoundingMode.HALF_UP);
    }

    /**
     * Format number with thousand separators
     */
    public static String formatWithThousandSeparator(Number number) {
        if (number == null) {
            return "";
        }
        NumberFormat formatter = NumberFormat.getInstance(Locale.US);
        return formatter.format(number);
    }

    /**
     * Format number with specified decimal places
     */
    public static String formatDecimal(Number number, int decimalPlaces) {
        if (number == null) {
            return "";
        }
        StringBuilder pattern = new StringBuilder("#,##0");
        if (decimalPlaces > 0) {
            pattern.append(".");
            for (int i = 0; i < decimalPlaces; i++) {
                pattern.append("0");
            }
        }
        DecimalFormat df = new DecimalFormat(pattern.toString());
        return df.format(number);
    }

    /**
     * Calculate percentage
     */
    public static double calculatePercentage(double value, double total) {
        if (total == 0) {
            return 0;
        }
        return (value / total) * 100;
    }

    /**
     * Calculate percentage change
     */
    public static double calculatePercentageChange(double oldValue, double newValue) {
        if (oldValue == 0) {
            return 0;
        }
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Check if number is in range (inclusive)
     */
    public static boolean isInRange(Number number, Number min, Number max) {
        if (number == null) {
            return false;
        }
        double value = number.doubleValue();
        return value >= min.doubleValue() && value <= max.doubleValue();
    }

    /**
     * Get minimum of multiple numbers
     */
    public static <T extends Number & Comparable<T>> T min(T... numbers) {
        if (numbers == null || numbers.length == 0) {
            return null;
        }
        T min = numbers[0];
        for (T num : numbers) {
            if (num.compareTo(min) < 0) {
                min = num;
            }
        }
        return min;
    }

    /**
     * Get maximum of multiple numbers
     */
    public static <T extends Number & Comparable<T>> T max(T... numbers) {
        if (numbers == null || numbers.length == 0) {
            return null;
        }
        T max = numbers[0];
        for (T num : numbers) {
            if (num.compareTo(max) > 0) {
                max = num;
            }
        }
        return max;
    }

    /**
     * Check if number is positive
     */
    public static boolean isPositive(Number number) {
        return number != null && number.doubleValue() > 0;
    }

    /**
     * Check if number is negative
     */
    public static boolean isNegative(Number number) {
        return number != null && number.doubleValue() < 0;
    }

    /**
     * Check if number is zero
     */
    public static boolean isZero(Number number) {
        return number != null && number.doubleValue() == 0;
    }

    /**
     * Clamp value between min and max
     */
    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Convert bytes to human readable format
     */
    public static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.2f %sB", bytes / Math.pow(1024, exp), pre);
    }

    /**
     * Generate random integer in range [min, max]
     */
    public static int randomInt(int min, int max) {
        return (int) (Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random double in range [min, max)
     */
    public static double randomDouble(double min, double max) {
        return Math.random() * (max - min) + min;
    }
}
