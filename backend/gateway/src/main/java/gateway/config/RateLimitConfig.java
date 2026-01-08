package gateway.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;

/**
 * Configuration for rate limiting using Bucket4j.
 * Implements token bucket algorithm with different rate limits for different endpoint types.
 */
@Configuration
public class RateLimitConfig {
    
    @Value("${rate.limit.auth.capacity:20}")
    private int authCapacity;
    
    @Value("${rate.limit.auth.refill.tokens:20}")
    private int authRefillTokens;
    
    @Value("${rate.limit.auth.refill.period:60}")
    private int authRefillPeriodSeconds;
    
    @Value("${rate.limit.public.capacity:100}")
    private int publicCapacity;
    
    @Value("${rate.limit.public.refill.tokens:100}")
    private int publicRefillTokens;
    
    @Value("${rate.limit.public.refill.period:60}")
    private int publicRefillPeriodSeconds;
    
    @Value("${rate.limit.authenticated.capacity:200}")
    private int authenticatedCapacity;
    
    @Value("${rate.limit.authenticated.refill.tokens:200}")
    private int authenticatedRefillTokens;
    
    @Value("${rate.limit.authenticated.refill.period:60}")
    private int authenticatedRefillPeriodSeconds;
    
    @Value("${rate.limit.cache.max.size:10000}")
    private int cacheMaxSize;
    
    @Value("${rate.limit.cache.expire.after.access.minutes:10}")
    private int cacheExpireMinutes;
    
    /**
     * Creates a Caffeine cache for storing rate limit buckets.
     * Buckets are cached and automatically expire after inactivity.
     */
    @Bean
    public Cache<String, Bucket> bucketCache() {
        return Caffeine.newBuilder()
                .maximumSize(cacheMaxSize)
                .expireAfterAccess(Duration.ofMinutes(cacheExpireMinutes))
                .build();
    }
    
    /**
     * Creates bucket configuration for authentication endpoints.
     * More restrictive to prevent brute force attacks.
     */
    public BucketConfiguration authBucketConfiguration() {
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
     * Moderate limits for unauthenticated users.
     */
    public BucketConfiguration publicBucketConfiguration() {
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
     * More generous limits for authenticated users.
     */
    public BucketConfiguration authenticatedBucketConfiguration() {
        Bandwidth limit = Bandwidth.classic(
            authenticatedCapacity,
            Refill.intervally(authenticatedRefillTokens, Duration.ofSeconds(authenticatedRefillPeriodSeconds))
        );
        return BucketConfiguration.builder()
                .addLimit(limit)
                .build();
    }
    
    /**
     * Gets the appropriate bucket configuration based on the endpoint path.
     */
    public BucketConfiguration getBucketConfiguration(String path) {
        if (path.startsWith("/api/auth/")) {
            return authBucketConfiguration();
        } else if (path.startsWith("/api/guest/") || path.startsWith("/swagger-ui/") || path.startsWith("/api-docs/")) {
            return publicBucketConfiguration();
        } else {
            return authenticatedBucketConfiguration();
        }
    }
}
