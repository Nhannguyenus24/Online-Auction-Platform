package com.auction.grpc;

import com.auction.exception.*;
import io.grpc.Status;
import io.grpc.StatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class for handling exceptions and mapping them to appropriate gRPC status codes.
 *
 * Provides methods to:
 * - Convert exceptions to gRPC StatusException
 * - Map application exceptions to gRPC Status
 * - Handle error logging with context
 * - Create proper error responses with meaningful messages
 */
public class GrpcErrorHandler {
    private static final Logger log = LoggerFactory.getLogger(GrpcErrorHandler.class);

    private GrpcErrorHandler() {
        // Utility class
    }

    /**
     * Converts an exception to a gRPC StatusException.
     *
     * Handles both application exceptions and unexpected runtime exceptions.
     * Logs appropriate error levels based on severity.
     *
     * @param exception The exception to convert
     * @param context   Additional context for logging (method name, operation)
     * @return StatusException with appropriate gRPC Status
     */
    public static StatusException handleException(Throwable exception, String context) {
        if (exception instanceof GrpcException) {
            return handleGrpcException((GrpcException) exception, context);
        } else if (exception instanceof ValidationException) {
            return handleValidationException((ValidationException) exception, context);
        } else if (exception instanceof AuthenticationException) {
            return handleAuthenticationException((AuthenticationException) exception, context);
        } else if (exception instanceof ResourceNotFoundException) {
            return handleResourceNotFoundException((ResourceNotFoundException) exception, context);
        } else if (exception instanceof ServiceException) {
            return handleServiceException((ServiceException) exception, context);
        } else {
            return handleUnexpectedException(exception, context);
        }
    }

    /**
     * Handles GrpcException - extracts status and details for logging.
     */
    private static StatusException handleGrpcException(GrpcException exception, String context) {
        log.debug("gRPC exception in {}: {} [{}] - {}",
            context, exception.getErrorCode(), exception.getGrpcStatus(), exception.getMessage());

        Status status = exception.getGrpcStatus()
            .withDescription(exception.getMessage());

        if (exception.getDetails() != null) {
            status = status.withCause(new Throwable(exception.getDetails()));
        }

        return status.asException();
    }

    /**
     * Handles ValidationException - indicates client error in request.
     */
    private static StatusException handleValidationException(ValidationException exception, String context) {
        String field = exception.getFieldName();
        String message = field != null
            ? String.format("Validation failed for field '%s': %s", field, exception.getMessage())
            : "Validation failed: " + exception.getMessage();

        log.debug("Validation error in {}: {}", context, message);

        return exception.getGrpcStatus()
            .withDescription(message)
            .asException();
    }

    /**
     * Handles AuthenticationException - indicates authentication/authorization failure.
     */
    private static StatusException handleAuthenticationException(AuthenticationException exception, String context) {
        log.warn("Authentication failure in {}: {}", context, exception.getMessage());

        return exception.getGrpcStatus()
            .withDescription(exception.getMessage())
            .asException();
    }

    /**
     * Handles ResourceNotFoundException - resource not found.
     */
    private static StatusException handleResourceNotFoundException(ResourceNotFoundException exception, String context) {
        log.debug("Resource not found in {}: {}", context, exception.getMessage());

        return exception.getGrpcStatus()
            .withDescription(exception.getMessage())
            .asException();
    }

    /**
     * Handles ServiceException - service operation failure.
     */
    private static StatusException handleServiceException(ServiceException exception, String context) {
        if (exception.getErrorType() == ServiceException.ServiceErrorType.INTERNAL_ERROR) {
            log.error("Service error in {}: {}", context, exception.getMessage(), exception.getCause());
        } else {
            log.warn("Service error in {}: {} [{}]", context, exception.getMessage(), exception.getErrorType());
        }

        Status status = exception.getGrpcStatus()
            .withDescription(exception.getMessage());

        if (exception.getCause() != null) {
            status = status.withCause(exception.getCause());
        }

        return status.asException();
    }

    /**
     * Handles unexpected exceptions - logs as error and returns INTERNAL status.
     */
    private static StatusException handleUnexpectedException(Throwable exception, String context) {
        log.error("Unexpected error in {}: {}", context, exception.getMessage(), exception);

        return Status.INTERNAL
            .withDescription("Internal server error: " + exception.getMessage())
            .withCause(exception)
            .asException();
    }

    /**
     * Creates a proper gRPC Status from a Status code and message.
     *
     * @param status  The gRPC status code
     * @param message The error message
     * @return StatusException ready to be thrown
     */
    public static StatusException toStatusException(Status status, String message) {
        return status.withDescription(message).asException();
    }

    /**
     * Converts HTTP status codes to gRPC Status codes.
     * Useful when calling HTTP services from gRPC services.
     *
     * @param httpStatus The HTTP status code
     * @param message    The error message
     * @return gRPC Status
     */
    public static Status httpStatusToGrpcStatus(int httpStatus, String message) {
        if (httpStatus >= 200 && httpStatus < 300) {
            return Status.OK;
        } else if (httpStatus == 400 || httpStatus == 422) {
            return Status.INVALID_ARGUMENT;
        } else if (httpStatus == 401) {
            return Status.UNAUTHENTICATED;
        } else if (httpStatus == 403) {
            return Status.PERMISSION_DENIED;
        } else if (httpStatus == 404) {
            return Status.NOT_FOUND;
        } else if (httpStatus == 408) {
            return Status.DEADLINE_EXCEEDED;
        } else if (httpStatus == 409) {
            return Status.FAILED_PRECONDITION;
        } else if (httpStatus == 429) {
            return Status.RESOURCE_EXHAUSTED;
        } else if (httpStatus >= 500) {
            return Status.INTERNAL;
        } else if (httpStatus == 503) {
            return Status.UNAVAILABLE;
        } else {
            return Status.UNKNOWN;
        }
    }
}
