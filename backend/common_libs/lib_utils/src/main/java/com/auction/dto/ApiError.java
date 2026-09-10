package com.auction.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Error response structure for API endpoints.
 * Provides detailed error information including error code, message, details, timestamp, and path.
 * This is used in error scenarios to give clients comprehensive information about what went wrong.
 *
 * @author Claude
 * @version 1.0.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    
    /**
     * HTTP status code associated with this error.
     */
    private int statusCode;
    
    /**
     * Unique error code identifier (e.g., "INVALID_EMAIL", "USER_NOT_FOUND").
     * Facilitates programmatic error handling by clients.
     */
    private String code;
    
    /**
     * Human-readable error message describing what went wrong.
     */
    private String message;
    
    /**
     * Additional error details as key-value pairs.
     * Useful for field validation errors or complex error scenarios.
     * Example: {"email": "Invalid format", "password": "Too short"}
     */
    private Map<String, Object> details;
    
    /**
     * Timestamp when the error occurred.
     */
    private LocalDateTime timestamp;
    
    /**
     * The request path that caused this error.
     */
    private String path;

    // ==================== Constructors ====================

    /**
     * Default constructor initializing timestamp to current time.
     */
    public ApiError() {
        this.timestamp = LocalDateTime.now();
        this.details = new HashMap<>();
    }

    /**
     * Constructs an ApiError with status code, error code, and message.
     *
     * @param statusCode the HTTP status code
     * @param code the unique error code identifier
     * @param message the error message
     */
    public ApiError(int statusCode, String code, String message) {
        this();
        this.statusCode = statusCode;
        this.code = code;
        this.message = message;
    }

    /**
     * Constructs an ApiError with status code, error code, message, and path.
     *
     * @param statusCode the HTTP status code
     * @param code the unique error code identifier
     * @param message the error message
     * @param path the request path that caused the error
     */
    public ApiError(int statusCode, String code, String message, String path) {
        this(statusCode, code, message);
        this.path = path;
    }

    /**
     * Constructs an ApiError with all fields including details.
     *
     * @param statusCode the HTTP status code
     * @param code the unique error code identifier
     * @param message the error message
     * @param details additional error details
     * @param path the request path that caused the error
     */
    public ApiError(int statusCode, String code, String message, Map<String, Object> details, String path) {
        this(statusCode, code, message, path);
        if (details != null) {
            this.details.putAll(details);
        }
    }

    // ==================== Static Factory Methods ====================

    /**
     * Creates an ApiError for bad request (400) responses.
     *
     * @param message the error message
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError badRequest(String message, String path) {
        return new ApiError(400, "BAD_REQUEST", message, path);
    }

    /**
     * Creates an ApiError for unauthorized (401) responses.
     *
     * @param message the error message
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError unauthorized(String message, String path) {
        return new ApiError(401, "UNAUTHORIZED", message, path);
    }

    /**
     * Creates an ApiError for forbidden (403) responses.
     *
     * @param message the error message
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError forbidden(String message, String path) {
        return new ApiError(403, "FORBIDDEN", message, path);
    }

    /**
     * Creates an ApiError for not found (404) responses.
     *
     * @param message the error message
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError notFound(String message, String path) {
        return new ApiError(404, "NOT_FOUND", message, path);
    }

    /**
     * Creates an ApiError for conflict (409) responses.
     *
     * @param message the error message
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError conflict(String message, String path) {
        return new ApiError(409, "CONFLICT", message, path);
    }

    /**
     * Creates an ApiError for internal server error (500) responses.
     *
     * @param message the error message
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError internalServerError(String message, String path) {
        return new ApiError(500, "INTERNAL_SERVER_ERROR", message, path);
    }

    /**
     * Creates an ApiError for validation errors.
     *
     * @param message the error message
     * @param details the validation details (field names to error messages)
     * @param path the request path
     * @return a new ApiError instance
     */
    public static ApiError validationError(String message, Map<String, Object> details, String path) {
        return new ApiError(400, "VALIDATION_ERROR", message, details, path);
    }

    // ==================== Builder Pattern Support ====================

    /**
     * Adds a detail entry to this error.
     *
     * @param key the detail key
     * @param value the detail value
     * @return this ApiError instance for method chaining
     */
    public ApiError addDetail(String key, Object value) {
        this.details.put(key, value);
        return this;
    }

    /**
     * Adds multiple details to this error.
     *
     * @param detailsMap the map of details to add
     * @return this ApiError instance for method chaining
     */
    public ApiError addDetails(Map<String, Object> detailsMap) {
        if (detailsMap != null) {
            this.details.putAll(detailsMap);
        }
        return this;
    }

    // ==================== Getters and Setters ====================

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details != null ? details : new HashMap<>();
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
