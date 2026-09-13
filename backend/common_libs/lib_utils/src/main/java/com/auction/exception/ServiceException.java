package com.auction.exception;

import io.grpc.Status;

/**
 * Exception thrown when a service operation fails due to business logic violations
 * or operational issues.
 * Maps to gRPC FAILED_PRECONDITION or INTERNAL status codes.
 *
 * Used for:
 * - Business rule violations
 * - State conflicts (cannot perform action in current state)
 * - Database or external service failures
 * - Resource limitations
 */
public class ServiceException extends GrpcException {
    private final ServiceErrorType errorType;

    public enum ServiceErrorType {
        PRECONDITION_FAILED("FAILED_PRECONDITION", Status.FAILED_PRECONDITION),
        INTERNAL_ERROR("INTERNAL_ERROR", Status.INTERNAL),
        UNAVAILABLE("SERVICE_UNAVAILABLE", Status.UNAVAILABLE),
        DEADLINE_EXCEEDED("DEADLINE_EXCEEDED", Status.DEADLINE_EXCEEDED),
        CONFLICT("CONFLICT", Status.FAILED_PRECONDITION);

        private final String code;
        private final Status status;

        ServiceErrorType(String code, Status status) {
            this.code = code;
            this.status = status;
        }

        public String getCode() {
            return code;
        }

        public Status getStatus() {
            return status;
        }
    }

    /**
     * Creates a ServiceException with a specific error type.
     *
     * @param errorType The type of service error
     * @param message   Description of the error
     */
    public ServiceException(ServiceErrorType errorType, String message) {
        super(errorType.getStatus(), errorType.getCode(), message, (String) null);
        this.errorType = errorType;
    }

    /**
     * Creates a ServiceException with a specific error type and cause.
     *
     * @param errorType The type of service error
     * @param message   Description of the error
     * @param cause     The underlying exception
     */
    public ServiceException(ServiceErrorType errorType, String message, Throwable cause) {
        super(errorType.getStatus(), errorType.getCode(), message, cause);
        this.errorType = errorType;
    }

    public ServiceErrorType getErrorType() {
        return errorType;
    }
}
