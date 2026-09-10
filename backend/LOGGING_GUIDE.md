# Comprehensive Logging Standards Guide

Strategic logging practices for the Online Auction Platform microservices, including levels, formats, sensitive data handling, and monitoring integration.

## Table of Contents

1. [Log Levels and When to Use](#log-levels-and-when-to-use)
2. [Structured Logging Format](#structured-logging-format)
3. [Correlation IDs and Tracing](#correlation-ids-and-tracing)
4. [Sensitive Data Handling](#sensitive-data-handling)
5. [Performance Impact Considerations](#performance-impact-considerations)
6. [Monitoring and Alerting Integration](#monitoring-and-alerting-integration)
7. [Logging Patterns by Component](#logging-patterns-by-component)
8. [Log Configuration](#log-configuration)
9. [Troubleshooting with Logs](#troubleshooting-with-logs)

## Log Levels and When to Use

### TRACE Level

**When to use:** Detailed diagnostic information for developers

**Usage:**
- Variable values and intermediate states
- Method entry/exit with parameters
- Loop iterations and control flow

**Example:**

```java
private static final Logger log = LoggerFactory.getLogger(ProductService.class);

public Product createProduct(CreateProductRequest request) {
    log.trace("Entering createProduct with request: title={}, price={}", 
        request.getTitle(), request.getStartingPrice());
    
    // Calculate intermediate values
    BigDecimal adjustedPrice = request.getStartingPrice().multiply(BigDecimal.ONE_ONE);
    log.trace("Adjusted price: {}", adjustedPrice);
    
    Product product = new Product();
    // ... initialization ...
    
    log.trace("Product created with id: {}", product.getId());
    return product;
}

// Configuration to enable (dev only)
// logging.level.gateway=TRACE
```

**Warning:** Disable in production for performance reasons.

### DEBUG Level

**When to use:** Development and debugging information

**Usage:**
- Method calls and returns
- Variable assignments
- Conditional branches taken
- API call parameters and responses

**Example:**

```java
@Service
public class AuthService {
    
    public LoginResponse login(LoginRequest request) {
        log.debug("Processing login request for email: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail());
        log.debug("User found: {}, verified: {}", user != null, 
            user != null && user.isVerified());
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.debug("Password mismatch for user: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid password");
        }
        
        String token = jwtService.generateToken(user);
        log.debug("Token generated for user: {}", user.getId());
        
        return LoginResponse.success(token);
    }
}

// Configuration
// logging.level.gateway=DEBUG
// logging.level.gateway.service=DEBUG
```

### INFO Level

**When to use:** Important business events and normal flow

**Usage:**
- Application startup/shutdown
- Successful operations
- User actions (login, registration, purchases)
- Configuration changes
- Regular audit trail

**Example:**

```java
@Service
public class ProductService {
    
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    
    public Product createProduct(CreateProductRequest request) {
        log.info("Creating product", 
            "title", request.getTitle(),
            "userId", getCurrentUserId(),
            "category", request.getCategory());
        
        Product product = new Product();
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        
        Product saved = productRepository.save(product);
        
        log.info("Product created successfully",
            "productId", saved.getId(),
            "userId", getCurrentUserId());
        
        return saved;
    }
    
    public void placeBid(Long productId, BigDecimal bidAmount) {
        log.info("Bid placed",
            "productId", productId,
            "userId", getCurrentUserId(),
            "bidAmount", bidAmount);
        
        Bid bid = new Bid();
        bid.setProductId(productId);
        bid.setBidAmount(bidAmount);
        
        bidRepository.save(bid);
        
        log.info("Bid saved successfully",
            "bidId", bid.getId(),
            "productId", productId);
    }
}
```

### WARN Level

**When to use:** Potentially harmful situations

**Usage:**
- Deprecated API usage
- Recovery from errors
- Unusual but handled conditions
- Performance issues (slow queries)
- Configuration warnings

**Example:**

```java
@Service
public class TokenService {
    
    private static final Logger log = LoggerFactory.getLogger(TokenService.class);
    
    public String generateToken(User user) {
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            log.warn("User has no password set",
                "userId", user.getId(),
                "email", user.getEmail());
        }
        
        return jwtService.createToken(user);
    }
    
    @Deprecated(since = "2.0")
    public void legacyMethod() {
        log.warn("Deprecated method called",
            "method", "legacyMethod",
            "replacement", "newMethod",
            "removalVersion", "3.0");
    }
    
    public Page<Product> searchWithSlowQuery(String query, Pageable pageable) {
        long startTime = System.currentTimeMillis();
        
        Page<Product> results = productRepository.searchByTitle(query, pageable);
        
        long duration = System.currentTimeMillis() - startTime;
        if (duration > 1000) {  // 1 second
            log.warn("Slow database query detected",
                "query", "searchByTitle",
                "duration_ms", duration,
                "results", results.getTotalElements());
        }
        
        return results;
    }
}
```

### ERROR Level

**When to use:** Error conditions requiring attention

**Usage:**
- Exceptions that need attention
- Failed operations
- Resource access failures
- Data consistency issues
- Transient failures that will retry

**Example:**

```java
@Service
public class NotificationService {
    
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    
    public void sendEmail(String to, String subject, String body) {
        try {
            mailService.send(to, subject, body);
            log.info("Email sent successfully", "to", to, "subject", subject);
        } catch (MailServiceException e) {
            log.error("Failed to send email",
                "to", to,
                "subject", subject,
                "error", e.getMessage(),
                "retry_count", retryCount);
            
            // Retry logic
            scheduleRetry(to, subject, body);
        }
    }
    
    public void processNotificationQueue() {
        try {
            Notification notification = queue.poll();
            // Process
        } catch (QueueException e) {
            log.error("Error processing notification queue",
                "error", e.getMessage(),
                "queue_size", queue.size(),
                e);  // Include stack trace for ERROR
        }
    }
}
```

### FATAL Level (rarely used)

**When to use:** Critical failures causing shutdown

**Usage:**
- JVM shutdown scenarios
- Critical system errors
- Irreversible failures

**Example:**

```java
@Component
public class SystemMonitor {
    
    private static final Logger log = LoggerFactory.getLogger(SystemMonitor.class);
    
    @EventListener(ApplicationFailedEvent.class)
    public void onApplicationFailed(ApplicationFailedEvent event) {
        log.error("FATAL: Application startup failed",
            "error", event.getException().getMessage(),
            event.getException());
    }
}
```

### Log Level Summary

| Level | Frequency | Best For | Should Include | Should Exclude |
|-------|-----------|----------|----------------|----------------|
| TRACE | High | Dev debugging | Variable values, flow | None |
| DEBUG | Medium | Troubleshooting | API calls, state changes | Stack traces |
| INFO | Medium | Audit trail | User actions, events | Details for each call |
| WARN | Low | Alerts | Issues, degradation | Normal flow |
| ERROR | Low | Monitoring | Failures, exceptions | Errors that will retry |
| FATAL | Very rare | Critical failures | System shutdown | Normal issues |

## Structured Logging Format

### Structured Format Guidelines

**Pattern:** `key=value key=value key=value`

```java
// Good - structured, parseable
log.info("User login",
    "userId", user.getId(),
    "email", user.getEmail(),
    "loginMethod", "email",
    "timestamp", LocalDateTime.now(),
    "ipAddress", request.getRemoteAddr());

// Produces: userId=123 email=user@example.com loginMethod=email timestamp=2024-01-01T10:00:00 ipAddress=192.168.1.1

// Bad - unstructured, hard to parse
log.info("User " + user.getId() + " logged in via email from " + request.getRemoteAddr());
```

### Using SLF4J with Structured Format

```java
// Simple key-value pattern
log.info("Product created",
    "productId", product.getId(),
    "title", product.getTitle(),
    "userId", userId,
    "price", product.getPrice());

// With MDC for context
MDC.put("requestId", uuid);
MDC.put("userId", userId);
log.info("Processing bid request", "productId", productId, "bidAmount", amount);
MDC.clear();
```

### Logback Configuration for Structured Format

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>
                %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %X{requestId} %X{userId} %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <encoder>
            <pattern>
                %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %X{requestId} %X{userId} %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>logs/archive/application-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>

    <logger name="gateway" level="DEBUG"/>
    <logger name="gateway.controller" level="INFO"/>
</configuration>
```

## Correlation IDs and Tracing

### Correlation ID Implementation

```java
// Generate and propagate correlation ID
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        
        // Get existing or generate new correlation ID
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }
        
        // Add to MDC for all logs in this request
        MDC.put("correlationId", correlationId);
        MDC.put("userId", extractUserId(request));
        MDC.put("endpoint", request.getRequestURI());
        MDC.put("method", request.getMethod());
        
        // Add response header
        response.setHeader(CORRELATION_ID_HEADER, correlationId);
        
        try {
            long startTime = System.currentTimeMillis();
            filterChain.doFilter(request, response);
            long duration = System.currentTimeMillis() - startTime;
            
            MDC.put("duration_ms", String.valueOf(duration));
            MDC.put("status", String.valueOf(response.getStatus()));
            
        } finally {
            MDC.clear();
        }
    }
    
    private String extractUserId(HttpServletRequest request) {
        // Extract from JWT token
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            try {
                String token = auth.substring(7);
                // Decode JWT to get userId
                return extractUserIdFromToken(token);
            } catch (Exception e) {
                return "anonymous";
            }
        }
        return "anonymous";
    }
}

// Logback pattern including correlation ID
<pattern>
    %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %X{correlationId} %X{userId} %X{endpoint} %-5level %logger{36} - %msg%n
</pattern>

// Output example
// 2024-01-01 10:30:45.123 [http-nio-8080-exec-1] abc-123-def-456 userId=789 /api/products GET INFO gateway.controller.ProductController - Getting product details
```

### Distributed Tracing Headers

```java
// Propagate correlation ID to downstream services
@Service
public class ProductGrpcClient {
    
    private final ManagedChannel channel;
    private static final Logger log = LoggerFactory.getLogger(ProductGrpcClient.class);
    
    public Mono<ProductResponse> getProduct(Long productId) {
        String correlationId = MDC.get("correlationId");
        String userId = MDC.get("userId");
        
        log.info("Calling Products gRPC service",
            "productId", productId,
            "correlationId", correlationId);
        
        // Create metadata with correlation ID for gRPC
        Metadata metadata = new Metadata();
        metadata.put(Metadata.Key.of("correlation-id", Metadata.ASCII_STRING_MARSHALLER), correlationId);
        metadata.put(Metadata.Key.of("user-id", Metadata.ASCII_STRING_MARSHALLER), userId);
        
        GetProductRequest request = GetProductRequest.newBuilder()
            .setProductId(productId)
            .build();
        
        return Mono.create(sink -> {
            stub.withCompression("gzip")
                .withInterceptors(new ClientInterceptor() {
                    @Override
                    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
                            MethodDescriptor<ReqT, RespT> method,
                            CallOptions callOptions,
                            Channel next) {
                        return next.newCall(method, callOptions.withCompression("gzip"));
                    }
                })
                .getProduct(request, new StreamObserver<ProductResponse>() {
                    @Override
                    public void onNext(ProductResponse response) {
                        log.info("Products gRPC call completed",
                            "productId", productId,
                            "correlationId", correlationId);
                        sink.success(response);
                    }
                    
                    @Override
                    public void onError(Throwable t) {
                        log.error("Products gRPC call failed",
                            "productId", productId,
                            "correlationId", correlationId,
                            "error", t.getMessage());
                        sink.error(t);
                    }
                    
                    @Override
                    public void onCompleted() {}
                });
        });
    }
}
```

## Sensitive Data Handling

### Data to Never Log

```java
// ❌ NEVER LOG:
log.info("User login with password: {}", password);
log.debug("Credit card: {}", creditCard);
log.info("SSN: {}", ssn);
log.info("API key: {}", apiKey);
log.error("Database password: {}", dbPassword);

// ✅ DO THIS INSTEAD:

// 1. Mask sensitive data
private static String maskPassword(String password) {
    if (password == null || password.isEmpty()) {
        return "***";
    }
    return password.charAt(0) + "***";
}

private static String maskCreditCard(String card) {
    if (card == null || card.length() < 4) {
        return "****";
    }
    return "****-****-****-" + card.substring(card.length() - 4);
}

private static String maskEmail(String email) {
    int atIndex = email.indexOf('@');
    if (atIndex > 1) {
        return email.charAt(0) + "***" + email.substring(atIndex - 1);
    }
    return "***@***";
}

// 2. Omit sensitive fields
log.info("User login attempt",
    "email", maskEmail(email),
    "method", "password",
    "timestamp", LocalDateTime.now());
// Don't include: password, ssn, credit card, api keys

// 3. Sanitize error messages
@ExceptionHandler(PaymentException.class)
public ResponseEntity<?> handlePayment(PaymentException ex) {
    log.error("Payment processing failed",
        "error", "Payment service error");  // Generic message
    
    // Don't log: "Payment failed: Card declined - Visa 1234",
    //           "Payment failed: Connection to https://payment-api.com failed"
    
    return ResponseEntity.status(500)
        .body(new ErrorResponse("Payment processing failed"));
}
```

### Sensitive Data Patterns

```java
// Create utility for consistent handling
public class LoggingSanitizer {
    
    // Email regex patterns to mask
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("([^@]{1})[^@]*(@[^\\s]+)");
    
    private static final Pattern CARD_PATTERN =
        Pattern.compile("\\b(\\d{4})[\\s-]?(\\d{4})[\\s-]?(\\d{4})[\\s-]?(\\d{4})\\b");
    
    private static final Pattern SSN_PATTERN =
        Pattern.compile("\\b(\\d{3})[\\s-]?(\\d{2})[\\s-]?(\\d{4})\\b");
    
    public static String sanitize(String input) {
        if (input == null) return "";
        
        String sanitized = input;
        
        // Mask email
        sanitized = EMAIL_PATTERN.matcher(sanitized)
            .replaceAll("$1***$2");
        
        // Mask credit card
        sanitized = CARD_PATTERN.matcher(sanitized)
            .replaceAll("$1-****-****-$4");
        
        // Mask SSN
        sanitized = SSN_PATTERN.matcher(sanitized)
            .replaceAll("***-**-$3");
        
        return sanitized;
    }
}

// Usage
String input = "User john@example.com with card 1234-5678-9012-3456";
log.info("Transaction: {}", LoggingSanitizer.sanitize(input));
// Output: Transaction: User j***@example.com with card 1234-****-****-3456
```

## Performance Impact Considerations

### Lazy Evaluation with String Formatting

```java
// ❌ String concatenation - evaluated always (performance hit)
log.debug("Product details: " + product.getId() + " - " + product.getTitle()
    + " - " + product.getDescription());  // String created even if log level is INFO

// ✅ Parameterized logging - lazy evaluation
log.debug("Product details: {} - {} - {}",
    product.getId(),
    product.getTitle(),
    product.getDescription());  // Only formatted if DEBUG level enabled

// ✅ Using supplier for expensive operations
log.debug("Product details: {}",
    () -> expensiveStringBuilding(product));  // Only called if DEBUG enabled

private static String expensiveStringBuilding(Product product) {
    // Do heavy computation only if needed
    return product.toString();
}
```

### Log Level Guards for Expensive Operations

```java
// ❌ Expensive operation always executed
log.debug("Processing data: {}", expensiveCalculation());

// ✅ Guard with log level check
if (log.isDebugEnabled()) {
    log.debug("Processing data: {}", expensiveCalculation());
}

// Better: Use supplier pattern (SLF4J 1.8+)
log.debug("Processing data: {}", () -> expensiveCalculation());
```

### Batch Logging

```java
// ❌ Logging in tight loops - potential performance issue
for (Product product : products) {
    log.info("Processing product: {}", product.getId());  // 1000+ logs
}

// ✅ Batch logging
log.info("Processing {} products from index {} to {}",
    products.size(),
    startIndex,
    endIndex);

// Process products
for (Product product : products) {
    // Processing without logging
}

log.info("Processed {} products successfully", products.size());
```

### Asynchronous Appenders

```xml
<!-- Use AsyncAppender for non-blocking logging -->
<configuration>
    <appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
        <appender-ref ref="FILE"/>
        <queueSize>512</queueSize>
        <discardingThreshold>0</discardingThreshold>
        <includeCallerData>false</includeCallerData>
    </appender>

    <root level="INFO">
        <appender-ref ref="ASYNC_FILE"/>
    </root>
</configuration>
```

## Monitoring and Alerting Integration

### Logging for Monitoring

```java
// Structure logs for easy monitoring/alerting
@Service
public class AuctionService {
    
    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);
    
    // 1. Auction ending (important business event)
    public void endAuction(Long auctionId) {
        log.info("AUCTION_ENDED",
            "auctionId", auctionId,
            "highestBidId", highestBid.getId(),
            "winnerUserId", highestBid.getUserId(),
            "finalPrice", highestBid.getAmount(),
            "bidsCount", bidsCount);
    }
    
    // 2. Payment failures (alert needed)
    public void processAuctionPayment(Auction auction) {
        try {
            paymentService.processPayment(auction);
        } catch (PaymentException e) {
            log.error("PAYMENT_FAILED",
                "auctionId", auction.getId(),
                "buyerId", auction.getWinner(),
                "amount", auction.getFinalPrice(),
                "errorCode", e.getCode(),
                "retryable", e.isRetryable());
        }
    }
    
    // 3. Performance issues (SLA monitoring)
    public List<Auction> searchAuctions(String query) {
        long startTime = System.currentTimeMillis();
        
        List<Auction> results = auctionRepository.search(query);
        
        long duration = System.currentTimeMillis() - startTime;
        if (duration > 5000) {  // SLA: search should be < 5s
            log.warn("SLOW_SEARCH_QUERY",
                "query", query,
                "duration_ms", duration,
                "resultsCount", results.size(),
                "sla_ms", 5000);
        }
        
        return results;
    }
}
```

### Log-Based Metrics

```java
// Extract metrics from logs
@Service
public class MetricsService {
    
    private static final Logger log = LoggerFactory.getLogger(MetricsService.class);
    private final MeterRegistry meterRegistry;
    
    public void logUserLogin(String userId) {
        log.info("USER_LOGIN",
            "userId", userId,
            "timestamp", System.currentTimeMillis());
        
        // Also increment metric
        meterRegistry.counter("user.login").increment();
    }
    
    public void logBidPlaced(Long productId, BigDecimal amount) {
        log.info("BID_PLACED",
            "productId", productId,
            "bidAmount", amount);
        
        meterRegistry.counter("bid.placed").increment();
        meterRegistry.timer("bid.amount").record(amount.doubleValue(), TimeUnit.MICROSECONDS);
    }
}
```

### Alerting Rules (for monitoring system)

```yaml
# prometheus-rules.yml
groups:
  - name: application_alerts
    rules:
      # Alert when errors exceed threshold
      - alert: HighErrorRate
        expr: rate(log_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      # Alert when slow queries detected
      - alert: SlowQueries
        expr: log_slow_queries_total > 10
        for: 10m
        annotations:
          summary: "Multiple slow queries detected"

      # Alert when authentication failures high
      - alert: HighAuthFailureRate
        expr: rate(user_login_failed_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High authentication failure rate"
```

## Logging Patterns by Component

### Controller Logging

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    private static final Logger log = LoggerFactory.getLogger(ProductController.class);
    
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
        // 1. Log incoming request at INFO level
        log.info("Create product request received",
            "title", request.getTitle(),
            "userId", getCurrentUserId());
        
        try {
            // 2. Call service
            Product product = productService.create(request);
            
            // 3. Log successful response
            log.info("Product created successfully",
                "productId", product.getId(),
                "userId", getCurrentUserId());
            
            return ResponseEntity.created(URI.create("/api/products/" + product.getId()))
                .body(ApiResponse.success(product));
                
        } catch (ValidationException e) {
            // 4. Log validation errors at WARN level
            log.warn("Product creation validation failed",
                "error", e.getMessage(),
                "userId", getCurrentUserId());
            
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, e.getMessage()));
                
        } catch (Exception e) {
            // 5. Log unexpected errors at ERROR level with stack trace
            log.error("Unexpected error creating product",
                "userId", getCurrentUserId(),
                "error", e.getMessage(),
                e);
            
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "Internal server error"));
        }
    }
}
```

### Service Logging

```java
@Service
public class ProductService {
    
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    
    @Transactional
    public Product create(CreateProductRequest request) {
        log.debug("Creating product in service",
            "title", request.getTitle());
        
        // Validate business rules
        if (productRepository.existsByTitle(request.getTitle())) {
            log.warn("Duplicate product title",
                "title", request.getTitle(),
                "userId", getCurrentUserId());
            throw new ConflictException("Product already exists");
        }
        
        // Create and save
        Product product = new Product();
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        
        Product saved = productRepository.save(product);
        
        log.debug("Product entity saved",
            "productId", saved.getId());
        
        // Publish event
        publishEvent(new ProductCreatedEvent(saved));
        
        log.info("Product created successfully",
            "productId", saved.getId(),
            "userId", getCurrentUserId());
        
        return saved;
    }
}
```

### Repository Logging

```java
@Repository
public class ProductRepositoryImpl implements ProductRepository {
    
    private static final Logger log = LoggerFactory.getLogger(ProductRepositoryImpl.class);
    
    @Override
    public Product save(Product product) {
        log.debug("Saving product entity",
            "title", product.getTitle());
        
        try {
            Product saved = jpaRepository.save(product);
            log.debug("Product saved successfully",
                "productId", saved.getId());
            return saved;
            
        } catch (DataIntegrityViolationException e) {
            log.error("Database constraint violation",
                "error", e.getMessage(),
                "title", product.getTitle());
            throw new DataAccessException("Failed to save product", e);
        }
    }
}
```

## Log Configuration

### Application Properties

```yaml
# application.yml - Development
spring:
  application:
    name: gateway

logging:
  level:
    root: INFO
    gateway: DEBUG
    gateway.controller: INFO
    gateway.service: DEBUG
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %X{correlationId} %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %X{correlationId} %-5level %logger{36} - %msg%n"
  file:
    name: logs/application.log
  logback:
    rollingpolicy:
      max-file-size: 10MB
      max-history: 30
      total-size-cap: 1GB

# production
---
spring:
  profiles: prod

logging:
  level:
    root: WARN
    gateway: INFO
  file:
    name: /var/log/auction-gateway/application.log
  logback:
    rollingpolicy:
      max-file-size: 100MB
      max-history: 90
```

### Logback Configuration

```xml
<!-- logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProfile name="dev">
        <root level="DEBUG"/>
    </springProfile>
    
    <springProfile name="prod">
        <root level="WARN"/>
    </springProfile>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>
                %d{HH:mm:ss.SSS} [%thread] %X{correlationId} %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
    </appender>

    <appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
        <appender-ref ref="FILE"/>
        <queueSize>512</queueSize>
        <discardingThreshold>0</discardingThreshold>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/application.log</file>
        <encoder>
            <pattern>
                %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %X{correlationId} %X{userId} %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>logs/archive/application-%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="ASYNC_FILE"/>
    </root>

    <logger name="gateway" level="DEBUG"/>
    <logger name="org.springframework" level="WARN"/>
    <logger name="org.hibernate" level="WARN"/>
</configuration>
```

## Troubleshooting with Logs

### Finding Issues with Correlation IDs

```bash
# Extract all logs for a specific request
grep "correlationId=abc-123-def" logs/application.log

# Output:
# 2024-01-01 10:30:45.123 [http-nio-8080-exec-1] abc-123-def-456 userId=789 /api/products GET INFO gateway.controller - Request received
# 2024-01-01 10:30:45.125 [http-nio-8080-exec-1] abc-123-def-456 userId=789 /api/products GET DEBUG gateway.service - Creating product
# 2024-01-01 10:30:45.234 [pool-2-thread-1] abc-123-def-456 userId=789 /api/products GET INFO gateway.service - Product created
# 2024-01-01 10:30:45.235 [http-nio-8080-exec-1] abc-123-def-456 userId=789 /api/products GET INFO gateway.controller - Response sent
```

### Identifying Performance Issues

```bash
# Find all slow queries
grep "SLOW_SEARCH_QUERY\|SLOW_DATABASE\|duration_ms" logs/application.log | \
  awk -F'duration_ms=' '{print $2}' | sort -nr | head -10

# Output:
# 5234
# 4521
# 4001
# 3999
```

### Monitoring Error Patterns

```bash
# Count errors by type
grep "ERROR" logs/application.log | \
  sed 's/.*ERROR //' | \
  awk '{print $1}' | \
  sort | uniq -c | sort -nr

# Output:
#   45 PAYMENT_FAILED
#   23 DATABASE_ERROR
#   12 TIMEOUT_ERROR
#    5 AUTH_ERROR
```

---

For implementation examples, see [CODE_STANDARDS.md](./CODE_STANDARDS.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).
