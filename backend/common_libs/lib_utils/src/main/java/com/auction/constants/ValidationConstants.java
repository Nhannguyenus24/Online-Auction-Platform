package com.auction.constants;

/**
 * Centralized validation patterns and error messages for the Online Auction Platform.
 * This class contains all regex patterns, field length limits, and validation error messages
 * used across the application.
 *
 * @author Claude
 * @version 1.0.0
 */
public class ValidationConstants {

    // ==================== Regex Patterns ====================

    /**
     * Email validation regex pattern.
     * Matches standard email formats: example@domain.com
     */
    public static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    /**
     * Password validation regex pattern.
     * Requirements:
     * - Minimum 8 characters
     * - At least 1 uppercase letter (A-Z)
     * - At least 1 lowercase letter (a-z)
     * - At least 1 digit (0-9)
     * - At least 1 special character (@$!%*?&)
     */
    public static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

    /**
     * Phone number validation regex pattern.
     * Allows digits, hyphens, plus signs, parentheses, and spaces.
     * Should be validated for length separately (10-15 digits).
     */
    public static final String PHONE_REGEX = "^[0-9\\-\\+\\(\\)\\s]+$";

    /**
     * OTP (One-Time Password) validation regex pattern.
     * Matches exactly 6 digits.
     */
    public static final String OTP_REGEX = "^\\d{6}$";

    /**
     * URL validation regex pattern.
     * Matches HTTP and HTTPS URLs.
     */
    public static final String URL_REGEX = "^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$";

    /**
     * Username validation regex pattern.
     * Allows alphanumeric characters, underscores, and hyphens.
     * Length should be validated separately (3-20 characters).
     */
    public static final String USERNAME_REGEX = "^[a-zA-Z0-9_-]+$";

    /**
     * Product name validation regex pattern.
     * Allows alphanumeric, spaces, and common punctuation.
     */
    public static final String PRODUCT_NAME_REGEX = "^[a-zA-Z0-9\\s\\-\\.,'()&]+$";

    // ==================== Field Length Constants ====================

    /**
     * Minimum length for email addresses.
     */
    public static final int EMAIL_MIN_LENGTH = 5;

    /**
     * Maximum length for email addresses.
     */
    public static final int EMAIL_MAX_LENGTH = 255;

    /**
     * Minimum length for passwords.
     */
    public static final int PASSWORD_MIN_LENGTH = 8;

    /**
     * Maximum length for passwords.
     */
    public static final int PASSWORD_MAX_LENGTH = 128;

    /**
     * Minimum length for usernames.
     */
    public static final int USERNAME_MIN_LENGTH = 3;

    /**
     * Maximum length for usernames.
     */
    public static final int USERNAME_MAX_LENGTH = 50;

    /**
     * Minimum phone number length (digits only).
     */
    public static final int PHONE_MIN_LENGTH = 10;

    /**
     * Maximum phone number length (digits only).
     */
    public static final int PHONE_MAX_LENGTH = 15;

    /**
     * Fixed length for OTP (One-Time Password).
     */
    public static final int OTP_LENGTH = 6;

    /**
     * Minimum length for product names.
     */
    public static final int PRODUCT_NAME_MIN_LENGTH = 3;

    /**
     * Maximum length for product names.
     */
    public static final int PRODUCT_NAME_MAX_LENGTH = 255;

    /**
     * Minimum length for product descriptions.
     */
    public static final int DESCRIPTION_MIN_LENGTH = 10;

    /**
     * Maximum length for product descriptions.
     */
    public static final int DESCRIPTION_MAX_LENGTH = 5000;

    /**
     * Maximum length for short text fields (titles, names).
     */
    public static final int TEXT_SHORT_MAX_LENGTH = 100;

    /**
     * Maximum length for long text fields (descriptions, comments).
     */
    public static final int TEXT_LONG_MAX_LENGTH = 2000;

    // ==================== Validation Error Messages ====================

    /**
     * Error message for invalid email format.
     */
    public static final String ERROR_INVALID_EMAIL = "Invalid email format. Expected format: example@domain.com";

    /**
     * Error message for email length validation.
     */
    public static final String ERROR_EMAIL_LENGTH = "Email must be between " + EMAIL_MIN_LENGTH + " and " + EMAIL_MAX_LENGTH + " characters";

    /**
     * Error message for invalid password format.
     */
    public static final String ERROR_INVALID_PASSWORD = "Password must contain at least 8 characters, including uppercase, lowercase, digit, and special character (@$!%*?&)";

    /**
     * Error message for password length validation.
     */
    public static final String ERROR_PASSWORD_LENGTH = "Password must be between " + PASSWORD_MIN_LENGTH + " and " + PASSWORD_MAX_LENGTH + " characters";

    /**
     * Error message for invalid phone number format.
     */
    public static final String ERROR_INVALID_PHONE = "Invalid phone number format. Phone must contain only digits, spaces, hyphens, plus, or parentheses";

    /**
     * Error message for phone number length validation.
     */
    public static final String ERROR_PHONE_LENGTH = "Phone number must be between " + PHONE_MIN_LENGTH + " and " + PHONE_MAX_LENGTH + " digits";

    /**
     * Error message for invalid OTP format.
     */
    public static final String ERROR_INVALID_OTP = "Invalid OTP format. OTP must be exactly " + OTP_LENGTH + " digits";

    /**
     * Error message for invalid URL format.
     */
    public static final String ERROR_INVALID_URL = "Invalid URL format. Must start with http:// or https://";

    /**
     * Error message for invalid username format.
     */
    public static final String ERROR_INVALID_USERNAME = "Username can only contain letters, numbers, underscores, and hyphens";

    /**
     * Error message for username length validation.
     */
    public static final String ERROR_USERNAME_LENGTH = "Username must be between " + USERNAME_MIN_LENGTH + " and " + USERNAME_MAX_LENGTH + " characters";

    /**
     * Error message for empty/null field.
     */
    public static final String ERROR_FIELD_REQUIRED = "This field is required and cannot be empty";

    /**
     * Error message for null/empty string.
     */
    public static final String ERROR_FIELD_CANNOT_BE_NULL = "Field cannot be null or empty";

    /**
     * Error message for invalid product name format.
     */
    public static final String ERROR_INVALID_PRODUCT_NAME = "Product name contains invalid characters";

    /**
     * Error message for product name length validation.
     */
    public static final String ERROR_PRODUCT_NAME_LENGTH = "Product name must be between " + PRODUCT_NAME_MIN_LENGTH + " and " + PRODUCT_NAME_MAX_LENGTH + " characters";

    /**
     * Error message for description length validation.
     */
    public static final String ERROR_DESCRIPTION_LENGTH = "Description must be between " + DESCRIPTION_MIN_LENGTH + " and " + DESCRIPTION_MAX_LENGTH + " characters";

    /**
     * Generic error message for validation failure.
     */
    public static final String ERROR_VALIDATION_FAILED = "Validation failed";

    // ==================== Numeric Validation Constants ====================

    /**
     * Maximum allowed price value (1 billion).
     */
    public static final double MAX_PRICE = 1_000_000_000.0;

    /**
     * Minimum allowed price value.
     */
    public static final double MIN_PRICE = 0.0;

    /**
     * Minimum percentage value.
     */
    public static final double MIN_PERCENTAGE = 0.0;

    /**
     * Maximum percentage value.
     */
    public static final double MAX_PERCENTAGE = 100.0;

    /**
     * Error message for invalid price range.
     */
    public static final String ERROR_INVALID_PRICE = "Price must be between " + MIN_PRICE + " and " + MAX_PRICE;

    /**
     * Error message for invalid percentage.
     */
    public static final String ERROR_INVALID_PERCENTAGE = "Percentage must be between " + MIN_PERCENTAGE + " and " + MAX_PERCENTAGE;

    // Private constructor to prevent instantiation
    private ValidationConstants() {
        throw new AssertionError("ValidationConstants is a utility class and should not be instantiated");
    }
}
