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
        // Skip rate limiting for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

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
     * Only trusts X-Forwarded-For header if request comes from a known proxy (127.0.0.1, 0:0:0:0:0:0:0:1).
     * This prevents IP spoofing attacks.
     */
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust X-Forwarded-For if request comes from a known proxy
        if (isTrustedProxy(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                // X-Forwarded-For can contain multiple IPs, take the LAST one (actual client)
                String[] ips = xForwardedFor.split(",");
                String clientIp = ips[ips.length - 1].trim();
                if (isValidIpAddress(clientIp)) {
                    log.debug("Using X-Forwarded-For IP: {} for rate limiting", clientIp);
                    return clientIp;
                }
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && isValidIpAddress(xRealIp)) {
                log.debug("Using X-Real-IP: {} for rate limiting", xRealIp);
                return xRealIp;
            }
        }

        return remoteAddr;
    }

    /**
     * Validates that the given string is a valid IP address
     */
    private boolean isValidIpAddress(String ip) {
        // Simple validation: check if it matches basic IPv4 or IPv6 patterns
        // IPv4: xxx.xxx.xxx.xxx (each xxx is 0-255)
        String ipv4Pattern = "^([0-9]{1,3}\\.){3}[0-9]{1,3}$";
        // IPv6: basic pattern
        String ipv6Pattern = "^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$";

        return ip != null && (ip.matches(ipv4Pattern) || ip.matches(ipv6Pattern));
    }

    /**
     * Check if the request comes from a trusted proxy (local network only)
     * Only trust localhost and internal network addresses
     */
    private boolean isTrustedProxy(String remoteAddr) {
        // Only trust localhost, 127.x.x.x, ::1 (IPv6 localhost), and 10.x.x.x (internal)
        return remoteAddr.equals("127.0.0.1") ||
               remoteAddr.startsWith("127.") ||
               remoteAddr.equals("::1") ||
               remoteAddr.startsWith("10.") ||
               remoteAddr.startsWith("192.168.") ||
               remoteAddr.startsWith("172.16.");
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
