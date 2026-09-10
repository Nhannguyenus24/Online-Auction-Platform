package com.auction.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private int statusCode;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private String path;

    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(boolean success, int statusCode, String message) {
        this();
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
    }

    public ApiResponse(boolean success, int statusCode, String message, T data) {
        this();
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, 200, "Success", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, 200, message, data);
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return new ApiResponse<>(false, statusCode, message);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, 201, "Resource created successfully", data);
    }

    public static <T> ApiResponse<T> badRequest(String message) {
        return new ApiResponse<>(false, 400, message);
    }

    public static <T> ApiResponse<T> unauthorized(String message) {
        return new ApiResponse<>(false, 401, message);
    }

    public static <T> ApiResponse<T> forbidden(String message) {
        return new ApiResponse<>(false, 403, message);
    }

    public static <T> ApiResponse<T> notFound(String message) {
        return new ApiResponse<>(false, 404, message);
    }

    public static <T> ApiResponse<T> conflict(String message) {
        return new ApiResponse<>(false, 409, message);
    }

    public static <T> ApiResponse<T> internalServerError(String message) {
        return new ApiResponse<>(false, 500, message);
    }

    // Getters and setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
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
