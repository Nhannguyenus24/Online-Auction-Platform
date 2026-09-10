package gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import java.util.UUID;

@Configuration
public class TracingConfig {

    private static final Logger log = LoggerFactory.getLogger(TracingConfig.class);
    private static final String TRACE_ID_KEY = "traceId";
    private static final String SPAN_ID_KEY = "spanId";

    @Bean
    public TracingService tracingService() {
        log.info("Initializing distributed tracing with SLF4J MDC");
        return new TracingService();
    }

    public static class TracingService {

        public <T> T trace(String spanName, java.util.function.Supplier<T> supplier) {
            String traceId = MDC.get(TRACE_ID_KEY);
            if (traceId == null) {
                traceId = UUID.randomUUID().toString();
                MDC.put(TRACE_ID_KEY, traceId);
            }

            String spanId = UUID.randomUUID().toString();
            MDC.put(SPAN_ID_KEY, spanId);

            try {
                return supplier.get();
            } finally {
                MDC.remove(SPAN_ID_KEY);
            }
        }

        public void trace(String spanName, Runnable runnable) {
            String traceId = MDC.get(TRACE_ID_KEY);
            if (traceId == null) {
                traceId = UUID.randomUUID().toString();
                MDC.put(TRACE_ID_KEY, traceId);
            }

            String spanId = UUID.randomUUID().toString();
            MDC.put(SPAN_ID_KEY, spanId);

            try {
                runnable.run();
            } finally {
                MDC.remove(SPAN_ID_KEY);
            }
        }

        public String getTraceId() {
            return MDC.get(TRACE_ID_KEY);
        }

        public String getSpanId() {
            return MDC.get(SPAN_ID_KEY);
        }
    }
}
