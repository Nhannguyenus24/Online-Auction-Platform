package gateway.config;

import java.util.Arrays;

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

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(WebSecurityConfig.class);
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtUtils jwtUtils) throws Exception {
        
        http
            // Enable CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
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