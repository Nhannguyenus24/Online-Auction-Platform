package utils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

public class CurrencyUtils {
    
    private CurrencyUtils() {}

    // Common currency codes
    public static final String USD = "USD";
    public static final String EUR = "EUR";
    public static final String GBP = "GBP";
    public static final String JPY = "JPY";
    public static final String VND = "VND";

    /**
     * Format amount to currency string with default locale (US)
     */
    public static String formatCurrency(BigDecimal amount) {
        return formatCurrency(amount, USD, Locale.US);
    }

    /**
     * Format amount to currency string with specified currency code
     */
    public static String formatCurrency(BigDecimal amount, String currencyCode) {
        return formatCurrency(amount, currencyCode, Locale.US);
    }

    /**
     * Format amount to currency string with specified currency code and locale
     */
    public static String formatCurrency(BigDecimal amount, String currencyCode, Locale locale) {
        if (amount == null) {
            return "";
        }
        NumberFormat formatter = NumberFormat.getCurrencyInstance(locale);
        formatter.setCurrency(Currency.getInstance(currencyCode));
        return formatter.format(amount);
    }

    /**
     * Format amount to currency string (double version)
     */
    public static String formatCurrency(double amount, String currencyCode) {
        return formatCurrency(BigDecimal.valueOf(amount), currencyCode);
    }

    /**
     * Format VND currency
     */
    public static String formatVND(BigDecimal amount) {
        if (amount == null) {
            return "";
        }
        NumberFormat formatter = NumberFormat.getInstance(new Locale("vi", "VN"));
        formatter.setMaximumFractionDigits(0);
        return formatter.format(amount) + " ₫";
    }

    /**
     * Format USD currency
     */
    public static String formatUSD(BigDecimal amount) {
        return formatCurrency(amount, USD, Locale.US);
    }

    /**
     * Format EUR currency
     */
    public static String formatEUR(BigDecimal amount) {
        return formatCurrency(amount, EUR, Locale.GERMANY);
    }

    /**
     * Parse currency string to BigDecimal
     */
    public static BigDecimal parseCurrency(String currencyString) {
        if (currencyString == null || currencyString.trim().isEmpty()) {
            return null;
        }
        try {
            // Remove currency symbols and thousand separators
            String cleaned = currencyString.replaceAll("[^0-9.-]", "");
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Convert currency amount with exchange rate
     */
    public static BigDecimal convertCurrency(BigDecimal amount, BigDecimal exchangeRate) {
        if (amount == null || exchangeRate == null) {
            return null;
        }
        return amount.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Round currency amount to 2 decimal places
     */
    public static BigDecimal roundCurrency(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Add two currency amounts
     */
    public static BigDecimal add(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null && amount2 == null) {
            return BigDecimal.ZERO;
        }
        if (amount1 == null) {
            return amount2;
        }
        if (amount2 == null) {
            return amount1;
        }
        return amount1.add(amount2).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Subtract two currency amounts
     */
    public static BigDecimal subtract(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null) {
            amount1 = BigDecimal.ZERO;
        }
        if (amount2 == null) {
            amount2 = BigDecimal.ZERO;
        }
        return amount1.subtract(amount2).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Multiply currency amount by factor
     */
    public static BigDecimal multiply(BigDecimal amount, BigDecimal factor) {
        if (amount == null || factor == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Divide currency amount by divisor
     */
    public static BigDecimal divide(BigDecimal amount, BigDecimal divisor) {
        if (amount == null || divisor == null || divisor.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(divisor, 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate percentage of amount
     */
    public static BigDecimal calculatePercentage(BigDecimal amount, BigDecimal percentage) {
        if (amount == null || percentage == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(percentage)
                     .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate discount amount
     */
    public static BigDecimal calculateDiscount(BigDecimal originalPrice, BigDecimal discountPercent) {
        return calculatePercentage(originalPrice, discountPercent);
    }

    /**
     * Apply discount to price
     */
    public static BigDecimal applyDiscount(BigDecimal originalPrice, BigDecimal discountPercent) {
        BigDecimal discount = calculateDiscount(originalPrice, discountPercent);
        return subtract(originalPrice, discount);
    }

    /**
     * Calculate tax amount
     */
    public static BigDecimal calculateTax(BigDecimal amount, BigDecimal taxPercent) {
        return calculatePercentage(amount, taxPercent);
    }

    /**
     * Add tax to amount
     */
    public static BigDecimal addTax(BigDecimal amount, BigDecimal taxPercent) {
        BigDecimal tax = calculateTax(amount, taxPercent);
        return add(amount, tax);
    }

    /**
     * Check if amount is valid (not null and not negative)
     */
    public static boolean isValidAmount(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) >= 0;
    }

    /**
     * Check if amount is positive
     */
    public static boolean isPositive(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Compare two amounts
     */
    public static int compare(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null && amount2 == null) {
            return 0;
        }
        if (amount1 == null) {
            return -1;
        }
        if (amount2 == null) {
            return 1;
        }
        return amount1.compareTo(amount2);
    }

    /**
     * Get currency symbol for currency code
     */
    public static String getCurrencySymbol(String currencyCode) {
        try {
            Currency currency = Currency.getInstance(currencyCode);
            return currency.getSymbol(Locale.US);
        } catch (IllegalArgumentException e) {
            return currencyCode;
        }
    }

    /**
     * Format amount with compact notation (e.g., 1.2K, 3.5M)
     */
    public static String formatCompact(BigDecimal amount) {
        if (amount == null) {
            return "";
        }
        double value = amount.doubleValue();
        if (value < 1000) {
            return String.format("%.2f", value);
        } else if (value < 1000000) {
            return String.format("%.1fK", value / 1000);
        } else if (value < 1000000000) {
            return String.format("%.1fM", value / 1000000);
        } else {
            return String.format("%.1fB", value / 1000000000);
        }
    }

    /**
     * Split amount equally into parts
     */
    public static BigDecimal[] splitEqually(BigDecimal amount, int parts) {
        if (amount == null || parts <= 0) {
            return new BigDecimal[0];
        }
        BigDecimal[] result = new BigDecimal[parts];
        BigDecimal perPart = amount.divide(BigDecimal.valueOf(parts), 2, RoundingMode.DOWN);
        BigDecimal remainder = amount.subtract(perPart.multiply(BigDecimal.valueOf(parts)));
        
        for (int i = 0; i < parts; i++) {
            result[i] = perPart;
        }
        // Add remainder to first part
        result[0] = result[0].add(remainder);
        return result;
    }
}
