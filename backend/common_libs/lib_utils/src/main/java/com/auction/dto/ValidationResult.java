package com.auction.dto;

/**
 * Represents the result of a validation check.
 * Encapsulates whether validation succeeded or failed, along with an optional error message.
 *
 * @author Claude
 * @version 1.0.0
 */
public class ValidationResult {
    
    /**
     * Whether the validation passed.
     */
    private final boolean valid;
    
    /**
     * Error message if validation failed, null if validation passed.
     */
    private final String errorMessage;

    // ==================== Constructors ====================

    /**
     * Constructs a ValidationResult with a valid flag and optional error message.
     *
     * @param valid whether the validation passed
     * @param errorMessage the error message if validation failed, null if passed
     */
    public ValidationResult(boolean valid, String errorMessage) {
        this.valid = valid;
        this.errorMessage = errorMessage;
    }

    /**
     * Constructs a successful validation result.
     *
     * @return a ValidationResult indicating success
     */
    public static ValidationResult success() {
        return new ValidationResult(true, null);
    }

    /**
     * Constructs a failed validation result with an error message.
     *
     * @param errorMessage the error message
     * @return a ValidationResult indicating failure
     */
    public static ValidationResult failure(String errorMessage) {
        return new ValidationResult(false, errorMessage);
    }

    // ==================== Getters ====================

    /**
     * Gets whether this validation passed.
     *
     * @return true if validation passed, false otherwise
     */
    public boolean isValid() {
        return valid;
    }

    /**
     * Gets the error message, if any.
     *
     * @return the error message or null if validation passed
     */
    public String getErrorMessage() {
        return errorMessage;
    }
}
