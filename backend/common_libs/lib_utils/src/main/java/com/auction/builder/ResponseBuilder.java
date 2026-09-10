package com.auction.builder;

import com.auction.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Mono;

/**
 * Centralized response builder for consistent API responses
 * Provides helper methods to construct ApiResponse<T> and Mono<ResponseEntity<ApiResponse<T>>>
 */
public class ResponseBuilder {

    /**
     * Creates a successful response with data
     * @param data The response data
     * @param <T> Type of data
     * @return ApiResponse with success=true and status 200
     */
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.ok(data);
    }

    /**
     * Creates a successful response with custom message and data
     * @param message Custom message
     * @param data The response data
     * @param <T> Type of data
     * @return ApiResponse with success=true and status 200
     */
    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.ok(message, data);
    }

    /**
     * Creates a success response (201 Created)
     * @param data The response data
     * @param <T> Type of data
     * @return ApiResponse with success=true and status 201
     */
    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.created(data);
    }

    /**
     * Creates a bad request response (400)
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and status 400
     */
    public static <T> ApiResponse<T> badRequest(String message) {
        return ApiResponse.badRequest(message);
    }

    /**
     * Creates an unauthorized response (401)
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and status 401
     */
    public static <T> ApiResponse<T> unauthorized(String message) {
        return ApiResponse.unauthorized(message);
    }

    /**
     * Creates a forbidden response (403)
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and status 403
     */
    public static <T> ApiResponse<T> forbidden(String message) {
        return ApiResponse.forbidden(message);
    }

    /**
     * Creates a not found response (404)
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and status 404
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return ApiResponse.notFound(message);
    }

    /**
     * Creates a conflict response (409)
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and status 409
     */
    public static <T> ApiResponse<T> conflict(String message) {
        return ApiResponse.conflict(message);
    }

    /**
     * Creates an internal server error response (500)
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and status 500
     */
    public static <T> ApiResponse<T> internalServerError(String message) {
        return ApiResponse.internalServerError(message);
    }

    /**
     * Creates a custom error response
     * @param statusCode HTTP status code
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false and specified status code
     */
    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return ApiResponse.error(statusCode, message);
    }

    // Mono<ResponseEntity<ApiResponse<T>>> helpers for reactive endpoints

    /**
     * Creates a Mono response with OK status
     * @param data The response data
     * @param <T> Type of data
     * @return Mono of ResponseEntity with OK status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoOk(T data) {
        return Mono.just(ResponseEntity.ok(ApiResponse.ok(data)));
    }

    /**
     * Creates a Mono response with OK status and custom message
     * @param message Custom message
     * @param data The response data
     * @param <T> Type of data
     * @return Mono of ResponseEntity with OK status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoOk(String message, T data) {
        return Mono.just(ResponseEntity.ok(ApiResponse.ok(message, data)));
    }

    /**
     * Creates a Mono response with CREATED status
     * @param data The response data
     * @param <T> Type of data
     * @return Mono of ResponseEntity with CREATED status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoCreated(T data) {
        return Mono.just(ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(data)));
    }

    /**
     * Creates a Mono response with BAD_REQUEST status
     * @param message Error message
     * @param <T> Type of data
     * @return Mono of ResponseEntity with BAD_REQUEST status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoBadRequest(String message) {
        return Mono.just(ResponseEntity.badRequest().body(ApiResponse.badRequest(message)));
    }

    /**
     * Creates a Mono response with UNAUTHORIZED status
     * @param message Error message
     * @param <T> Type of data
     * @return Mono of ResponseEntity with UNAUTHORIZED status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoUnauthorized(String message) {
        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.unauthorized(message)));
    }

    /**
     * Creates a Mono response with FORBIDDEN status
     * @param message Error message
     * @param <T> Type of data
     * @return Mono of ResponseEntity with FORBIDDEN status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoForbidden(String message) {
        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.forbidden(message)));
    }

    /**
     * Creates a Mono response with NOT_FOUND status
     * @param message Error message
     * @param <T> Type of data
     * @return Mono of ResponseEntity with NOT_FOUND status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoNotFound(String message) {
        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(message)));
    }

    /**
     * Creates a Mono response with INTERNAL_SERVER_ERROR status
     * @param message Error message
     * @param <T> Type of data
     * @return Mono of ResponseEntity with INTERNAL_SERVER_ERROR status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoInternalServerError(String message) {
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.internalServerError(message)));
    }

    /**
     * Creates a Mono response with custom status
     * @param status HTTP status
     * @param apiResponse ApiResponse object
     * @param <T> Type of data
     * @return Mono of ResponseEntity with specified status
     */
    public static <T> Mono<ResponseEntity<ApiResponse<T>>> monoWithStatus(HttpStatus status, ApiResponse<T> apiResponse) {
        return Mono.just(ResponseEntity.status(status).body(apiResponse));
    }

    // Private constructor to prevent instantiation
    private ResponseBuilder() {
        throw new AssertionError("Cannot instantiate ResponseBuilder");
    }
}
