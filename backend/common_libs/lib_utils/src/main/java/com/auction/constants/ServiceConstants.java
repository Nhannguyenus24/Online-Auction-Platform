package com.auction.constants;

/**
 * Service layer constants for standardized values across all services
 * Includes product statuses, queue names, Redis key patterns, timeouts, and common limits
 */
public final class ServiceConstants {

    private ServiceConstants() {
        // Utility class, no instantiation
    }

    // ============================================================================
    // PRODUCT STATUSES
    // ============================================================================
    public static final String PRODUCT_STATUS_ACTIVE = "active";
    public static final String PRODUCT_STATUS_ENDED = "ended";
    public static final String PRODUCT_STATUS_BANNED = "banned";
    public static final String PRODUCT_STATUS_PENDING = "pending";

    // ============================================================================
    // ORDER STATUSES
    // ============================================================================
    public static final String ORDER_STATUS_PENDING = "pending";
    public static final String ORDER_STATUS_PROCESSING = "processing";
    public static final String ORDER_STATUS_SHIPPED = "shipped";
    public static final String ORDER_STATUS_DELIVERED = "delivered";
    public static final String ORDER_STATUS_CANCELLED = "cancelled";

    // ============================================================================
    // USER ROLES
    // ============================================================================
    public static final String ROLE_BIDDER = "bidder";
    public static final String ROLE_SELLER = "seller";
    public static final String ROLE_ADMIN = "admin";

    // ============================================================================
    // PAYMENT STATUSES
    // ============================================================================
    public static final String PAYMENT_STATUS_PENDING = "pending";
    public static final String PAYMENT_STATUS_PROCESSING = "processing";
    public static final String PAYMENT_STATUS_COMPLETED = "completed";
    public static final String PAYMENT_STATUS_FAILED = "failed";

    // ============================================================================
    // RABBIT MQ QUEUES
    // ============================================================================
    public static final String NOTIFICATION_QUEUE = "dev";

    // ============================================================================
    // REDIS KEY PATTERNS
    // ============================================================================
    public static final String REDIS_KEY_OTP_PREFIX = "otp:";
    public static final String REDIS_KEY_FORGOT_PASSWORD_PREFIX = "forgot_password:";
    public static final String REDIS_KEY_AUCTION_BIDS_PATTERN = "auction:%d:bids";
    public static final String REDIS_KEY_BIDDER_PROFILE_PATTERN = "profile:%d:%d";

    // ============================================================================
    // TIMEOUTS AND DURATIONS
    // ============================================================================
    public static final int PLACE_BID_TIMEOUT_SECONDS = 10;
    public static final int BUY_NOW_TIMEOUT_SECONDS = 15;
    public static final long OTP_EXPIRY_MINUTES = 10;
    public static final long BIDDER_PROFILE_EXPIRY_SECONDS = 86400 * 15; // 15 days

    // ============================================================================
    // PAGINATION LIMITS
    // ============================================================================
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final int MIN_PAGE_SIZE = 1;
    public static final int MIN_PAGE = 1;

    // ============================================================================
    // RATING THRESHOLDS
    // ============================================================================
    public static final double MIN_BIDDER_RATING = 0.8; // 80% positive rating required
    public static final int MIN_TOTAL_REVIEWS = 1;

    // ============================================================================
    // BID LIMITS
    // ============================================================================
    public static final int TOP_BIDDERS_LIMIT = 5;
    public static final int TOP_BIDDERS_MAX_LIMIT = 10;
    public static final int TOP_BIDDERS_DEFAULT_LIMIT = 5;

    // ============================================================================
    // CATEGORY LIMITS
    // ============================================================================
    public static final int MAX_CATEGORY_NAME_LENGTH = 100;

    // ============================================================================
    // PRICE LIMITS
    // ============================================================================
    public static final double MAX_PRICE = 1_000_000_000; // 1 billion
    public static final double MIN_PRICE = 0.0;

    // ============================================================================
    // COMMON ERROR MESSAGES
    // ============================================================================
    public static final String ERROR_PRODUCT_NOT_FOUND = "Product not found with id: %d";
    public static final String ERROR_ORDER_NOT_FOUND = "Order not found with id: %d";
    public static final String ERROR_USER_NOT_FOUND = "User not found with id: %d";
    public static final String ERROR_PRODUCT_NOT_ACTIVE = "Product is not active";
    public static final String ERROR_AUCTION_NOT_STARTED = "Auction has not started yet";
    public static final String ERROR_AUCTION_HAS_ENDED = "Auction has ended";
    public static final String ERROR_BID_TOO_LOW = "Max bid amount must be at least %.2f";
    public static final String ERROR_USER_RATING_TOO_LOW = "User rating is too low to participate in this auction";
    public static final String ERROR_BUY_NOW_NOT_AVAILABLE = "Buy now is not available for this product";
    public static final String ERROR_BIDDER_ALREADY_BANNED = "Bidder is already banned from this product";
    public static final String ERROR_UNAUTHORIZED_ACCESS = "Unauthorized: You don't have access to this resource";
    public static final String ERROR_UNAUTHORIZED_ORDER_UPDATE = "Unauthorized: Only the buyer can update payment";
    public static final String ERROR_PAYMENT_INTENT_MISMATCH = "Payment intent ID mismatch";
    public static final String ERROR_INVALID_STATUS = "Invalid status: %s. Valid statuses: %s";
    public static final String ERROR_DUPLICATE_UPGRADE_REQUEST = "You already have a pending upgrade request";
    public static final String ERROR_CATEGORY_NAME_EXISTS = "Category name already exists";
    public static final String ERROR_CATEGORY_HAS_PRODUCTS = "Cannot delete category with existing products";
    public static final String ERROR_CATEGORY_NOT_FOUND = "Category not found";
    public static final String ERROR_PRODUCT_OWNER_MISMATCH = "Unauthorized: You don't own this product";
    public static final String ERROR_NOTIFICATION_NOT_FOUND = "Notification not found or does not belong to user";
    public static final String ERROR_CONVERSATION_NOT_FOUND = "Conversation not found for orderId: %s";
    public static final String ERROR_INVALID_SENDER_ROLE = "Invalid senderRole. Must be SELLER or BIDDER";
    public static final String ERROR_EMPTY_MESSAGE_CONTENT = "Message content cannot be empty";
    public static final String ERROR_DUPLICATE_CONVERSATION = "Conversation with orderId %s already exists";
    public static final String ERROR_MISSING_REQUIRED_FIELD = "%s is required";

    // ============================================================================
    // SUCCESS MESSAGES
    // ============================================================================
    public static final String SUCCESS_BID_PLACED = "Bid placed successfully";
    public static final String SUCCESS_BUY_NOW = "Buy now successful";
    public static final String SUCCESS_WATCHLIST_ADDED = "Added to watchlist";
    public static final String SUCCESS_WATCHLIST_REMOVED = "Removed from watchlist";
    public static final String SUCCESS_BIDDER_REJECTED = "Bidder rejected successfully";
    public static final String SUCCESS_QUESTION_ANSWERED = "Question answered successfully";
    public static final String SUCCESS_PRODUCT_CREATED = "Auction listing created successfully";
    public static final String SUCCESS_DESCRIPTION_APPENDED = "Description appended successfully";
    public static final String SUCCESS_CATEGORY_CREATED = "Category created successfully";
    public static final String SUCCESS_CATEGORY_UPDATED = "Category updated successfully";
    public static final String SUCCESS_CATEGORY_DELETED = "Category deleted successfully";
    public static final String SUCCESS_PRODUCT_REMOVED = "Product removed successfully";
    public static final String SUCCESS_NOTIFICATION_MARKED_READ = "Notification marked as read successfully";
    public static final String SUCCESS_UPGRADE_REQUEST_SUBMITTED = "Upgrade request submitted successfully. Admin will review your request.";
    public static final String SUCCESS_NO_UPGRADE_REQUEST = "No upgrade request found";

    // ============================================================================
    // WARNING MESSAGES
    // ============================================================================
    public static final String WARN_NO_BIDDERS = "No bidders found in Redis after adding bid";
    public static final String WARN_NO_PREVIOUS_BIDDER = "No previous bidder to notify";
    public static final String WARN_BIDDER_PROFILE_NOT_FOUND = "No profile found in Redis for user: %d on product: %d";

    // ============================================================================
    // VALID STATUS LISTS
    // ============================================================================
    public static final java.util.List<String> VALID_ORDER_STATUSES = java.util.Arrays.asList(
        ORDER_STATUS_PENDING,
        ORDER_STATUS_PROCESSING,
        ORDER_STATUS_SHIPPED,
        ORDER_STATUS_DELIVERED,
        ORDER_STATUS_CANCELLED
    );

    public static final java.util.List<String> VALID_PRODUCT_STATUSES = java.util.Arrays.asList(
        PRODUCT_STATUS_ACTIVE,
        PRODUCT_STATUS_ENDED,
        PRODUCT_STATUS_BANNED,
        PRODUCT_STATUS_PENDING
    );

    public static final java.util.List<String> VALID_PAYMENT_STATUSES = java.util.Arrays.asList(
        PAYMENT_STATUS_PENDING,
        PAYMENT_STATUS_PROCESSING,
        PAYMENT_STATUS_COMPLETED,
        PAYMENT_STATUS_FAILED
    );
}
