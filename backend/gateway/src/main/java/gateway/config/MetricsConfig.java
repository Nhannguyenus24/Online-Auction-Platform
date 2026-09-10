package gateway.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public CustomMetrics customMetrics(MeterRegistry meterRegistry) {
        return new CustomMetrics(meterRegistry);
    }

    public static class CustomMetrics {
        private final MeterRegistry meterRegistry;

        // Counters for various operations
        public final io.micrometer.core.instrument.Counter authLoginAttempts;
        public final io.micrometer.core.instrument.Counter authLoginSuccesses;
        public final io.micrometer.core.instrument.Counter authLoginFailures;
        public final io.micrometer.core.instrument.Counter productCreated;
        public final io.micrometer.core.instrument.Counter productViewed;
        public final io.micrometer.core.instrument.Counter bidPlaced;
        public final io.micrometer.core.instrument.Counter bidRejected;

        // Timers for tracking execution time
        public final Timer grpcCallTimer;
        public final Timer databaseCallTimer;

        public CustomMetrics(MeterRegistry meterRegistry) {
            this.meterRegistry = meterRegistry;

            // Initialize counters
            authLoginAttempts = io.micrometer.core.instrument.Counter.builder("auth.login.attempts")
                    .description("Total authentication login attempts")
                    .register(meterRegistry);

            authLoginSuccesses = io.micrometer.core.instrument.Counter.builder("auth.login.successes")
                    .description("Total successful logins")
                    .register(meterRegistry);

            authLoginFailures = io.micrometer.core.instrument.Counter.builder("auth.login.failures")
                    .description("Total failed logins")
                    .register(meterRegistry);

            productCreated = io.micrometer.core.instrument.Counter.builder("product.created")
                    .description("Total products created")
                    .register(meterRegistry);

            productViewed = io.micrometer.core.instrument.Counter.builder("product.viewed")
                    .description("Total product views")
                    .register(meterRegistry);

            bidPlaced = io.micrometer.core.instrument.Counter.builder("bid.placed")
                    .description("Total bids placed")
                    .register(meterRegistry);

            bidRejected = io.micrometer.core.instrument.Counter.builder("bid.rejected")
                    .description("Total bids rejected")
                    .register(meterRegistry);

            // Initialize timers
            grpcCallTimer = Timer.builder("grpc.call.duration")
                    .description("gRPC call duration")
                    .publishPercentiles(0.5, 0.95, 0.99)
                    .register(meterRegistry);

            databaseCallTimer = Timer.builder("database.call.duration")
                    .description("Database call duration")
                    .publishPercentiles(0.5, 0.95, 0.99)
                    .register(meterRegistry);
        }

        // Gauge for active connections
        public void recordActiveConnections(int count) {
            meterRegistry.gauge("connections.active", count);
        }

        // Record custom metric for auction listings count
        public void recordAuctionListingsCount(int count) {
            meterRegistry.gauge("auction.listings.active", count);
        }
    }
}
