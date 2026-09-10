package com.auction.grpc;

import java.util.concurrent.TimeUnit;

/**
 * Constants for gRPC service configuration and operation.
 *
 * This class centralizes all magic numbers and constants used across gRPC
 * implementations to ensure consistency and ease maintenance.
 */
public class GrpcConstants {

    // ============================================================================
    // TIMEOUT CONFIGURATION (milliseconds)
    // ============================================================================

    /**
     * Default timeout for gRPC service calls.
     * Should be overridden per service based on expected operation duration.
     */
    public static final long DEFAULT_TIMEOUT_MS = 30_000L; // 30 seconds

    /**
     * Quick timeout for simple read operations.
     */
    public static final long QUICK_TIMEOUT_MS = 5_000L; // 5 seconds

    /**
     * Medium timeout for database operations.
     */
    public static final long MEDIUM_TIMEOUT_MS = 15_000L; // 15 seconds

    /**
     * Long timeout for complex operations like batch processing.
     */
    public static final long LONG_TIMEOUT_MS = 60_000L; // 60 seconds

    /**
     * Timeout for authentication operations.
     */
    public static final long AUTH_TIMEOUT_MS = 10_000L; // 10 seconds

    /**
     * Timeout for file upload/download operations.
     */
    public static final long FILE_OPERATION_TIMEOUT_MS = 120_000L; // 2 minutes

    // ============================================================================
    // KEEP-ALIVE CONFIGURATION
    // ============================================================================

    /**
     * Time interval for keep-alive pings in seconds.
     * Helps detect dead connections and prevents idle connection closure.
     */
    public static final long KEEP_ALIVE_TIME_SECONDS = 30L;

    /**
     * Timeout for keep-alive ping response in seconds.
     */
    public static final long KEEP_ALIVE_TIMEOUT_SECONDS = 10L;

    // ============================================================================
    // RETRY CONFIGURATION
    // ============================================================================

    /**
     * Maximum number of retry attempts for transient failures.
     */
    public static final int MAX_RETRY_ATTEMPTS = 3;

    /**
     * Initial backoff delay for retries in milliseconds.
     */
    public static final long INITIAL_BACKOFF_MS = 100L;

    /**
     * Maximum backoff delay for retries in milliseconds.
     */
    public static final long MAX_BACKOFF_MS = 10_000L;

    /**
     * Backoff multiplier for exponential backoff strategy.
     */
    public static final double BACKOFF_MULTIPLIER = 1.5;

    // ============================================================================
    // VALIDATION CONSTRAINTS
    // ============================================================================

    /**
     * Maximum length for string fields in requests.
     */
    public static final int MAX_STRING_LENGTH = 1000;

    /**
     * Maximum length for message body/description fields.
     */
    public static final int MAX_MESSAGE_LENGTH = 5000;

    /**
     * Maximum length for email addresses.
     */
    public static final int MAX_EMAIL_LENGTH = 254; // RFC 5321

    /**
     * Maximum length for URLs.
     */
    public static final int MAX_URL_LENGTH = 2048;

    /**
     * Maximum allowed request size in bytes (10 MB).
     */
    public static final int MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024;

    /**
     * Maximum number of items in a batch operation.
     */
    public static final int MAX_BATCH_SIZE = 1000;

    /**
     * Maximum number of results to return per page.
     */
    public static final int MAX_PAGE_SIZE = 100;

    /**
     * Default page size if not specified.
     */
    public static final int DEFAULT_PAGE_SIZE = 20;

    // ============================================================================
    // TOKEN AND JWT CONFIGURATION
    // ============================================================================

    /**
     * Access token expiration time in milliseconds (15 minutes).
     */
    public static final long ACCESS_TOKEN_EXPIRATION_MS = 15 * 60 * 1000L;

    /**
     * Refresh token expiration time in milliseconds (7 days).
     */
    public static final long REFRESH_TOKEN_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000L;

    /**
     * OTP expiration time in milliseconds (10 minutes).
     */
    public static final long OTP_EXPIRATION_MS = 10 * 60 * 1000L;

    // ============================================================================
    // CHANNEL CONFIGURATION
    // ============================================================================

    /**
     * Default plaintext flag for gRPC channels (should be false in production).
     */
    public static final boolean DEFAULT_PLAINTEXT = false;

    /**
     * Maximum concurrent streams per connection.
     */
    public static final int MAX_CONCURRENT_STREAMS = 100;

    /**
     * Maximum idle duration before channel closes in seconds.
     */
    public static final long CHANNEL_IDLE_TIMEOUT_SECONDS = 5 * 60; // 5 minutes

    // ============================================================================
    // ERROR CODES
    // ============================================================================

    /**
     * Standard error codes returned in gRPC responses.
     */
    public static final class ErrorCode {
        public static final String SUCCESS = "SUCCESS";
        public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
        public static final String AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED";
        public static final String PERMISSION_DENIED = "PERMISSION_DENIED";
        public static final String RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND";
        public static final String CONFLICT = "CONFLICT";
        public static final String INTERNAL_ERROR = "INTERNAL_ERROR";
        public static final String SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";
        public static final String TIMEOUT = "TIMEOUT";
        public static final String INVALID_REQUEST = "INVALID_REQUEST";

        private ErrorCode() {
            // Utility class
        }
    }

    // ============================================================================
    // LOGGING CONFIGURATION
    // ============================================================================

    /**
     * Enable verbose gRPC logging for debugging.
     * Should be disabled in production.
     */
    public static final boolean ENABLE_VERBOSE_LOGGING = false;

    /**
     * Maximum length of request/response to log.
     * Prevents log bloat from large payloads.
     */
    public static final int MAX_LOG_PAYLOAD_LENGTH = 500;

    private GrpcConstants() {
        // Utility class - no instantiation
    }

    /**
     * Converts timeout configuration to standard TimeUnit.
     */
    public static TimeUnit getDefaultTimeUnit() {
        return TimeUnit.MILLISECONDS;
    }
}
