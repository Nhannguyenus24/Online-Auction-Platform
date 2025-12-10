package gateway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import com.auction.platform.utils.JwtUtils;
import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Custom JWT Authentication Filter using JwtUtils
 * Only validates JWT for protected endpoints, skips public endpoints
 */
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    // List of public endpoints that don't require JWT validation
    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/gateway/health",
        "/api/gateway/info",
        "/api/gateway/routes",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/verify-email",
        "/swagger-ui",
        "/v3/api-docs",
        "/api-docs",
        "/actuator"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Skip JWT validation for public endpoints
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get Authorization header
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7); // Remove "Bearer " prefix
                
                // Validate and decode JWT using JwtUtils
                JWTClaimsSet claims = jwtUtils.validateToken(token);
                
                // Extract claims
                String userId = claims.getSubject();
                String role = (String) claims.getClaim("role");
                
                // Build authorities
                Collection<GrantedAuthority> authorities = new ArrayList<>();
                if (role != null) {
                    // Add ROLE_ prefix if not already present
                    String roleName = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
                    authorities.add(new SimpleGrantedAuthority(roleName));
                }
                
                // Create authentication token
                Authentication auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    authorities
                );
                
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("JWT validated for user: {} with role: {}", userId, role);
                
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                // Don't set authentication, let Spring Security handle the error
            }
        }
        
        filterChain.doFilter(request, response);
    }

    /**
     * Check if the request path is public (doesn't require JWT)
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream()
            .anyMatch(path::startsWith);
    }
}
