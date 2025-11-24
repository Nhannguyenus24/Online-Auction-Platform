import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class StringUtils {
    private static final String EMAIL_PATTERN = "^[a-zA-Z\\d_+&*-]+(?:\\.[a-zA-Z\\d_+&*-]+)*@"
        + "(?:[a-zA-Z\\d-]+\\.)+[a-zA-Z]{2,7}$";
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+]?[0-9]{10,15}$");
    
    private StringUtils() {}

    /**
     * Check if object is null or empty string
     */
    public static boolean isNullOrEmpty(Object o) {
        if (o == null) {
            return true;
        } else if (o instanceof String) {
            String s1 = o.toString();
            return "".equals(s1) || "null".equals(s1);
        } else return false;
    }

    /**
     * Check if string is blank (null, empty, or only whitespace)
     */
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * Check if string is not blank
     */
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    /**
     * Validate email format
     */
    public static boolean isValidEmail(String email) {
        if (isNullOrEmpty(email))
            return false;
        return email.matches(EMAIL_PATTERN);
    }

    /**
     * Validate phone number (supports international format)
     */
    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (isBlank(phoneNumber)) {
            return false;
        }
        String cleaned = phoneNumber.replaceAll("[\\s()-]", "");
        return PHONE_PATTERN.matcher(cleaned).matches();
    }

    /**
     * Convert string to list using regex delimiter
     */
    public static List<String> convertsStringToList(String str, String regex) {
        if (isBlank(str)) {
            return new ArrayList<>();
        }
        return Arrays.stream(str.split(regex))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
    }

    /**
     * Convert string to list using comma as delimiter
     */
    public static List<String> convertStringToList(String str) {
        return convertsStringToList(str, ",");
    }

    /**
     * Capitalize first letter of string
     */
    public static String capitalize(String str) {
        if (isBlank(str)) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    /**
     * Capitalize first letter of each word
     */
    public static String capitalizeWords(String str) {
        if (isBlank(str)) {
            return str;
        }
        return Arrays.stream(str.split("\\s+"))
            .map(StringUtils::capitalize)
            .collect(Collectors.joining(" "));
    }

    /**
     * Truncate string to specified length and add ellipsis
     */
    public static String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - 3) + "...";
    }

    /**
     * Remove all whitespace from string
     */
    public static String removeWhitespace(String str) {
        if (str == null) {
            return null;
        }
        return str.replaceAll("\\s+", "");
    }

    /**
     * Convert string to camelCase
     */
    public static String toCamelCase(String str) {
        if (isBlank(str)) {
            return str;
        }
        String[] words = str.split("[\\s_-]+");
        StringBuilder result = new StringBuilder(words[0].toLowerCase());
        for (int i = 1; i < words.length; i++) {
            result.append(capitalize(words[i]));
        }
        return result.toString();
    }

    /**
     * Convert string to snake_case
     */
    public static String toSnakeCase(String str) {
        if (isBlank(str)) {
            return str;
        }
        return str.replaceAll("([a-z])([A-Z])", "$1_$2")
                  .replaceAll("[\\s-]+", "_")
                  .toLowerCase();
    }

    /**
     * Mask sensitive data (show only first and last n characters)
     */
    public static String mask(String str, int visibleChars) {
        if (str == null || str.length() <= visibleChars * 2) {
            return "***";
        }
        String start = str.substring(0, visibleChars);
        String end = str.substring(str.length() - visibleChars);
        return start + "***" + end;
    }

    /**
     * Mask email address
     */
    public static String maskEmail(String email) {
        if (!isValidEmail(email)) {
            return email;
        }
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        if (username.length() <= 2) {
            return "**@" + domain;
        }
        String maskedUsername = username.charAt(0) + "***" + username.charAt(username.length() - 1);
        return maskedUsername + "@" + domain;
    }

    /**
     * Pad string to the left with specified character
     */
    public static String padLeft(String str, int length, char padChar) {
        if (str == null) {
            str = "";
        }
        if (str.length() >= length) {
            return str;
        }
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length - str.length(); i++) {
            result.append(padChar);
        }
        result.append(str);
        return result.toString();
    }

    /**
     * Pad string to the right with specified character
     */
    public static String padRight(String str, int length, char padChar) {
        if (str == null) {
            str = "";
        }
        if (str.length() >= length) {
            return str;
        }
        StringBuilder result = new StringBuilder(str);
        for (int i = 0; i < length - str.length(); i++) {
            result.append(padChar);
        }
        return result.toString();
    }

    /**
     * Check if string contains only digits
     */
    public static boolean isNumeric(String str) {
        if (isBlank(str)) {
            return false;
        }
        return str.matches("-?\\d+(\\.\\d+)?");
    }

    /**
     * Generate random alphanumeric string
     */
    public static String randomAlphanumeric(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            result.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return result.toString();
    }

    /**
     * Default value if string is blank
     */
    public static String defaultIfBlank(String str, String defaultValue) {
        return isBlank(str) ? defaultValue : str;
    }
}
