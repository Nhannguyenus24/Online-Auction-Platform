package chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

	@Bean
	public CorsFilter corsFilter() {
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		CorsConfiguration config = new CorsConfiguration();
		
		// Allow frontend origin
		config.addAllowedOrigin("http://localhost:5173");
		
		// Allow common HTTP methods
		config.addAllowedMethod("GET");
		config.addAllowedMethod("POST");
		config.addAllowedMethod("PUT");
		config.addAllowedMethod("DELETE");
		config.addAllowedMethod("OPTIONS");
		
		// Allow common headers
		config.addAllowedHeader("*");
		
		// Allow credentials
		config.setAllowCredentials(true);
		
		// Apply to all paths
		source.registerCorsConfiguration("/**", config);
		
		return new CorsFilter(source);
	}
}

