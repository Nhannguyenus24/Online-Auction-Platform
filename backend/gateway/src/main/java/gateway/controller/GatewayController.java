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
}
