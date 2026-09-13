package com.auction.validator;

import com.auction.constants.AppConstants;
import com.auction.constants.ValidationConstants;
import com.auction.dto.ValidationResult;
import com.auction.exception.ValidationException;
import java.util.regex.Pattern;

/**
 * Centralized validation utility for request validation across the application.
 * Provides methods for validating email, password, OTP, phone numbers, and other common fields.
 * Methods return ValidationResult objects for non-throwing validation, or throw ValidationException for early failure.
 *
 * @author Claude
 * @version 1.0.0
 */
public class RequestValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(ValidationConstants.EMAIL_REGEX);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(ValidationConstants.PASSWORD_REGEX);
    private static final Pattern PHONE_PATTERN = Pattern.compile(ValidationConstants.PHONE_REGEX);
    private static final Pattern OTP_PATTERN = Pattern.compile(ValidationConstants.OTP_REGEX);
    private static final Pattern URL_PATTERN = Pattern.compile(ValidationConstants.URL_REGEX);
    private static final Pattern USERNAME_PATTERN = Pattern.compile(ValidationConstants.USERNAME_REGEX);
    private static final Pattern PRODUCT_NAME_PATTERN = Pattern.compile(ValidationConstants.PRODUCT_NAME_REGEX);

    // ==================== Email Validation ====================

    /**
     * Validates an email address format and length.
     *
     * @param email the email to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        String trimmedEmail = email.trim();

        if (trimmedEmail.length() < ValidationConstants.EMAIL_MIN_LENGTH || 
            trimmedEmail.length() > ValidationConstants.EMAIL_MAX_LENGTH) {
            return ValidationResult.failure(ValidationConstants.ERROR_EMAIL_LENGTH);
        }

        if (!EMAIL_PATTERN.matcher(trimmedEmail).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_EMAIL);
        }

        return ValidationResult.success();
    }

    /**
     * Validates an email and throws ValidationException if invalid.
     *
     * @param email the email to validate
     * @throws ValidationException if email is invalid
     */
    public static void validateEmailOrThrow(String email) {
        ValidationResult result = validateEmail(email);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "email");
        }
    }

    // ==================== Password Validation ====================

    /**
     * Validates a password against security requirements.
     * Requirements:
     * - At least 8 characters
     * - At least 1 uppercase letter
     * - At least 1 lowercase letter
     * - At least 1 digit
     * - At least 1 special character (@$!%*?&)
     *
     * @param password the password to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        if (password.length() < ValidationConstants.PASSWORD_MIN_LENGTH || 
            password.length() > ValidationConstants.PASSWORD_MAX_LENGTH) {
            return ValidationResult.failure(ValidationConstants.ERROR_PASSWORD_LENGTH);
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_PASSWORD);
        }

        return ValidationResult.success();
    }

    /**
     * Validates a password and throws ValidationException if invalid.
     *
     * @param password the password to validate
     * @throws ValidationException if password is invalid
     */
    public static void validatePasswordOrThrow(String password) {
        ValidationResult result = validatePassword(password);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "password");
        }
    }

    // ==================== OTP Validation ====================

    /**
     * Validates an OTP (One-Time Password) format.
     * OTP must be exactly 6 digits.
     *
     * @param otp the OTP to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateOTP(String otp) {
        if (otp == null || otp.isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        if (!OTP_PATTERN.matcher(otp).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_OTP);
        }

        return ValidationResult.success();
    }

    /**
     * Validates an OTP and throws ValidationException if invalid.
     *
     * @param otp the OTP to validate
     * @throws ValidationException if OTP is invalid
     */
    public static void validateOTPOrThrow(String otp) {
        ValidationResult result = validateOTP(otp);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "otp");
        }
    }

    // ==================== Phone Number Validation ====================

    /**
     * Validates a phone number format and digit count.
     * Phone must contain only digits, spaces, hyphens, plus, or parentheses.
     * Should have 10-15 digits in total.
     *
     * @param phoneNumber the phone number to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        if (!PHONE_PATTERN.matcher(phoneNumber).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_PHONE);
        }

        String digitsOnly = phoneNumber.replaceAll("[^0-9]", "");
        if (digitsOnly.length() < ValidationConstants.PHONE_MIN_LENGTH || 
            digitsOnly.length() > ValidationConstants.PHONE_MAX_LENGTH) {
            return ValidationResult.failure(ValidationConstants.ERROR_PHONE_LENGTH);
        }

        return ValidationResult.success();
    }

    /**
     * Validates a phone number and throws ValidationException if invalid.
     *
     * @param phoneNumber the phone number to validate
     * @throws ValidationException if phone number is invalid
     */
    public static void validatePhoneNumberOrThrow(String phoneNumber) {
        ValidationResult result = validatePhoneNumber(phoneNumber);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "phoneNumber");
        }
    }

    // ==================== URL Validation ====================

    /**
     * Validates a URL format.
     *
     * @param url the URL to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateURL(String url) {
        if (url == null || url.isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        if (!URL_PATTERN.matcher(url).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_URL);
        }

        return ValidationResult.success();
    }

    /**
     * Validates a URL and throws ValidationException if invalid.
     *
     * @param url the URL to validate
     * @throws ValidationException if URL is invalid
     */
    public static void validateURLOrThrow(String url) {
        ValidationResult result = validateURL(url);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "url");
        }
    }

    // ==================== Username Validation ====================

    /**
     * Validates a username format and length.
     * Username can only contain letters, numbers, underscores, and hyphens.
     *
     * @param username the username to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        String trimmedUsername = username.trim();

        if (trimmedUsername.length() < ValidationConstants.USERNAME_MIN_LENGTH || 
            trimmedUsername.length() > ValidationConstants.USERNAME_MAX_LENGTH) {
            return ValidationResult.failure(ValidationConstants.ERROR_USERNAME_LENGTH);
        }

        if (!USERNAME_PATTERN.matcher(trimmedUsername).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_USERNAME);
        }

        return ValidationResult.success();
    }

    /**
     * Validates a username and throws ValidationException if invalid.
     *
     * @param username the username to validate
     * @throws ValidationException if username is invalid
     */
    public static void validateUsernameOrThrow(String username) {
        ValidationResult result = validateUsername(username);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "username");
        }
    }

    // ==================== Product Name Validation ====================

    /**
     * Validates a product name format and length.
     *
     * @param productName the product name to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateProductName(String productName) {
        if (productName == null || productName.trim().isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        String trimmedName = productName.trim();

        if (trimmedName.length() < ValidationConstants.PRODUCT_NAME_MIN_LENGTH || 
            trimmedName.length() > ValidationConstants.PRODUCT_NAME_MAX_LENGTH) {
            return ValidationResult.failure(ValidationConstants.ERROR_PRODUCT_NAME_LENGTH);
        }

        if (!PRODUCT_NAME_PATTERN.matcher(trimmedName).matches()) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_PRODUCT_NAME);
        }

        return ValidationResult.success();
    }

    /**
     * Validates a product name and throws ValidationException if invalid.
     *
     * @param productName the product name to validate
     * @throws ValidationException if product name is invalid
     */
    public static void validateProductNameOrThrow(String productName) {
        ValidationResult result = validateProductName(productName);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "productName");
        }
    }

    // ==================== Description Validation ====================

    /**
     * Validates a description length.
     *
     * @param description the description to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            return ValidationResult.failure(ValidationConstants.ERROR_FIELD_REQUIRED);
        }

        String trimmedDescription = description.trim();

        if (trimmedDescription.length() < ValidationConstants.DESCRIPTION_MIN_LENGTH || 
            trimmedDescription.length() > ValidationConstants.DESCRIPTION_MAX_LENGTH) {
            return ValidationResult.failure(ValidationConstants.ERROR_DESCRIPTION_LENGTH);
        }

        return ValidationResult.success();
    }

    /**
     * Validates a description and throws ValidationException if invalid.
     *
     * @param description the description to validate
     * @throws ValidationException if description is invalid
     */
    public static void validateDescriptionOrThrow(String description) {
        ValidationResult result = validateDescription(description);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "description");
        }
    }

    // ==================== Generic Field Validation ====================

    /**
     * Validates that a field is not empty or null.
     *
     * @param value the value to validate
     * @param fieldName the name of the field for error messages
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validateNotEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            String errorMessage = fieldName + " " + ValidationConstants.ERROR_FIELD_CANNOT_BE_NULL;
            return ValidationResult.failure(errorMessage);
        }
        return ValidationResult.success();
    }

    /**
     * Validates that a field is not empty or null, throwing ValidationException if invalid.
     *
     * @param value the value to validate
     * @param fieldName the name of the field for error messages
     * @throws ValidationException if the field is empty or null
     */
    public static void validateNotEmptyOrThrow(String value, String fieldName) {
        ValidationResult result = validateNotEmpty(value, fieldName);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), fieldName);
        }
    }

    // ==================== Numeric Validation ====================

    /**
     * Validates that a price is within the acceptable range.
     *
     * @param price the price to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validatePrice(double price) {
        if (price < ValidationConstants.MIN_PRICE || price > ValidationConstants.MAX_PRICE) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_PRICE);
        }
        return ValidationResult.success();
    }

    /**
     * Validates a price and throws ValidationException if invalid.
     *
     * @param price the price to validate
     * @throws ValidationException if price is invalid
     */
    public static void validatePriceOrThrow(double price) {
        ValidationResult result = validatePrice(price);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "price");
        }
    }

    /**
     * Validates that a percentage is between 0 and 100.
     *
     * @param percentage the percentage to validate
     * @return ValidationResult with success status and optional error message
     */
    public static ValidationResult validatePercentage(double percentage) {
        if (percentage < ValidationConstants.MIN_PERCENTAGE || 
            percentage > ValidationConstants.MAX_PERCENTAGE) {
            return ValidationResult.failure(ValidationConstants.ERROR_INVALID_PERCENTAGE);
        }
        return ValidationResult.success();
    }

    /**
     * Validates a percentage and throws ValidationException if invalid.
     *
     * @param percentage the percentage to validate
     * @throws ValidationException if percentage is invalid
     */
    public static void validatePercentageOrThrow(double percentage) {
        ValidationResult result = validatePercentage(percentage);
        if (!result.isValid()) {
            throw new ValidationException(result.getErrorMessage(), "percentage");
        }
    }

    // Private constructor to prevent instantiation
    private RequestValidator() {
        throw new AssertionError("RequestValidator is a utility class and should not be instantiated");
    }

    // ==================== Error Message Helpers ====================

    /**
     * Validates an email and returns the error message instead of a ValidationResult.
     *
     * @param email the email to validate
     * @return the validation error message, or null when the email is valid
     */
    public static String validateEmailAndGetError(String email) {
        ValidationResult result = validateEmail(email);
        return result.isValid() ? null : result.getErrorMessage();
    }

    /**
     * Validates a password and returns the error message instead of a ValidationResult.
     *
     * @param password the password to validate
     * @return the validation error message, or null when the password is valid
     */
    public static String validatePasswordAndGetError(String password) {
        ValidationResult result = validatePassword(password);
        return result.isValid() ? null : result.getErrorMessage();
    }

    /**
     * Validates an OTP and returns the error message instead of a ValidationResult.
     *
     * @param otp the OTP to validate
     * @return the validation error message, or null when the OTP is valid
     */
    public static String validateOTPAndGetError(String otp) {
        ValidationResult result = validateOTP(otp);
        return result.isValid() ? null : result.getErrorMessage();
    }

    /**
     * Checks that a value is present and not only whitespace.
     *
     * @param value the value to check
     * @return true when the value is present and not blank
     */
    public static boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    /**
     * Checks an optional phone number. A blank value is accepted because the
     * field is optional; a supplied value must match the expected format.
     *
     * @param phoneNumber the phone number to check
     * @return true when the phone number is absent or valid
     */
    public static boolean isValidPhoneNumber(String phoneNumber) {
        return !isNotBlank(phoneNumber) || validatePhoneNumber(phoneNumber).isValid();
    }

    /**
     * Checks that a path variable holds a positive numeric user id.
     *
     * @param userId the user id to check
     * @return true when the user id is a positive integer
     */
    public static boolean isValidUserId(String userId) {
        if (!isNotBlank(userId)) {
            return false;
        }
        try {
            return Integer.parseInt(userId.trim()) > 0;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Checks 1-based pagination parameters against the configured page size bounds.
     *
     * @param page the 1-based page number
     * @param pageSize the number of items per page
     * @return true when both parameters are within range
     */
    public static boolean isValidPagination(int page, int pageSize) {
        return page >= 1
            && pageSize >= AppConstants.MIN_PAGE_SIZE
            && pageSize <= AppConstants.MAX_PAGE_SIZE;
    }

    /**
     * Checks that a new password actually differs from the current one.
     *
     * @param oldPassword the current password
     * @param newPassword the replacement password
     * @return true when the two passwords differ
     */
    public static boolean arePasswordsDifferent(String oldPassword, String newPassword) {
        return oldPassword == null ? newPassword != null : !oldPassword.equals(newPassword);
    }

    /**
     * Checks that a token was supplied. This is a presence check only: verifying
     * the signature or issuer is the responsibility of the service that consumes it.
     *
     * @param token the token to check
     * @return true when the token is present and not blank
     */
    public static boolean isValidToken(String token) {
        return token != null && !token.trim().isEmpty();
    }
}
