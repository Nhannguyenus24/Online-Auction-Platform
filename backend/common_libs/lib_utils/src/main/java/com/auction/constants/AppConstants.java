package com.auction.constants;

/**
 * Application-wide constants for the Online Auction Platform.
 * Contains HTTP status messages, cookie settings, token expiration times,
 * pagination defaults, and log message templates.
 *
 * @author Claude
 * @version 1.0.0
 */
public class AppConstants {

    // ==================== HTTP Status Messages ====================

    /**
     * Success response message.
     */
    public static final String HTTP_SUCCESS = "Success";

    /**
     * Resource created successfully message.
     */
    public static final String HTTP_CREATED = "Resource created successfully";

    /**
     * Bad request message.
     */
    public static final String HTTP_BAD_REQUEST = "Bad request";

    /**
     * Unauthorized access message.
     */
    public static final String HTTP_UNAUTHORIZED = "Unauthorized access";

    /**
     * Forbidden access message.
     */
    public static final String HTTP_FORBIDDEN = "Access forbidden";

    /**
     * Resource not found message.
     */
    public static final String HTTP_NOT_FOUND = "Resource not found";

    /**
     * Conflict message (e.g., duplicate resource).
     */
    public static final String HTTP_CONFLICT = "Conflict";

    /**
     * Internal server error message.
     */
    public static final String HTTP_INTERNAL_ERROR = "Internal server error";

    /**
     * Service unavailable message.
     */
    public static final String HTTP_SERVICE_UNAVAILABLE = "Service unavailable";

    // ==================== Cookie Constants ====================

    /**
     * Name of the authentication cookie.
     */
    public static final String COOKIE_AUTH_NAME = "auth_token";

    /**
     * Name of the refresh token cookie.
     */
    public static final String COOKIE_REFRESH_NAME = "refresh_token";

    /**
     * Name of the session cookie.
     */
    public static final String COOKIE_SESSION_NAME = "session_id";

    /**
     * Maximum age for authentication cookie in seconds (1 hour).
     */
    public static final long COOKIE_AUTH_MAX_AGE = 3600L;

    /**
     * Maximum age for refresh token cookie in seconds (7 days).
     */
    public static final long COOKIE_REFRESH_MAX_AGE = 604800L;

    /**
     * Maximum age for session cookie in seconds (24 hours).
     */
    public static final long COOKIE_SESSION_MAX_AGE = 86400L;

    /**
     * Cookie path (root path).
     */
    public static final String COOKIE_PATH = "/";

    /**
     * Cookie domain (empty means domain not restricted).
     */
    public static final String COOKIE_DOMAIN = "";

    /**
     * Flag to enable HttpOnly on cookies.
     */
    public static final boolean COOKIE_HTTP_ONLY = true;

    /**
     * Flag to enable Secure flag on cookies (HTTPS only).
     */
    public static final boolean COOKIE_SECURE = true;

    /**
     * Cookie SameSite attribute value.
     */
    public static final String COOKIE_SAME_SITE = "Strict";

    // ==================== Token Expiration Times ====================

    /**
     * Access token expiration time in seconds (15 minutes).
     */
    public static final long TOKEN_ACCESS_EXPIRY = 900L;

    /**
     * Refresh token expiration time in seconds (7 days).
     */
    public static final long TOKEN_REFRESH_EXPIRY = 604800L;

    /**
     * OTP token expiration time in seconds (5 minutes).
     */
    public static final long TOKEN_OTP_EXPIRY = 300L;

    /**
     * Password reset token expiration time in seconds (1 hour).
     */
    public static final long TOKEN_PASSWORD_RESET_EXPIRY = 3600L;

    /**
     * Email verification token expiration time in seconds (24 hours).
     */
    public static final long TOKEN_EMAIL_VERIFICATION_EXPIRY = 86400L;

    // ==================== Pagination Constants ====================

    /**
     * Default page number (starts from 0).
     */
    public static final int DEFAULT_PAGE = 0;

    /**
     * Default page size (items per page).
     */
    public static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * Maximum page size allowed.
     */
    public static final int MAX_PAGE_SIZE = 100;

    /**
     * Minimum page size allowed.
     */
    public static final int MIN_PAGE_SIZE = 1;

    // ==================== Timeout Constants ====================

    /**
     * Default HTTP request timeout in milliseconds (30 seconds).
     */
    public static final long DEFAULT_HTTP_TIMEOUT = 30000L;

    /**
     * Database query timeout in milliseconds (60 seconds).
     */
    public static final long DEFAULT_DB_TIMEOUT = 60000L;

    /**
     * Cache timeout in seconds (1 hour).
     */
    public static final long DEFAULT_CACHE_TIMEOUT = 3600L;

    // ==================== Log Message Templates ====================

    /**
     * Template for successful operation log message.
     * Usage: String.format(LOG_OPERATION_SUCCESS, operation, resource)
     */
    public static final String LOG_OPERATION_SUCCESS = "Operation completed successfully: [operation=%s, resource=%s]";

    /**
     * Template for failed operation log message.
     * Usage: String.format(LOG_OPERATION_FAILED, operation, resource, error)
     */
    public static final String LOG_OPERATION_FAILED = "Operation failed: [operation=%s, resource=%s, error=%s]";

    /**
     * Template for validation error log message.
     * Usage: String.format(LOG_VALIDATION_ERROR, field, value, reason)
     */
    public static final String LOG_VALIDATION_ERROR = "Validation error: [field=%s, value=%s, reason=%s]";

    /**
     * Template for authentication attempt log message.
     * Usage: String.format(LOG_AUTH_ATTEMPT, userId, status)
     */
    public static final String LOG_AUTH_ATTEMPT = "Authentication attempt: [userId=%s, status=%s]";

    /**
     * Template for unauthorized access attempt log message.
     * Usage: String.format(LOG_UNAUTHORIZED_ACCESS, userId, resource)
     */
    public static final String LOG_UNAUTHORIZED_ACCESS = "Unauthorized access attempt: [userId=%s, resource=%s]";

    /**
     * Template for database error log message.
     * Usage: String.format(LOG_DB_ERROR, operation, table, error)
     */
    public static final String LOG_DB_ERROR = "Database error: [operation=%s, table=%s, error=%s]";

    /**
     * Template for external API call log message.
     * Usage: String.format(LOG_API_CALL, service, endpoint, status)
     */
    public static final String LOG_API_CALL = "External API call: [service=%s, endpoint=%s, status=%s]";

    /**
     * Template for performance metrics log message.
     * Usage: String.format(LOG_PERFORMANCE, operation, duration)
     */
    public static final String LOG_PERFORMANCE = "Performance metrics: [operation=%s, duration=%dms]";

    // ==================== Response Headers ====================

    /**
     * Content-Type header value for JSON.
     */
    public static final String CONTENT_TYPE_JSON = "application/json";

    /**
     * Content-Type header value for form data.
     */
    public static final String CONTENT_TYPE_FORM = "application/x-www-form-urlencoded";

    /**
     * Content-Type header value for multipart form data.
     */
    public static final String CONTENT_TYPE_MULTIPART = "multipart/form-data";

    /**
     * X-Request-ID header name.
     */
    public static final String HEADER_REQUEST_ID = "X-Request-ID";

    /**
     * X-Response-Time header name.
     */
    public static final String HEADER_RESPONSE_TIME = "X-Response-Time";

    /**
     * Authorization header name.
     */
    public static final String HEADER_AUTHORIZATION = "Authorization";

    /**
     * Bearer token prefix.
     */
    public static final String BEARER_PREFIX = "Bearer ";

    // ==================== Status Codes ====================

    /**
     * HTTP 200 OK status code.
     */
    public static final int STATUS_OK = 200;

    /**
     * HTTP 201 CREATED status code.
     */
    public static final int STATUS_CREATED = 201;

    /**
     * HTTP 204 NO_CONTENT status code.
     */
    public static final int STATUS_NO_CONTENT = 204;

    /**
     * HTTP 400 BAD_REQUEST status code.
     */
    public static final int STATUS_BAD_REQUEST = 400;

    /**
     * HTTP 401 UNAUTHORIZED status code.
     */
    public static final int STATUS_UNAUTHORIZED = 401;

    /**
     * HTTP 403 FORBIDDEN status code.
     */
    public static final int STATUS_FORBIDDEN = 403;

    /**
     * HTTP 404 NOT_FOUND status code.
     */
    public static final int STATUS_NOT_FOUND = 404;

    /**
     * HTTP 409 CONFLICT status code.
     */
    public static final int STATUS_CONFLICT = 409;

    /**
     * HTTP 500 INTERNAL_SERVER_ERROR status code.
     */
    public static final int STATUS_INTERNAL_ERROR = 500;

    /**
     * HTTP 503 SERVICE_UNAVAILABLE status code.
     */
    public static final int STATUS_SERVICE_UNAVAILABLE = 503;

    // Private constructor to prevent instantiation
    private AppConstants() {
        throw new AssertionError("AppConstants is a utility class and should not be instantiated");
    }
}
