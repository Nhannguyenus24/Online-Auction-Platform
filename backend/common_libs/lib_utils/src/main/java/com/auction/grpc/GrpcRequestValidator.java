package com.auction.grpc;

import com.auction.exception.ValidationException;
import java.util.regex.Pattern;

/**
 * Utility class for validating gRPC request parameters.
 *
 * Provides methods for common validation scenarios:
 * - Required field validation
 * - String length constraints
 * - Numeric range validation
 * - Email/URL format validation
 * - ID format validation
 */
public class GrpcRequestValidator {
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$"
    );

    private static final Pattern URL_PATTERN = Pattern.compile(
        "^https?://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]$"
    );

    private GrpcRequestValidator() {
        // Utility class
    }

    /**
     * Validates that a required string field is present and not empty.
     *
     * @param value     The field value to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is null or empty
     */
    public static void validateRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(
                String.format("Field '%s' is required", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a required integer field is present and valid.
     *
     * @param value     The field value to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is null or invalid
     */
    public static void validateRequired(Integer value, String fieldName) {
        if (value == null) {
            throw new ValidationException(
                String.format("Field '%s' is required", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a required long field is present and valid.
     *
     * @param value     The field value to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is null
     */
    public static void validateRequired(Long value, String fieldName) {
        if (value == null) {
            throw new ValidationException(
                String.format("Field '%s' is required", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a string field does not exceed maximum length.
     *
     * @param value     The field value to validate
     * @param maxLength The maximum allowed length
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value exceeds maxLength
     */
    public static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw new ValidationException(
                String.format("Field '%s' exceeds maximum length of %d characters", fieldName, maxLength),
                fieldName
            );
        }
    }

    /**
     * Validates that a string field has minimum length.
     *
     * @param value     The field value to validate
     * @param minLength The minimum required length
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is shorter than minLength
     */
    public static void validateMinLength(String value, int minLength, String fieldName) {
        if (value == null || value.length() < minLength) {
            throw new ValidationException(
                String.format("Field '%s' must be at least %d characters", fieldName, minLength),
                fieldName
            );
        }
    }

    /**
     * Validates that a numeric field is positive.
     *
     * @param value     The field value to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is not positive
     */
    public static void validatePositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw new ValidationException(
                String.format("Field '%s' must be positive", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a numeric field is positive.
     *
     * @param value     The field value to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is not positive
     */
    public static void validatePositive(Long value, String fieldName) {
        if (value == null || value <= 0) {
            throw new ValidationException(
                String.format("Field '%s' must be positive", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a numeric field is non-negative.
     *
     * @param value     The field value to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is negative
     */
    public static void validateNonNegative(Integer value, String fieldName) {
        if (value != null && value < 0) {
            throw new ValidationException(
                String.format("Field '%s' cannot be negative", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a numeric field is within a range.
     *
     * @param value     The field value to validate
     * @param min       The minimum allowed value
     * @param max       The maximum allowed value
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value is outside range
     */
    public static void validateRange(Integer value, int min, int max, String fieldName) {
        if (value == null || value < min || value > max) {
            throw new ValidationException(
                String.format("Field '%s' must be between %d and %d", fieldName, min, max),
                fieldName
            );
        }
    }

    /**
     * Validates email format.
     *
     * @param email     The email address to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if email format is invalid
     */
    public static void validateEmail(String email, String fieldName) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException(
                String.format("Field '%s' has invalid email format", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates URL format.
     *
     * @param url       The URL to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if URL format is invalid
     */
    public static void validateUrl(String url, String fieldName) {
        if (url == null || !URL_PATTERN.matcher(url).matches()) {
            throw new ValidationException(
                String.format("Field '%s' has invalid URL format", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a value matches a custom pattern.
     *
     * @param value     The value to validate
     * @param pattern   The regex pattern to match
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if value doesn't match pattern
     */
    public static void validatePattern(String value, Pattern pattern, String fieldName) {
        if (value == null || !pattern.matcher(value).matches()) {
            throw new ValidationException(
                String.format("Field '%s' format is invalid", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a numeric value is an acceptable page size.
     *
     * @param pageSize  The page size to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if page size is invalid
     */
    public static void validatePageSize(Integer pageSize, String fieldName) {
        if (pageSize == null || pageSize <= 0 || pageSize > GrpcConstants.MAX_PAGE_SIZE) {
            throw new ValidationException(
                String.format("Field '%s' must be between 1 and %d", fieldName, GrpcConstants.MAX_PAGE_SIZE),
                fieldName
            );
        }
    }

    /**
     * Validates that a page offset is valid.
     *
     * @param offset    The page offset to validate
     * @param fieldName The name of the field (for error messages)
     * @throws ValidationException if offset is invalid
     */
    public static void validatePageOffset(Integer offset, String fieldName) {
        if (offset != null && offset < 0) {
            throw new ValidationException(
                String.format("Field '%s' cannot be negative", fieldName),
                fieldName
            );
        }
    }

    /**
     * Validates that a value is in a set of allowed values.
     *
     * @param value         The value to validate
     * @param allowedValues The set of allowed values
     * @param fieldName     The name of the field (for error messages)
     * @throws ValidationException if value is not in allowed set
     */
    public static void validateEnum(String value, java.util.Set<String> allowedValues, String fieldName) {
        if (value == null || !allowedValues.contains(value)) {
            throw new ValidationException(
                String.format("Field '%s' has invalid value. Allowed values: %s", fieldName, allowedValues),
                fieldName
            );
        }
    }
}
