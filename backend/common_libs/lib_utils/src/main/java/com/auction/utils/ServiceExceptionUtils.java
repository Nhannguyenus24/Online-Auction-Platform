package com.auction.utils;

import com.auction.constants.ServiceConstants;
import reactor.core.publisher.Mono;

/**
 * Utility for standardized exception handling across services
 * Provides methods to create and handle exceptions with consistent error messages
 */
public final class ServiceExceptionUtils {

    private ServiceExceptionUtils() {
        // Utility class, no instantiation
    }

    /**
     * Create an IllegalArgumentException for product not found
     */
    public static Mono<Void> productNotFound(int productId) {
        return Mono.error(new IllegalArgumentException(
            String.format(ServiceConstants.ERROR_PRODUCT_NOT_FOUND, productId)
        ));
    }

    /**
     * Create an IllegalArgumentException for order not found
     */
    public static Mono<Void> orderNotFound(int orderId) {
        return Mono.error(new IllegalArgumentException(
            String.format(ServiceConstants.ERROR_ORDER_NOT_FOUND, orderId)
        ));
    }

    /**
     * Create an IllegalArgumentException for user not found
     */
    public static Mono<Void> userNotFound(int userId) {
        return Mono.error(new IllegalArgumentException(
            String.format(ServiceConstants.ERROR_USER_NOT_FOUND, userId)
        ));
    }

    /**
     * Create an IllegalStateException for product not active
     */
    public static Mono<Void> productNotActive() {
        return Mono.error(new IllegalStateException(ServiceConstants.ERROR_PRODUCT_NOT_ACTIVE));
    }

    /**
     * Create an IllegalStateException for auction not started
     */
    public static Mono<Void> auctionNotStarted() {
        return Mono.error(new IllegalStateException(ServiceConstants.ERROR_AUCTION_NOT_STARTED));
    }

    /**
     * Create an IllegalStateException for auction ended
     */
    public static Mono<Void> auctionHasEnded() {
        return Mono.error(new IllegalStateException(ServiceConstants.ERROR_AUCTION_HAS_ENDED));
    }

    /**
     * Create an IllegalArgumentException for bid too low
     */
    public static Mono<Void> bidTooLow(double minBid) {
        return Mono.error(new IllegalArgumentException(
            String.format(ServiceConstants.ERROR_BID_TOO_LOW, minBid)
        ));
    }

    /**
     * Create an IllegalArgumentException for user rating too low
     */
    public static Mono<Void> userRatingTooLow() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_USER_RATING_TOO_LOW
        ));
    }

    /**
     * Create an IllegalStateException for buy now not available
     */
    public static Mono<Void> buyNowNotAvailable() {
        return Mono.error(new IllegalStateException(
            ServiceConstants.ERROR_BUY_NOW_NOT_AVAILABLE
        ));
    }

    /**
     * Create an IllegalStateException for bidder already banned
     */
    public static Mono<Void> bidderAlreadyBanned() {
        return Mono.error(new IllegalStateException(
            ServiceConstants.ERROR_BIDDER_ALREADY_BANNED
        ));
    }

    /**
     * Create an IllegalArgumentException for unauthorized access
     */
    public static Mono<Void> unauthorizedAccess() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_UNAUTHORIZED_ACCESS
        ));
    }

    /**
     * Create an IllegalArgumentException for unauthorized order update
     */
    public static Mono<Void> unauthorizedOrderUpdate() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_UNAUTHORIZED_ORDER_UPDATE
        ));
    }

    /**
     * Create an IllegalArgumentException for payment intent mismatch
     */
    public static Mono<Void> paymentIntentMismatch() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_PAYMENT_INTENT_MISMATCH
        ));
    }

    /**
     * Create an IllegalArgumentException for invalid status
     */
    public static Mono<Void> invalidStatus(String status, java.util.List<String> validStatuses) {
        return Mono.error(new IllegalArgumentException(
            String.format(ServiceConstants.ERROR_INVALID_STATUS, status, validStatuses)
        ));
    }

    /**
     * Create an IllegalArgumentException with custom message
     */
    public static Mono<Void> customError(String message) {
        return Mono.error(new IllegalArgumentException(message));
    }

    /**
     * Create an IllegalStateException with custom message
     */
    public static Mono<Void> customStateError(String message) {
        return Mono.error(new IllegalStateException(message));
    }

    /**
     * Handle authorization check - returns Mono.error if not authorized
     */
    public static Mono<Void> checkAuthorization(boolean isAuthorized, String errorMessage) {
        if (!isAuthorized) {
            return Mono.error(new IllegalArgumentException(errorMessage));
        }
        return Mono.empty();
    }

    /**
     * Handle resource found check - returns Mono.error if not found
     */
    public static <T> Mono<T> requireNonNull(T resource, String errorMessage) {
        if (resource == null) {
            return Mono.error(new IllegalArgumentException(errorMessage));
        }
        return Mono.just(resource);
    }

    /**
     * Create an IllegalArgumentException for duplicate upgrade request
     */
    public static Mono<Void> duplicateUpgradeRequest() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_DUPLICATE_UPGRADE_REQUEST
        ));
    }

    /**
     * Create an IllegalArgumentException for category name exists
     */
    public static Mono<Void> categoryNameExists() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_CATEGORY_NAME_EXISTS
        ));
    }

    /**
     * Create an IllegalArgumentException for category has products
     */
    public static Mono<Void> categoryHasProducts() {
        return Mono.error(new IllegalArgumentException(
            ServiceConstants.ERROR_CATEGORY_HAS_PRODUCTS
        ));
    }

    /**
     * Create an IllegalArgumentException for invalid sender role
     */
    public static IllegalArgumentException invalidSenderRole() {
        return new IllegalArgumentException(ServiceConstants.ERROR_INVALID_SENDER_ROLE);
    }

    /**
     * Create an IllegalArgumentException for empty message content
     */
    public static IllegalArgumentException emptyMessageContent() {
        return new IllegalArgumentException(ServiceConstants.ERROR_EMPTY_MESSAGE_CONTENT);
    }

    /**
     * Create an IllegalArgumentException for missing required field
     */
    public static IllegalArgumentException missingRequiredField(String fieldName) {
        return new IllegalArgumentException(
            String.format(ServiceConstants.ERROR_MISSING_REQUIRED_FIELD, fieldName)
        );
    }
}
