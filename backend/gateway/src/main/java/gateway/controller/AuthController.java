package gateway.controller;

import gateway.config.JwtDecoderConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Mock authentication endpoints for testing")
public class AuthController {

    private final JwtDecoderConfig jwtDecoderConfig;

    public AuthController(JwtDecoderConfig jwtDecoderConfig) {
        this.jwtDecoderConfig = jwtDecoderConfig;
    }

    @PostMapping("/generate-token")
    @Operation(
            summary = "Generate Mock JWT Token",
            description = "Generate a mock JWT token for testing purposes. Use this token in Authorization header as 'Bearer {token}'"
    )
    public ResponseEntity<Map<String, String>> generateToken(
            @Parameter(description = "User ID", example = "user123")
            @RequestParam(defaultValue = "user123") String userId,
            
            @Parameter(description = "User role (ADMIN, SELLER, BIDDER)", example = "ADMIN")
            @RequestParam(defaultValue = "ADMIN") String role,
            
            @Parameter(description = "User email", example = "user@example.com")
            @RequestParam(defaultValue = "user@example.com") String email
    ) {
        String token = jwtDecoderConfig.generateMockToken(userId, role, email);
        
        Map<String, String> response = new HashMap<>();
        response.put("accessToken", token);
        response.put("tokenType", "Bearer");
        response.put("userId", userId);
        response.put("role", role);
        response.put("email", email);
        response.put("expiresIn", "3600");
        response.put("usage", "Add this to Authorization header: Bearer " + token);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    @Operation(
            summary = "Validate JWT Token",
            description = "Validate if a JWT token is valid and not expired"
    )
    public ResponseEntity<Map<String, Object>> validateToken(
            @Parameter(description = "JWT Token to validate")
            @RequestParam String token
    ) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isExpired = jwtDecoderConfig.isTokenExpired(token);
            String userId = jwtDecoderConfig.getUserIdFromToken(token);
            String role = jwtDecoderConfig.getRoleFromToken(token);
            
            response.put("valid", !isExpired);
            response.put("expired", isExpired);
            response.put("userId", userId);
            response.put("role", role);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("valid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/roles-info")
    @Operation(
            summary = "Get Available Roles Information",
            description = "Get information about available roles and their permissions"
    )
    public ResponseEntity<Map<String, Object>> getRolesInfo() {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, String> roles = new HashMap<>();
        roles.put("ADMIN", "Full access to all endpoints including /api/admin/**");
        roles.put("SELLER", "Access to seller endpoints /api/seller/**");
        roles.put("BIDDER", "Access to bidder endpoints /api/bidder/**");
        
        Map<String, String> publicEndpoints = new HashMap<>();
        publicEndpoints.put("/api/auth/**", "No authentication required");
        publicEndpoints.put("/api/gateway/health", "No authentication required");
        publicEndpoints.put("/swagger-ui.html", "No authentication required");
        
        response.put("roles", roles);
        response.put("publicEndpoints", publicEndpoints);
        response.put("note", "Other endpoints require valid JWT token");
        
        return ResponseEntity.ok(response);
    }
}
