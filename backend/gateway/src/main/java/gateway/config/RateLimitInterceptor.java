package gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;

/**
 * Interceptor that applies rate limiting to incoming HTTP requests.
 * Uses client IP address as the key for rate limiting.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);
    
    private final Cache<String, Bucket> bucketCache;
    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper;
    
    public RateLimitInterceptor(Cache<String, Bucket> bucketCache, 
                                RateLimitConfig rateLimitConfig,
                                ObjectMapper objectMapper) {
        this.bucketCache = bucketCache;
        this.rateLimitConfig = rateLimitConfig;
        this.objectMapper = objectMapper;
    }
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();
        String key = clientIp + ":" + getEndpointCategory(path);
        
        // Get or create bucket for this client
        Bucket bucket = bucketCache.get(key, k -> 
            Bucket.builder()
                .addLimit(Arrays.stream(rateLimitConfig.getBucketConfiguration(path).getBandwidths()).iterator().next())
                .build()
        );
        
        // Try to consume 1 token
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
        if (probe.isConsumed()) {
            // Request is allowed
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return true;
        } else {
            // Rate limit exceeded
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            
            log.warn("Rate limit exceeded for IP: {} on path: {}. Retry after {} seconds", 
                     clientIp, path, waitForRefill);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            
            var errorResponse = new java.util.HashMap<String, Object>();
            errorResponse.put("error", "Too Many Requests");
            errorResponse.put("message", "Rate limit exceeded. Please try again later.");
            errorResponse.put("retryAfterSeconds", waitForRefill);
            errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            
            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            return false;
        }
    }
    
    /**
     * Extracts the client's IP address from the request.
     * Checks X-Forwarded-For header first (for proxied requests).
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Determines the endpoint category for rate limiting purposes.
     * Different categories have different rate limits.
     */
    private String getEndpointCategory(String path) {
        if (path.startsWith("/api/auth/")) {
            return "auth";
        } else if (path.startsWith("/api/guest/") || path.startsWith("/swagger-ui/") || path.startsWith("/api-docs/")) {
            return "public";
        } else {
            return "authenticated";
        }
    }
}
