package com.auction.config;

/**
 * Constants for application configuration and properties.
 *
 * Centralizes all configuration-related constants to ensure consistency
 * across configuration classes and reduce magic strings/numbers.
 */
public class ConfigConstants {

    // ============================================================================
    // WEB AND HTTP CONFIGURATION
    // ============================================================================

    /**
     * CORS origins configuration defaults.
     */
    public static final class Cors {
        public static final String DEFAULT_ORIGIN_LOCALHOST_3000 = "http://localhost:3000";
        public static final String DEFAULT_ORIGIN_LOCALHOST_5173 = "http://localhost:5173";
        public static final String DEFAULT_ORIGIN_LOCALHOST_8080 = "http://localhost:8080";

        public static final long CORS_MAX_AGE_SECONDS = 3600L; // 1 hour

        private Cors() {
            // Utility class
        }
    }

    /**
     * HTTP method constants.
     */
    public static final class HttpMethods {
        public static final String GET = "GET";
        public static final String POST = "POST";
        public static final String PUT = "PUT";
        public static final String DELETE = "DELETE";
        public static final String PATCH = "PATCH";
        public static final String OPTIONS = "OPTIONS";

        private HttpMethods() {
            // Utility class
        }
    }

    /**
     * HTTP headers.
     */
    public static final class Headers {
        public static final String CONTENT_TYPE = "Content-Type";
        public static final String APPLICATION_JSON = "application/json";
        public static final String AUTHORIZATION = "Authorization";
        public static final String BEARER = "Bearer";

        private Headers() {
            // Utility class
        }
    }

    /**
     * Security headers for CSP and other security configurations.
     */
    public static final class SecurityHeaders {
        public static final String CSP_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
        public static final String FRAME_OPTIONS = "SAMEORIGIN";

        private SecurityHeaders() {
            // Utility class
        }
    }

    // ============================================================================
    // SESSION AND AUTHENTICATION CONFIGURATION
    // ============================================================================

    /**
     * Session management settings.
     */
    public static final class Session {
        public static final String STATELESS = "STATELESS";

        private Session() {
            // Utility class
        }
    }

    /**
     * JWT token configuration.
     */
    public static final class Jwt {
        public static final long DEFAULT_ACCESS_TOKEN_EXPIRATION_MS = 900_000L; // 15 minutes
        public static final long DEFAULT_REFRESH_TOKEN_EXPIRATION_MS = 604_800_000L; // 7 days

        private Jwt() {
            // Utility class
        }
    }

    // ============================================================================
    // RATE LIMITING CONFIGURATION
    // ============================================================================

    /**
     * Rate limit configuration defaults.
     */
    public static final class RateLimit {
        // Authentication endpoints
        public static final int AUTH_CAPACITY_DEFAULT = 20;
        public static final int AUTH_REFILL_TOKENS_DEFAULT = 20;
        public static final int AUTH_REFILL_PERIOD_SECONDS_DEFAULT = 60;

        // Public endpoints
        public static final int PUBLIC_CAPACITY_DEFAULT = 100;
        public static final int PUBLIC_REFILL_TOKENS_DEFAULT = 100;
        public static final int PUBLIC_REFILL_PERIOD_SECONDS_DEFAULT = 60;

        // Authenticated user endpoints
        public static final int AUTHENTICATED_CAPACITY_DEFAULT = 200;
        public static final int AUTHENTICATED_REFILL_TOKENS_DEFAULT = 200;
        public static final int AUTHENTICATED_REFILL_PERIOD_SECONDS_DEFAULT = 60;

        // Cache configuration
        public static final int CACHE_MAX_SIZE_DEFAULT = 10_000;
        public static final int CACHE_EXPIRE_MINUTES_DEFAULT = 10;

        // Endpoint paths for rate limiting
        public static final String AUTH_PATH_PREFIX = "/api/auth/";
        public static final String GUEST_PATH_PREFIX = "/api/guest/";
        public static final String SWAGGER_PATH = "/swagger-ui/";
        public static final String API_DOCS_PATH = "/api-docs/";

        private RateLimit() {
            // Utility class
        }
    }

    // ============================================================================
    // EMAIL AND NOTIFICATION CONFIGURATION
    // ============================================================================

    /**
     * Email configuration defaults.
     */
    public static final class Email {
        public static final String TEMPLATE_PREFIX = "templates/";
        public static final String TEMPLATE_SUFFIX = ".html";
        public static final String TEMPLATE_MODE = "HTML";
        public static final String CHARACTER_ENCODING = "UTF-8";
        public static final boolean TEMPLATE_CACHEABLE = true;

        private Email() {
            // Utility class
        }
    }

    // ============================================================================
    // CACHE AND REDIS CONFIGURATION
    // ============================================================================

    /**
     * Redis and cache configuration.
     */
    public static final class Cache {
        public static final int DEFAULT_TTL_SECONDS = 3600; // 1 hour
        public static final int SHORT_TTL_SECONDS = 300; // 5 minutes
        public static final int LONG_TTL_SECONDS = 86400; // 1 day

        private Cache() {
            // Utility class
        }
    }

    // ============================================================================
    // DATABASE CONFIGURATION
    // ============================================================================

    /**
     * Database connection pool configuration.
     */
    public static final class Database {
        public static final int POOL_MIN_IDLE_DEFAULT = 2;
        public static final int POOL_MAX_SIZE_DEFAULT = 10;
        public static final int CONNECTION_TIMEOUT_MILLIS = 30_000;
        public static final int IDLE_TIMEOUT_MILLIS = 600_000; // 10 minutes
        public static final int MAX_LIFETIME_MILLIS = 1_800_000; // 30 minutes

        private Database() {
            // Utility class
        }
    }

    // ============================================================================
    // GRPC SERVICE CONFIGURATION
    // ============================================================================

    /**
     * gRPC service defaults.
     */
    public static final class GrpcService {
        public static final String DEFAULT_HOST = "localhost";
        public static final int DEFAULT_PORT = 9090;
        public static final boolean USE_PLAINTEXT_DEFAULT = false;

        // Service-specific defaults
        public static final String PRODUCT_SERVICE_HOST_PROPERTY = "grpc.product-service.host";
        public static final String PRODUCT_SERVICE_PORT_PROPERTY = "grpc.product-service.port";
        public static final String PRODUCT_SERVICE_PORT_DEFAULT = "9091";

        public static final String USER_SERVICE_HOST_PROPERTY = "grpc.user-service.host";
        public static final String USER_SERVICE_PORT_PROPERTY = "grpc.user-service.port";
        public static final String USER_SERVICE_PORT_DEFAULT = "9092";

        public static final String NOTIFICATION_SERVICE_HOST_PROPERTY = "grpc.notification-service.host";
        public static final String NOTIFICATION_SERVICE_PORT_PROPERTY = "grpc.notification-service.port";
        public static final String NOTIFICATION_SERVICE_PORT_DEFAULT = "9093";

        private GrpcService() {
            // Utility class
        }
    }

    // ============================================================================
    // SECURITY CONFIGURATION
    // ============================================================================

    /**
     * Security and authorization configuration.
     */
    public static final class Security {
        // Role-based access control paths
        public static final String ADMIN_PATH = "/api/admin/**";
        public static final String SELLER_PATH = "/api/seller/**";
        public static final String BIDDER_PATH = "/api/bidder/**";
        public static final String GUEST_PATH = "/api/guest/**";
        public static final String AUTH_PATH = "/api/auth/**";

        // Role constants
        public static final String ROLE_ADMIN = "ADMIN";
        public static final String ROLE_SELLER = "SELLER";
        public static final String ROLE_BIDDER = "BIDDER";
        public static final String ROLE_USER = "USER";

        private Security() {
            // Utility class
        }
    }

    // ============================================================================
    // LOGGING AND TRACING CONFIGURATION
    // ============================================================================

    /**
     * Logging and tracing configuration.
     */
    public static final class Logging {
        public static final String TRACE_ID_HEADER = "X-Trace-ID";
        public static final String TRACE_ID_MDC_KEY = "traceId";
        public static final boolean LOG_REQUEST_BODY_DEFAULT = true;
        public static final boolean LOG_RESPONSE_BODY_DEFAULT = true;
        public static final int LOG_PAYLOAD_MAX_LENGTH = 1000;

        private Logging() {
            // Utility class
        }
    }

    // ============================================================================
    // FILE UPLOAD CONFIGURATION
    // ============================================================================

    /**
     * File upload and storage configuration.
     */
    public static final class FileUpload {
        public static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024L; // 50 MB
        public static final long MAX_FILE_SIZE_MB = 50;

        private FileUpload() {
            // Utility class
        }
    }

    private ConfigConstants() {
        // Utility class - no instantiation
    }
}
