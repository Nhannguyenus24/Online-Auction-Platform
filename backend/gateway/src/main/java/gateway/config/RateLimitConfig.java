package gateway.config;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.auction.config.ConfigConstants;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;

/**
 * Configuration for rate limiting using Bucket4j with token bucket algorithm.
 *
 * Implements distributed rate limiting with three tier levels:
 * - Authentication endpoints: Strict limits to prevent brute force attacks
 * - Public endpoints: Moderate limits for unauthenticated users
 * - Authenticated endpoints: Generous limits for verified users
 *
 * Architecture:
 * - Uses Bucket4j for token bucket algorithm implementation
 * - Caffeine cache stores rate limit buckets per client (IP address)
 * - Buckets automatically expire after inactivity to free memory
 *
 * Configurable properties:
 * - rate.limit.auth.capacity: Max tokens for auth endpoints (default: 20)
 * - rate.limit.auth.refill.tokens: Tokens to add for auth endpoints (default: 20)
 * - rate.limit.auth.refill.period: Refill period in seconds for auth (default: 60)
 *
 * - rate.limit.public.capacity: Max tokens for public endpoints (default: 100)
 * - rate.limit.public.refill.tokens: Tokens to add for public endpoints (default: 100)
 * - rate.limit.public.refill.period: Refill period in seconds for public (default: 60)
 *
 * - rate.limit.authenticated.capacity: Max tokens for authenticated endpoints (default: 200)
 * - rate.limit.authenticated.refill.tokens: Tokens to add for auth users (default: 200)
 * - rate.limit.authenticated.refill.period: Refill period in seconds for users (default: 60)
 *
 * - rate.limit.cache.max.size: Maximum buckets in cache (default: 10000)
 * - rate.limit.cache.expire.after.access.minutes: Cache expiration time (default: 10 minutes)
 *
 * Example configuration (application.yml):
 * ```
 * rate:
 *   limit:
 *     auth:
 *       capacity: 20
 *       refill:
 *         tokens: 20
 *         period: 60  # 20 requests per 60 seconds
 *     public:
 *       capacity: 100
 *       refill:
 *         tokens: 100
 *         period: 60  # 100 requests per 60 seconds
 *     authenticated:
 *       capacity: 200
 *       refill:
 *         tokens: 200
 *         period: 60  # 200 requests per 60 seconds
 *     cache:
 *       max:
 *         size: 10000
 *       expire:
 *         after:
 *           access:
 *             minutes: 10
 * ```
 *
 * @see io.github.bucket4j.Bucket
 * @see com.github.benmanes.caffeine.cache.Cache
 */
@Configuration
public class RateLimitConfig {
    private static final Logger log = LoggerFactory.getLogger(RateLimitConfig.class);

    // ============================================================================
    // Authentication Endpoint Rate Limiting
    // ============================================================================

    @Value("${rate.limit.auth.capacity:" + ConfigConstants.RateLimit.AUTH_CAPACITY_DEFAULT + "}")
    private int authCapacity;

    @Value("${rate.limit.auth.refill.tokens:" + ConfigConstants.RateLimit.AUTH_REFILL_TOKENS_DEFAULT + "}")
    private int authRefillTokens;

    @Value("${rate.limit.auth.refill.period:" + ConfigConstants.RateLimit.AUTH_REFILL_PERIOD_SECONDS_DEFAULT + "}")
    private int authRefillPeriodSeconds;

    // ============================================================================
    // Public Endpoint Rate Limiting
    // ============================================================================

    @Value("${rate.limit.public.capacity:" + ConfigConstants.RateLimit.PUBLIC_CAPACITY_DEFAULT + "}")
    private int publicCapacity;

    @Value("${rate.limit.public.refill.tokens:" + ConfigConstants.RateLimit.PUBLIC_REFILL_TOKENS_DEFAULT + "}")
    private int publicRefillTokens;

    @Value("${rate.limit.public.refill.period:" + ConfigConstants.RateLimit.PUBLIC_REFILL_PERIOD_SECONDS_DEFAULT + "}")
    private int publicRefillPeriodSeconds;

    // ============================================================================
    // Authenticated User Endpoint Rate Limiting
    // ============================================================================

    @Value("${rate.limit.authenticated.capacity:" + ConfigConstants.RateLimit.AUTHENTICATED_CAPACITY_DEFAULT + "}")
    private int authenticatedCapacity;

    @Value("${rate.limit.authenticated.refill.tokens:" + ConfigConstants.RateLimit.AUTHENTICATED_REFILL_TOKENS_DEFAULT + "}")
    private int authenticatedRefillTokens;

    @Value("${rate.limit.authenticated.refill.period:" + ConfigConstants.RateLimit.AUTHENTICATED_REFILL_PERIOD_SECONDS_DEFAULT + "}")
    private int authenticatedRefillPeriodSeconds;

    // ============================================================================
    // Cache Configuration
    // ============================================================================

    @Value("${rate.limit.cache.max.size:" + ConfigConstants.RateLimit.CACHE_MAX_SIZE_DEFAULT + "}")
    private int cacheMaxSize;

    @Value("${rate.limit.cache.expire.after.access.minutes:" + ConfigConstants.RateLimit.CACHE_EXPIRE_MINUTES_DEFAULT + "}")
    private int cacheExpireMinutes;
    
    /**
     * Creates a Caffeine cache for storing rate limit buckets.
     *
     * Features:
     * - In-memory cache for fast bucket retrieval
     * - Automatic expiration after inactivity (reduces memory usage)
     * - Maximum size limit to prevent unbounded memory growth
     * - Thread-safe concurrent operations
     *
     * Cache key: Client identifier (typically IP address)
     * Cache value: Bucket with current token state
     *
     * Size management:
     * - Maximum entries: {} (configurable via rate.limit.cache.max.size)
     * - Expiration after access: {} minutes (configurable)
     *
     * @return Caffeine cache configured for rate limit bucket storage
     */
    @Bean
    public Cache<String, Bucket> bucketCache() {
        log.info("Initializing Caffeine cache for rate limit buckets");
        log.debug("Cache configuration: maxSize={}, expireAfterAccessMinutes={}",
            cacheMaxSize, cacheExpireMinutes);

        Cache<String, Bucket> cache = Caffeine.newBuilder()
                .maximumSize(cacheMaxSize)
                .expireAfterAccess(Duration.ofMinutes(cacheExpireMinutes))
                .build();

        log.info("Caffeine cache initialized successfully for rate limiting");
        return cache;
    }
    
    /**
     * Creates bucket configuration for authentication endpoints.
     *
     * Purpose: Prevent brute force attacks by strictly limiting login/register attempts.
     *
     * Configuration:
     * - Capacity: {} tokens (maximum tokens in bucket)
     * - Refill rate: {} tokens per {} seconds
     *
     * Example: With default settings (20 tokens per 60 seconds)
     * - Clients can make 20 requests per 60 seconds
     * - Exceeding this triggers 429 Too Many Requests response
     *
     * @return BucketConfiguration for auth endpoints with restrictive limits
     */
    public BucketConfiguration authBucketConfiguration() {
        log.debug("Creating auth bucket configuration: capacity={}, tokens={} per {} seconds",
            authCapacity, authRefillTokens, authRefillPeriodSeconds);

        Bandwidth limit = Bandwidth.classic(
            authCapacity,
            Refill.intervally(authRefillTokens, Duration.ofSeconds(authRefillPeriodSeconds))
        );
        return BucketConfiguration.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Creates bucket configuration for public endpoints.
     *
     * Purpose: Limit requests from unauthenticated users while allowing reasonable access.
     *
     * Configuration:
     * - Capacity: {} tokens (maximum tokens in bucket)
     * - Refill rate: {} tokens per {} seconds
     *
     * Applies to:
     * - /api/guest/** endpoints
     * - /swagger-ui/** documentation
     * - /api-docs/** specifications
     *
     * @return BucketConfiguration for public endpoints with moderate limits
     */
    public BucketConfiguration publicBucketConfiguration() {
        log.debug("Creating public bucket configuration: capacity={}, tokens={} per {} seconds",
            publicCapacity, publicRefillTokens, publicRefillPeriodSeconds);

        Bandwidth limit = Bandwidth.classic(
            publicCapacity,
            Refill.intervally(publicRefillTokens, Duration.ofSeconds(publicRefillPeriodSeconds))
        );
        return BucketConfiguration.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Creates bucket configuration for authenticated user endpoints.
     *
     * Purpose: Allow authenticated users higher limits to support normal usage patterns.
     *
     * Configuration:
     * - Capacity: {} tokens (maximum tokens in bucket)
     * - Refill rate: {} tokens per {} seconds
     *
     * Applies to:
     * - /api/admin/** admin operations
     * - /api/seller/** seller operations
     * - /api/bidder/** bidder operations
     * - Other authenticated endpoints
     *
     * @return BucketConfiguration for authenticated endpoints with generous limits
     */
    public BucketConfiguration authenticatedBucketConfiguration() {
        log.debug("Creating authenticated bucket configuration: capacity={}, tokens={} per {} seconds",
            authenticatedCapacity, authenticatedRefillTokens, authenticatedRefillPeriodSeconds);

        Bandwidth limit = Bandwidth.classic(
            authenticatedCapacity,
            Refill.intervally(authenticatedRefillTokens, Duration.ofSeconds(authenticatedRefillPeriodSeconds))
        );
        return BucketConfiguration.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Determines the appropriate bucket configuration based on the request path.
     *
     * Routing logic:
     * - Paths starting with /api/auth/ → Auth endpoint limits (most restrictive)
     * - Paths starting with /api/guest/, /swagger-ui/, /api-docs/ → Public limits
     * - All other paths → Authenticated user limits (most generous)
     *
     * @param path The request path to determine rate limit tier
     * @return BucketConfiguration appropriate for the endpoint
     */
    public BucketConfiguration getBucketConfiguration(String path) {
        if (path.startsWith(ConfigConstants.RateLimit.AUTH_PATH_PREFIX)) {
            log.trace("Using auth rate limit for path: {}", path);
            return authBucketConfiguration();
        } else if (path.startsWith(ConfigConstants.RateLimit.GUEST_PATH_PREFIX) ||
                   path.startsWith(ConfigConstants.RateLimit.SWAGGER_PATH) ||
                   path.startsWith(ConfigConstants.RateLimit.API_DOCS_PATH)) {
            log.trace("Using public rate limit for path: {}", path);
            return publicBucketConfiguration();
        } else {
            log.trace("Using authenticated rate limit for path: {}", path);
            return authenticatedBucketConfiguration();
        }
    }
}
