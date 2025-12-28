package gateway.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auction.utils.JwtUtils;
import com.nimbusds.jwt.JWTClaimsSet;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Custom JWT Authentication Filter using JwtUtils
 * Only validates JWT for protected endpoints, skips public endpoints
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private static final Logger log =  LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    public  JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();

        // Get Authorization header
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                
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
                    log.info("Added authority: {} for user: {}", roleName, userId);
                }
                
                // Create authentication token
                Authentication auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    authorities
                );
                
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.info("JWT validated for user: {} with role: {} (authorities: {})", userId, role, authorities);
                
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                // Don't set authentication, let Spring Security handle the error
            }
        }
        filterChain.doFilter(request, response);
    }
}
