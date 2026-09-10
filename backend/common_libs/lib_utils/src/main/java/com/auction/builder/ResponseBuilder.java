package com.auction.builder;

import com.auction.constants.AppConstants;
import com.auction.dto.ApiResponse;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Fluent builder for constructing API responses with proper HTTP status codes and messages.
 * Provides convenient factory methods for common response scenarios and supports method chaining
 * for advanced customization.
 *
 * @author Claude
 * @version 1.0.0
 */
public class ResponseBuilder<T> {

    private ApiResponse<T> response;
    private HttpStatus httpStatus;
    private Map<String, String> headers;

    // ==================== Constructors ====================

    /**
     * Constructs a new ResponseBuilder with an empty ApiResponse.
     */
    public ResponseBuilder() {
        this.response = new ApiResponse<>();
        this.httpStatus = HttpStatus.OK;
        this.headers = new HashMap<>();
    }

    /**
     * Constructs a new ResponseBuilder with an initial ApiResponse.
     *
     * @param response the initial ApiResponse
     */
    public ResponseBuilder(ApiResponse<T> response) {
        this.response = response;
        this.httpStatus = HttpStatus.OK;
        this.headers = new HashMap<>();
    }

    // ==================== Success Response Methods ====================

    /**
     * Builds a successful response (HTTP 200 OK) with data.
     *
     * @param data the response data
     * @param <T> the type of the response data
     * @return ResponseEntity with 200 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
        ApiResponse<T> response = new ApiResponse<>(true, 200, AppConstants.HTTP_SUCCESS, data);
        return ResponseEntity.ok(response);
    }

    /**
     * Builds a successful response (HTTP 200 OK) with data and custom message.
     *
     * @param message the response message
     * @param data the response data
     * @param <T> the type of the response data
     * @return ResponseEntity with 200 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>(true, 200, message, data);
        return ResponseEntity.ok(response);
    }

    /**
     * Builds a resource created response (HTTP 201 CREATED).
     *
     * @param data the created resource data
     * @param <T> the type of the resource
     * @return ResponseEntity with 201 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
        ApiResponse<T> response = new ApiResponse<>(true, 201, AppConstants.HTTP_CREATED, data);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Builds a resource created response (HTTP 201 CREATED) with custom message.
     *
     * @param message the response message
     * @param data the created resource data
     * @param <T> the type of the resource
     * @return ResponseEntity with 201 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> created(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>(true, 201, message, data);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Builds a no-content response (HTTP 204 NO_CONTENT).
     *
     * @param <T> the type of the response
     * @return ResponseEntity with 204 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> noContent() {
        ApiResponse<T> response = new ApiResponse<>(true, 204, "No content");
        return new ResponseEntity<>(response, HttpStatus.NO_CONTENT);
    }

    // ==================== Error Response Methods ====================

    /**
     * Builds a bad request response (HTTP 400 BAD_REQUEST).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 400 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> badRequest(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 400, message);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Builds a validation error response (HTTP 400 BAD_REQUEST).
     *
     * @param message the error message
     * @param validationErrors map of field names to validation errors
     * @param <T> the type of the response
     * @return ResponseEntity with 400 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> validationError(
            String message, Map<String, Object> validationErrors) {
        ApiResponse<T> response = new ApiResponse<>(false, 400, message);
        response.setData(null);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Builds an unauthorized response (HTTP 401 UNAUTHORIZED).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 401 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> unauthorized(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 401, message);
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Builds a forbidden response (HTTP 403 FORBIDDEN).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 403 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> forbidden(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 403, message);
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    /**
     * Builds a not found response (HTTP 404 NOT_FOUND).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 404 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> notFound(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 404, message);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Builds a conflict response (HTTP 409 CONFLICT).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 409 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> conflict(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 409, message);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * Builds an internal server error response (HTTP 500 INTERNAL_SERVER_ERROR).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 500 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> internalServerError(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 500, message);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Builds a service unavailable response (HTTP 503 SERVICE_UNAVAILABLE).
     *
     * @param message the error message
     * @param <T> the type of the response
     * @return ResponseEntity with 503 status
     */
    public static <T> ResponseEntity<ApiResponse<T>> serviceUnavailable(String message) {
        ApiResponse<T> response = new ApiResponse<>(false, 503, message);
        return new ResponseEntity<>(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    // ==================== Builder Methods ====================

    /**
     * Sets the response as successful.
     *
     * @param success whether the response is successful
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> success(boolean success) {
        response.setSuccess(success);
        return this;
    }

    /**
     * Sets the response status code.
     *
     * @param statusCode the HTTP status code
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> statusCode(int statusCode) {
        response.setStatusCode(statusCode);
        this.httpStatus = HttpStatus.valueOf(statusCode);
        return this;
    }

    /**
     * Sets the HTTP status using HttpStatus enum.
     *
     * @param status the HTTP status
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> status(HttpStatus status) {
        this.httpStatus = status;
        response.setStatusCode(status.value());
        return this;
    }

    /**
     * Sets the response message.
     *
     * @param message the response message
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> message(String message) {
        response.setMessage(message);
        return this;
    }

    /**
     * Sets the response data.
     *
     * @param data the response data
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> data(T data) {
        response.setData(data);
        return this;
    }

    /**
     * Sets the response timestamp.
     *
     * @param timestamp the timestamp
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> timestamp(LocalDateTime timestamp) {
        response.setTimestamp(timestamp);
        return this;
    }

    /**
     * Sets the request path.
     *
     * @param path the request path
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> path(String path) {
        response.setPath(path);
        return this;
    }

    /**
     * Adds a custom header to the response.
     *
     * @param name the header name
     * @param value the header value
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> header(String name, String value) {
        this.headers.put(name, value);
        return this;
    }

    /**
     * Adds multiple custom headers to the response.
     *
     * @param headersMap a map of header names to values
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> headers(Map<String, String> headersMap) {
        if (headersMap != null) {
            this.headers.putAll(headersMap);
        }
        return this;
    }

    /**
     * Adds the Content-Type JSON header.
     *
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> contentTypeJson() {
        this.headers.put("Content-Type", "application/json");
        return this;
    }

    /**
     * Adds the Content-Type header.
     *
     * @param contentType the content type value
     * @return this ResponseBuilder for method chaining
     */
    public ResponseBuilder<T> contentType(String contentType) {
        this.headers.put("Content-Type", contentType);
        return this;
    }

    // ==================== Build Methods ====================

    /**
     * Builds the ResponseEntity with the configured settings.
     *
     * @return a ResponseEntity with the configured ApiResponse and HTTP status
     */
    public ResponseEntity<ApiResponse<T>> build() {
        ResponseEntity.BodyBuilder bodyBuilder = ResponseEntity.status(httpStatus);
        
        // Add all custom headers
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            bodyBuilder = bodyBuilder.header(entry.getKey(), entry.getValue());
        }
        
        return bodyBuilder.body(response);
    }

    /**
     * Builds the ResponseEntity as a ResponseEntity with ApiResponse.
     *
     * @return a ResponseEntity with the configured ApiResponse
     */
    public ResponseEntity<? extends ApiResponse<T>> buildAsResponse() {
        return build();
    }

    /**
     * Gets the ApiResponse without wrapping it in a ResponseEntity.
     *
     * @return the ApiResponse
     */
    public ApiResponse<T> buildAsApiResponse() {
        return response;
    }
}
