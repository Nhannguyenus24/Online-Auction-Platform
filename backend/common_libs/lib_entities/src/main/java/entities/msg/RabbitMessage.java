package entities.msg;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RabbitMessage {
    // Unique ID for tracing across services
    private String eventId = UUID.randomUUID().toString();
    private EventType eventType;
    private long timestamp = System.currentTimeMillis();
    private String userId;
    private Map<String, String> payload;
}
