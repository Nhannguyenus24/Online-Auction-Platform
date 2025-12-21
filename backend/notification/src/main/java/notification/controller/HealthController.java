package notification.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

/**
 * Health check endpoint
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public Mono<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "notification-service");
        health.put("timestamp", LocalDateTime.now().toString());
        return Mono.just(health);
    }

    @GetMapping("/")
    public Mono<Map<String, String>> root() {
        Map<String, String> info = new HashMap<>();
        info.put("service", "Notification Service");
        info.put("version", "1.0.0");
        info.put("status", "Running");
        return Mono.just(info);
    }
}
