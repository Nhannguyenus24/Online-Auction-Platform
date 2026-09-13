package gateway.config;

import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.auction.utils.JwtUtils;
import com.auction.config.ConfigConstants;

/**
 * Spring Security configuration for the gateway application.
 *
 * Configures:
 * - CORS (Cross-Origin Resource Sharing) for frontend integration
 * - Session management (stateless JWT-based authentication)
 * - Security headers (CSP, frame options, etc.)
 * - Authorization rules with role-based access control
 * - Custom JWT authentication filter
 *
 * Security model:
 * - Public endpoints: /api/auth/*, /api/guest/*, /swagger-ui/*, /api-docs/*
 * - Admin endpoints: /api/admin/** (requires ADMIN role)
 * - Seller endpoints: /api/seller/** (requires ADMIN or SELLER role)
 * - Bidder endpoints: /api/bidder/** (requires ADMIN, SELLER, or BIDDER role)
 * - All other endpoints: require authentication
 */
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(WebSecurityConfig.class);

    /**
     * Configures CORS (Cross-Origin Resource Sharing) for frontend integration.
     *
     * Allowed Origins (development):
     * - http://localhost:3000 (React dev server)
     * - http://localhost:5173 (Vite dev server)
     * - http://localhost:8080 (Alternative frontend)
     *
     * In production, configure via application properties:
     * - cors.allowed-origins=https://yourdomain.com,https://www.yourdomain.com
     *
     * @return CORS configuration source for all endpoints
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Configure allowed origins (should be externalized in production)
        List<String> allowedOrigins = Arrays.asList(
            ConfigConstants.Cors.DEFAULT_ORIGIN_LOCALHOST_3000,
            ConfigConstants.Cors.DEFAULT_ORIGIN_LOCALHOST_5173,
            ConfigConstants.Cors.DEFAULT_ORIGIN_LOCALHOST_8080
        );
        configuration.setAllowedOrigins(allowedOrigins);
        log.info("CORS allowed origins configured: {}", allowedOrigins);

        // Configure allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            ConfigConstants.HttpMethods.GET,
            ConfigConstants.HttpMethods.POST,
            ConfigConstants.HttpMethods.PUT,
            ConfigConstants.HttpMethods.DELETE,
            ConfigConstants.HttpMethods.PATCH,
            ConfigConstants.HttpMethods.OPTIONS
        ));

        // Allow all headers in CORS requests
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(ConfigConstants.Cors.CORS_MAX_AGE_SECONDS);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Configures the HTTP security filter chain for the application.
     *
     * Features:
     * - CORS support for cross-origin requests
     * - CSRF disabled for stateless REST API
     * - Stateless session management (JWT-based)
     * - Security headers (CSP, frame options)
     * - Role-based authorization with hierarchical access control
     * - Custom JWT authentication filter
     *
     * @param http      The HttpSecurity builder
     * @param jwtUtils  JWT utilities for token validation
     * @return Configured SecurityFilterChain
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtUtils jwtUtils) throws Exception {
        log.info("Initializing security filter chain");

        http
            // Enable CORS using configured source
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable CSRF for stateless REST API (not using sessions)
            .csrf(csrf -> {
                csrf.disable();
                log.debug("CSRF protection disabled for stateless API");
            })

            // Configure stateless session management (no server-side sessions)
            .sessionManagement(session -> {
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                log.debug("Session management configured as STATELESS");
            })

            // Configure security headers
            .headers(headers -> {
                headers
                    // Content Security Policy to prevent XSS attacks
                    .contentSecurityPolicy(csp -> {
                        csp.policyDirectives(ConfigConstants.SecurityHeaders.CSP_POLICY);
                        log.debug("CSP policy configured");
                    })
                    // Frame options to prevent clickjacking
                    .frameOptions(frame -> {
                        frame.sameOrigin();
                        log.debug("Frame options configured to SAMEORIGIN");
                    });
            })

            // Configure authorization rules with role-based access control
            .authorizeHttpRequests(auth -> {
                log.info("Configuring authorization rules");
                auth
                    // Allow all OPTIONS requests (CORS preflight)
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                    // Public endpoints - no authentication required
                    .requestMatchers(
                        ConfigConstants.Security.AUTH_PATH,
                        ConfigConstants.Security.GUEST_PATH,
                        "/swagger-ui/**",
                        "/api-docs/**"
                    ).permitAll()

                    // Admin endpoints - ADMIN role only
                    .requestMatchers(ConfigConstants.Security.ADMIN_PATH)
                        .hasRole(ConfigConstants.Security.ROLE_ADMIN)
                    // Seller endpoints - ADMIN or SELLER roles
                    .requestMatchers(ConfigConstants.Security.SELLER_PATH)
                        .hasAnyRole(ConfigConstants.Security.ROLE_ADMIN, ConfigConstants.Security.ROLE_SELLER)
                    // Bidder endpoints - ADMIN, SELLER, or BIDDER roles
                    .requestMatchers(ConfigConstants.Security.BIDDER_PATH)
                        .hasAnyRole(ConfigConstants.Security.ROLE_ADMIN, ConfigConstants.Security.ROLE_SELLER, ConfigConstants.Security.ROLE_BIDDER)

                    // All other requests require authentication
                    .anyRequest().authenticated();

                log.info("Authorization rules configured successfully");
            })

            // Add custom JWT filter before basic authentication filter
            .addFilterBefore(jwtAuthenticationFilter(jwtUtils), BasicAuthenticationFilter.class);

        log.info("Security filter chain configured successfully");
        return http.build();
    }

    /**
     * Custom JWT filter that only validates JWT for protected endpoints
     */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtUtils jwtUtils) {
        return new JwtAuthenticationFilter(jwtUtils);
    }
}