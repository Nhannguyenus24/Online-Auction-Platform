package gateway.config;

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

import com.auction.utils.JwtUtils;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(WebSecurityConfig.class);
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtUtils jwtUtils) throws Exception {
        
        http
            // Disable CSRF for stateless REST API
            .csrf(csrf -> csrf.disable())
            
            // Session management - stateless
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Security headers
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
                )
                .frameOptions(frame -> frame.sameOrigin())
            )
            
            // Authorization rules
            .authorizeHttpRequests(auth -> {
                log.info("Configuring authorization rules");
                auth
                    // Public endpoints - no authentication required
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers(
                        "/api/auth/**",
                        "/swagger-ui/**",
                        "/api/guest/**",
                        "/api-docs/**"
                    ).permitAll()
                    
                    // Role-based access control with hierarchy
                    // Admin can access everything
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    // Admin and Seller can access seller endpoints
                    .requestMatchers("/api/seller/**").hasAnyRole("ADMIN", "SELLER")
                    // Admin, Seller, and Bidder can access bidder endpoints
                    .requestMatchers("/api/bidder/**").hasAnyRole("ADMIN", "SELLER", "BIDDER")
                    
                    // All other requests require authentication
                    .anyRequest().authenticated();
            })
            
            // Add custom JWT filter instead of oauth2ResourceServer
            .addFilterBefore(jwtAuthenticationFilter(jwtUtils), BasicAuthenticationFilter.class);

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