package com.auction.validator;

import com.auction.constants.ValidationConstants;
import java.util.regex.Pattern;

/**
 * Centralized request validation utility
 * Provides methods to validate common request fields with consistent error handling
 */
public class RequestValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(ValidationConstants.EMAIL_REGEX);
    private static final Pattern PHONE_PATTERN = Pattern.compile(ValidationConstants.PHONE_REGEX);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(ValidationConstants.PASSWORD_REGEX);
    private static final Pattern OTP_PATTERN = Pattern.compile(ValidationConstants.OTP_REGEX);
    private static final Pattern USER_ID_PATTERN = Pattern.compile("^\\d+$");

    /**
     * Validates email format
     * @param email Email to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Validates password strength
     * @param password Password to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidPassword(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    /**
     * Validates OTP format (must be exactly 6 digits)
     * @param otp OTP to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidOTP(String otp) {
        return otp != null && OTP_PATTERN.matcher(otp).matches();
    }

    /**
     * Validates phone number format
     * @param phoneNumber Phone number to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidPhoneNumber(String phoneNumber) {
        return phoneNumber == null || phoneNumber.isEmpty() || PHONE_PATTERN.matcher(phoneNumber).matches();
    }

    /**
     * Validates that a string is not blank
     * @param str String to validate
     * @return true if not blank, false otherwise
     */
    public static boolean isNotBlank(String str) {
        return str != null && !str.trim().isEmpty();
    }

    /**
     * Validates user ID format (numeric)
     * @param userId User ID to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidUserId(String userId) {
        return userId != null && USER_ID_PATTERN.matcher(userId).matches();
    }

    /**
     * Validates pagination parameters
     * @param page Page number
     * @param pageSize Page size
     * @return true if valid, false otherwise
     */
    public static boolean isValidPagination(int page, int pageSize) {
        return page > 0 && pageSize > 0 && pageSize <= ValidationConstants.MAX_PAGE_SIZE;
    }

    /**
     * Validates that two passwords are different
     * @param oldPassword Old password
     * @param newPassword New password
     * @return true if different, false otherwise
     */
    public static boolean arePasswordsDifferent(String oldPassword, String newPassword) {
        return oldPassword != null && newPassword != null && !oldPassword.equals(newPassword);
    }

    /**
     * Validates a token string (non-blank)
     * @param token Token to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidToken(String token) {
        return isNotBlank(token);
    }

    /**
     * Validates an email and returns appropriate error message
     * @param email Email to validate
     * @return null if valid, error message otherwise
     */
    public static String validateEmailAndGetError(String email) {
        if (!isNotBlank(email)) {
            return ValidationConstants.ERROR_FIELD_REQUIRED;
        }
        if (!isValidEmail(email)) {
            return ValidationConstants.ERROR_INVALID_EMAIL;
        }
        return null;
    }

    /**
     * Validates a password and returns appropriate error message
     * @param password Password to validate
     * @return null if valid, error message otherwise
     */
    public static String validatePasswordAndGetError(String password) {
        if (!isNotBlank(password)) {
            return ValidationConstants.ERROR_FIELD_REQUIRED;
        }
        if (!isValidPassword(password)) {
            return ValidationConstants.ERROR_INVALID_PASSWORD;
        }
        return null;
    }

    /**
     * Validates OTP and returns appropriate error message
     * @param otp OTP to validate
     * @return null if valid, error message otherwise
     */
    public static String validateOTPAndGetError(String otp) {
        if (!isNotBlank(otp)) {
            return ValidationConstants.ERROR_FIELD_REQUIRED;
        }
        if (!isValidOTP(otp)) {
            return ValidationConstants.ERROR_INVALID_OTP;
        }
        return null;
    }

    // Private constructor to prevent instantiation
    private RequestValidator() {
        throw new AssertionError("Cannot instantiate RequestValidator");
    }
}
