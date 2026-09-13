package com.auction.exception;

import io.grpc.Status;

/**
 * Base exception class for gRPC service operations.
 * Maps application exceptions to appropriate gRPC Status codes for proper error propagation.
 *
 * This exception hierarchy enables consistent error handling across all gRPC services
 * and proper translation to gRPC status codes understood by clients.
 */
public class GrpcException extends RuntimeException {
    private final Status grpcStatus;
    private final String errorCode;
    private final String details;

    /**
     * Creates a GrpcException with full context.
     *
     * @param grpcStatus The gRPC status code for this error
     * @param errorCode  A machine-readable error code for client handling
     * @param message    Human-readable error message
     * @param details    Additional error details for logging/debugging
     */
    public GrpcException(Status grpcStatus, String errorCode, String message, String details) {
        super(message);
        this.grpcStatus = grpcStatus;
        this.errorCode = errorCode;
        this.details = details;
    }

    /**
     * Creates a GrpcException with cause.
     *
     * @param grpcStatus The gRPC status code for this error
     * @param errorCode  A machine-readable error code for client handling
     * @param message    Human-readable error message
     * @param cause      The underlying exception
     */
    public GrpcException(Status grpcStatus, String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.grpcStatus = grpcStatus;
        this.errorCode = errorCode;
        this.details = cause.getMessage();
    }

    /**
     * Creates a GrpcException with status and message only.
     *
     * @param grpcStatus The gRPC status code for this error
     * @param message    Human-readable error message
     */
    public GrpcException(Status grpcStatus, String message) {
        this(grpcStatus, grpcStatus.getCode().name(), message, (String) null);
    }

    public Status getGrpcStatus() {
        return grpcStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getDetails() {
        return details;
    }
}
