package com.auction.exception;

import io.grpc.Status;

/**
 * Exception thrown when authentication or authorization fails.
 * Maps to gRPC UNAUTHENTICATED or PERMISSION_DENIED status codes.
 *
 * Used for:
 * - Invalid credentials
 * - Expired tokens
 * - Insufficient permissions
 * - Account locked or disabled
 */
public class AuthenticationException extends GrpcException {
    /**
     * Creates an AuthenticationException for invalid credentials.
     *
     * @param message Description of the authentication error
     */
    public AuthenticationException(String message) {
        super(Status.UNAUTHENTICATED, "AUTHENTICATION_FAILED", message, (String) null);
    }

    /**
     * Creates an AuthenticationException with a specific cause.
     *
     * @param message Description of the authentication error
     * @param cause   The underlying exception
     */
    public AuthenticationException(String message, Throwable cause) {
        super(Status.UNAUTHENTICATED, "AUTHENTICATION_FAILED", message, cause);
    }

    /**
     * Creates a PermissionDeniedException for authorization failures.
     *
     * @param message Description of the authorization error
     * @return AuthenticationException with PERMISSION_DENIED status
     */
    public static AuthenticationException permissionDenied(String message) {
        GrpcException ex = new GrpcException(Status.PERMISSION_DENIED, "PERMISSION_DENIED", message, (String) null);
        throw ex;
    }
}
