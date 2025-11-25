package gateway.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/gateway")
@Tag(name = "Gateway", description = "Gateway health and information endpoints")
public class GatewayController {

    @GetMapping("/health")
    @Operation(
            summary = "Health Check",
            description = "Check if the gateway is running and healthy"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Gateway is healthy"),
            @ApiResponse(responseCode = "503", description = "Gateway is unavailable")
    })
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "API Gateway");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    @Operation(
            summary = "Gateway Information",
            description = "Get information about the API Gateway and available services"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved gateway information")
    })
    public ResponseEntity<Map<String, Object>> getInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("name", "Online Auction Platform - API Gateway");
        response.put("description", "Central gateway for routing requests to microservices");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now());
        
        Map<String, String> services = new HashMap<>();
        services.put("user-service", "User management and authentication");
        services.put("auction-service", "Auction creation and management");
        services.put("bidding-service", "Real-time bidding operations");
        services.put("payment-service", "Payment processing");
        response.put("services", services);
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("swagger-ui", "/swagger-ui.html");
        endpoints.put("api-docs", "/api-docs");
        endpoints.put("health", "/api/gateway/health");
        endpoints.put("info", "/api/gateway/info");
        response.put("endpoints", endpoints);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/routes")
    @Operation(
            summary = "Available Routes",
            description = "List all available routes through the gateway"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved routes")
    })
    public ResponseEntity<Map<String, Object>> getRoutes() {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, String> routes = new HashMap<>();
        routes.put("/api/users/**", "User Service - User management endpoints");
        routes.put("/api/auctions/**", "Auction Service - Auction management endpoints");
        routes.put("/api/bids/**", "Bidding Service - Bidding endpoints");
        routes.put("/api/payments/**", "Payment Service - Payment processing endpoints");
        
        response.put("routes", routes);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }
}
