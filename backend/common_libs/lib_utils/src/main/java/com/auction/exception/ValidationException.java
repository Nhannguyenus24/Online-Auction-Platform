package com.auction.exception;

import io.grpc.Status;

/**
 * Exception thrown when request validation fails at the gRPC boundary.
 * Maps to gRPC INVALID_ARGUMENT status code.
 *
 * Used for:
 * - Missing required fields
 * - Invalid field values
 * - Format violations
 * - Constraint violations
 */
public class ValidationException extends GrpcException {
    private final String fieldName;

    /**
     * Creates a ValidationException for a specific field.
     *
     * @param message   Description of the validation error
     * @param fieldName The field that failed validation
     */
    public ValidationException(String message, String fieldName) {
        super(Status.INVALID_ARGUMENT, "VALIDATION_ERROR", message, null);
        this.fieldName = fieldName;
    }

    /**
     * Creates a ValidationException with a general message.
     *
     * @param message Description of the validation error
     */
    public ValidationException(String message) {
        this(message, null);
    }

    public String getFieldName() {
        return fieldName;
    }
}
