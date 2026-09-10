# System Architecture and Design

Comprehensive documentation of the Online Auction Platform backend microservices architecture, design patterns, and system interactions.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Architecture](#service-architecture)
3. [Communication Patterns](#communication-patterns)
4. [Data Flow](#data-flow)
5. [Layer Responsibilities](#layer-responsibilities)
6. [Error Propagation Flow](#error-propagation-flow)
7. [Logging and Tracing Strategy](#logging-and-tracing-strategy)
8. [Configuration Management](#configuration-management)
9. [Security Boundaries](#security-boundaries)
10. [Deployment Architecture](#deployment-architecture)

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Client Applications (Web/Mobile)               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────────┐
│                    API Gateway (Port 8080)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • JWT Authentication & Authorization                     │   │
│  │ • Rate Limiting (Bucket4j)                              │   │
│  │ • Request/Response Logging                              │   │
│  │ • CORS Handling                                         │   │
│  │ • Global Exception Handling                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└────┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
     │ gRPC     │ gRPC     │ gRPC     │ gRPC     │ WebSocket
     │          │          │          │          │
┌────▼──────┐ ┌─▼────────┐ ┌──▼──────┐ ┌──▼────┐ ┌──▼──────┐
│   User     │ │ Products │ │Notif.   │ │Rating │ │  Chat   │
│  Service   │ │ Service  │ │Service  │ │Service│ │ Service │
│ (Port 9090)│ │(9091)    │ │(9092)   │ │(9093) │ │(8081)   │
└────┬──────┘ └──┬───────┘ └──┬──────┘ └──┬────┘ └────┬─────┘
     │           │            │            │          │
     │           │            │  RabbitMQ  │          │
     │           │            └─────┬──────┘          │
     │           │                  │                 │
     └───────────┼──────────────────┼─────────────────┘
                 │                  │
            ┌────▼──────────────────▼─────┐
            │  Message Queue (RabbitMQ)    │
            │  (Event bus for services)    │
            └────────┬─────────────────────┘
                     │
         ┌───────────┼──────────────┐
         │           │              │
    ┌────▼─────┐ ┌──▼────────┐ ┌──▼───────┐
    │  MySQL   │ │   Redis   │ │  Loki    │
    │Database  │ │  Cache    │ │  Logs    │
    └──────────┘ └───────────┘ └──────────┘
```

### Service Topology

| Service | Port | Protocol | Protocol | Database | Dependencies |
|---------|------|----------|----------|----------|--------------|
| Gateway | 8080 | HTTP/REST | N/A | N/A | User, Products, Chat, Notification |
| User | 9090 | gRPC | Spring Boot | MySQL | N/A |
| Products | 9091 | gRPC | Spring Boot | MySQL | User, Rating |
| Notification | 9092 | gRPC | Spring Boot | MySQL | RabbitMQ, User, Products |
| Rating | 9093 | gRPC | Spring Boot | MySQL | User, Products |
| Chat | 8081 | HTTP/WebSocket | Spring Boot | MySQL | User |

## Service Architecture

### API Gateway Service

**Responsibility:** API entry point, authentication, routing, rate limiting

**Key Components:**

```
gateway/
├── config/
│   ├── WebSecurityConfig         # JWT security configuration
│   ├── JwtDecoderConfig          # Token validation
│   ├── JwtAuthenticationFilter   # Token extraction & validation
│   ├── LoggingInterceptor        # Request/response logging
│   ├── RateLimitInterceptor      # Rate limit enforcement
│   ├── OpenApiConfig             # Swagger/OpenAPI setup
│   ├── MetricsConfig             # Prometheus metrics
│   └── CloudinaryConfig          # Image upload config
├── controller/
│   ├── AuthController            # /api/auth/* endpoints
│   ├── GuestController           # /api/guest/* endpoints
│   ├── SellerController          # /api/seller/* endpoints
│   ├── BidderController          # /api/bidder/* endpoints
│   ├── AdminController           # /api/admin/* endpoints
│   └── PaymentController         # /api/payment/* endpoints
├── grpc/
│   ├── UserGrpcClient            # User service client
│   ├── ProductGrpcClient         # Products service client
│   └── RatingGrpcClient          # Rating service client
├── service/
│   ├── GoogleOAuthService        # Google OAuth integration
│   ├── StripeService             # Payment processing
│   └── CloudinaryService         # Image hosting
└── exception/
    └── GlobalExceptionHandler    # Centralized error handling
```

**Request Flow:**

```
Client Request
    ↓
CORS Filter
    ↓
Logging Interceptor (log request)
    ↓
Rate Limit Interceptor (check rate limits)
    ↓
JwtAuthenticationFilter (extract & validate token)
    ↓
Authentication Check (if protected endpoint)
    ↓
Controller (route to handler)
    ↓
gRPC Client (call microservice)
    ↓
Response Processing
    ↓
Logging Interceptor (log response)
    ↓
Exception Handler (if error)
    ↓
Client Response
```

### User Service (gRPC Port 9090)

**Responsibility:** User management, authentication, JWT generation, profiles

**Key Features:**
- User registration with email verification
- Login/logout with JWT tokens
- Password management and reset
- User profiles and preferences
- OTP generation and verification

**Database Schema:**
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    role ENUM('ADMIN', 'SELLER', 'BIDDER') DEFAULT 'BIDDER',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE otp_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    otp VARCHAR(6) NOT NULL,
    purpose ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET'),
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE jwt_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    token_type ENUM('ACCESS', 'REFRESH'),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**gRPC Service Interface:**
```proto
service AuthService {
    rpc Register(RegisterRequest) returns (RegisterResponse);
    rpc Login(LoginRequest) returns (LoginResponse);
    rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
    rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
    rpc GetProfile(GetProfileRequest) returns (GetProfileResponse);
    rpc UpdateProfile(UpdateProfileRequest) returns (UpdateProfileResponse);
    rpc ChangePassword(ChangePasswordRequest) returns (ChangePasswordResponse);
    rpc VerifyOTP(VerifyOTPRequest) returns (VerifyOTPResponse);
}
```

### Products Service (gRPC Port 9091)

**Responsibility:** Product listings, bidding, auction management, search

**Key Features:**
- Create/update product listings
- Bidding system with highest bidder tracking
- Product search and filtering
- Watchlist management
- Inventory management

**Database Schema:**
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    starting_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'SOLD') DEFAULT 'DRAFT',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_end_time (end_time)
);

CREATE TABLE bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (bidder_id) REFERENCES users(id),
    INDEX idx_product_id (product_id),
    INDEX idx_bidder_id (bidder_id)
);
```

### Notification Service (gRPC Port 9092)

**Responsibility:** Email notifications, event processing via RabbitMQ

**Key Features:**
- Email notifications for auction events
- RabbitMQ event consumer
- Template-based emails
- Retry mechanism for failed notifications

**Architecture:**

```
User/Product Service (publishes event)
    ↓
RabbitMQ (message queue)
    ↓
Notification Service Consumer
    ↓
Validates & Processes
    ↓
Email Service
    ↓
SMTP Gateway (sends email)
    ↓
Recipient Email
```

**Supported Events:**
- `auction.product.created` - New auction created
- `auction.bid.placed` - Bid placed on product
- `auction.auction.ended` - Auction ended notification
- `user.registered` - Welcome email
- `user.email.verification` - Verify email
- `user.password.reset` - Password reset link

### Chat Service (HTTP/WebSocket Port 8081)

**Responsibility:** Real-time messaging between users

**Key Features:**
- WebSocket connections for real-time messaging
- Message history and persistence
- Conversation management
- User online/offline status

**WebSocket Message Flow:**

```
Client 1                 Server                    Client 2
  │                        │                           │
  ├─ CONNECT ──────────────>                           │
  │                        ├─ Authenticate             │
  │                        │                           │
  │                        <─── CONNECT_ACK ──────────┤
  │                        │                           │
  ├─ SEND_MESSAGE ────────>                           │
  │                        ├─ Store in DB              │
  │                        ├─ Broadcast ───────────────>
  │                        │                           │
  │  <─ MESSAGE_RECEIVED ─────────────────────────────┤
  │                        │                           │
  ├─ DISCONNECT ─────────>                           │
  │                        └─ Cleanup                  │
```

## Communication Patterns

### Synchronous Communication (gRPC)

**Use case:** Service-to-service calls requiring immediate response

**Pattern:**

```java
// Gateway calls User Service synchronously
@Service
public class AuthController {
    private final UserGrpcClient userGrpcClient;
    
    @PostMapping("/register")
    public Mono<ResponseEntity<?>> register(@Valid @RequestBody RegisterRequest request) {
        // Blocking call to User Service
        return userGrpcClient.register(grpcRequest)
            .map(response -> {
                // Process response
                return ResponseEntity.ok(response);
            })
            .onErrorResume(e -> handleError(e));
    }
}
```

**Advantages:**
- Immediate feedback
- Simple error handling
- Guaranteed delivery

**Disadvantages:**
- Tight coupling
- Slower if downstream service is slow
- Cascading failures possible

### Asynchronous Communication (RabbitMQ)

**Use case:** Event notifications, decoupled services

**Pattern:**

```java
// Product Service publishes event
@Service
public class ProductService {
    private final RabbitTemplate rabbitTemplate;
    
    public Product createProduct(CreateProductRequest request) {
        Product product = productRepository.save(...);
        
        // Publish event (fire and forget)
        ProductCreatedEvent event = new ProductCreatedEvent(product);
        rabbitTemplate.convertAndSend("exchange", "routing.key", event);
        
        return product;
    }
}

// Notification Service consumes event
@Service
public class NotificationService {
    
    @RabbitListener(queues = "notification.queue")
    public void handleProductCreated(ProductCreatedEvent event) {
        log.info("Product created: {}", event.getProductId());
        
        // Send welcome/notification email
        emailService.sendProductCreatedNotification(event);
    }
}
```

**Advantages:**
- Loose coupling
- Better scalability
- Service can be offline temporarily
- Eventual consistency

**Disadvantages:**
- Eventual consistency (not immediate)
- More complex debugging
- Message ordering challenges

### gRPC vs HTTP Decision Matrix

| Criterion | gRPC | HTTP/REST |
|-----------|------|-----------|
| **Latency** | Very low (binary protocol) | Higher (JSON parsing) |
| **Bandwidth** | Very low (Protobuf) | Higher (JSON) |
| **Complexity** | Higher (Proto definitions) | Lower |
| **Browser Support** | Limited (gRPC-web) | Full |
| **Internal Services** | Preferred | Not preferred |
| **Public APIs** | Not ideal | Preferred |

**Decision:**
- **Internal service-to-service:** Use gRPC
- **Public APIs:** Use HTTP/REST
- **Real-time client updates:** Use WebSocket

## Data Flow

### User Registration Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Client POST /api/auth/register                      │
│    { email, password, fullName, phoneNumber, address } │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 2. Gateway: AuthController                             │
│    - Log incoming request                              │
│    - Validate input (email format, password strength)  │
│    - Call UserGrpcClient.register()                    │
└────────────────┬────────────────────────────────────────┘
                 │ gRPC
┌────────────────▼────────────────────────────────────────┐
│ 3. User Service: AuthGrpcService                       │
│    - Check if user exists (query by email)             │
│    - Hash password (bcrypt)                            │
│    - Generate OTP (6 digits)                           │
│    - Store user record in database                     │
│    - Store OTP record with 10min expiry                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 4. Publish event: user.registered                      │
│    (via RabbitMQ to Notification Service)              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 5. Notification Service (async)                        │
│    - Consume user.registered event                     │
│    - Send welcome email with OTP                       │
│    - Update notification log                           │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 6. Return response to client                           │
│    {                                                    │
│      success: true,                                    │
│      userId: "12345",                                  │
│      email: "user@example.com",                        │
│      otp: "123456",                                    │
│      otpExpiryMinutes: 10                              │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
```

### Bidding Flow

```
┌────────────────────────────────────────────────────────┐
│ 1. Client POST /api/bidder/products/{id}/bid           │
│    { bidAmount: 150.00 }                               │
│    Auth: Bearer {accessToken}                          │
└────────────┬───────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────┐
│ 2. Gateway: BidderController                          │
│    - Validate JWT token (expiry, signature)           │
│    - Extract userId from token                        │
│    - Validate bid amount (> 0)                        │
│    - Call ProductGrpcClient.placeBid()               │
└────────────┬───────────────────────────────────────────┘
             │ gRPC
┌────────────▼───────────────────────────────────────────┐
│ 3. Products Service: BidderGrpcService               │
│    - Get product by ID                                │
│    - Check auction status (not expired)               │
│    - Get current highest bid                          │
│    - Validate bid (must exceed highest)               │
│    - Save new bid to database                         │
│    - Update product current_price                     │
└────────────┬───────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────┐
│ 4. Publish events                                      │
│    - auction.bid.placed                               │
│    - (optional) outbid notification to previous bid   │
└────────────┬───────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────┐
│ 5. Return response                                     │
│    {                                                   │
│      success: true,                                   │
│      message: "Bid placed successfully",              │
│      currentBid: 150.00,                              │
│      isHighestBid: true                               │
│    }                                                   │
└────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Presentation Layer (Controllers)

**Responsibility:** HTTP/REST interface, request validation

**Responsibilities:**
- Accept HTTP requests
- Validate input using @Valid and custom validators
- Deserialize JSON to DTOs
- Call service layer
- Serialize responses to JSON
- Handle exceptions (propagate to GlobalExceptionHandler)
- Log API calls

**Don't:**
- Write business logic in controllers
- Access database directly
- Create entity objects from requests (use DTOs)
- Catch and suppress exceptions

```java
// Good
@PostMapping("/products")
public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
    log.info("Creating product: {}", request.getTitle());
    
    try {
        Product product = productService.create(request);
        return ResponseEntity.ok(ProductResponse.from(product));
    } catch (DuplicateProductException e) {
        log.warn("Duplicate product: {}", e.getMessage());
        throw e;  // Let GlobalExceptionHandler handle it
    }
}

// Bad - business logic in controller
@PostMapping("/products")
public ResponseEntity<?> createProduct(@RequestBody Product product) {
    if (productRepository.existsByTitle(product.getTitle())) {
        // Don't put business logic here
        throw new Exception("Duplicate");
    }
    productRepository.save(product);
    return ResponseEntity.ok(product);
}
```

### Service Layer

**Responsibility:** Business logic, orchestration, transactions

**Responsibilities:**
- Implement business logic and workflows
- Orchestrate calls to repositories and other services
- Handle transactions
- Implement caching
- Validate business rules
- Raise appropriate exceptions

**Don't:**
- Handle HTTP responses (that's controller's job)
- Access HttpRequest/HttpResponse directly
- Catch and log exceptions (let them propagate)

```java
// Good
@Service
public class ProductService {
    
    @Transactional
    public Product createProduct(CreateProductRequest request) {
        // Validate business rules
        if (productRepository.existsByTitle(request.getTitle())) {
            throw new DuplicateProductException("Product already exists");
        }
        
        // Create entity
        Product product = new Product();
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setStartingPrice(request.getStartingPrice());
        
        // Save and return
        return productRepository.save(product);
    }
}

// Bad - mixing concerns
@Service
public class BadProductService {
    
    public ResponseEntity<?> createProduct(HttpServletRequest req) {
        try {
            // Don't parse HTTP directly
            Map<String, Object> body = parseRequest(req);
            // ... business logic ...
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
```

### Data Access Layer (Repositories)

**Responsibility:** Database operations

**Responsibilities:**
- Define database queries
- Manage transactions (if not at service level)
- Handle database exceptions
- Provide abstractions for data access

**Don't:**
- Implement business logic
- Make HTTP calls
- Orchestrate multiple repositories

```java
// Good
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Custom query methods
    List<Product> findByUserIdAndStatus(Long userId, String status);
    
    Page<Product> findByCategoryAndStatusOrderByCreatedAtDesc(
        String category, String status, Pageable pageable);
    
    boolean existsByTitle(String title);
    
    @Modifying
    @Transactional
    void updateStatusByIds(List<Long> ids, String status);
}
```

### gRPC Service Layer

**Responsibility:** gRPC endpoint implementations

**Responsibilities:**
- Implement protobuf service methods
- Convert gRPC requests to domain objects
- Call business services
- Convert domain objects to gRPC responses
- Handle and convert exceptions to gRPC errors

```java
// Good
@Service
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {
    
    private final UserService userService;
    
    @Override
    public void register(RegisterRequest request, 
                        StreamObserver<RegisterResponse> responseObserver) {
        try {
            // Convert gRPC request to domain object
            CreateUserRequest userRequest = new CreateUserRequest(
                request.getEmail(),
                request.getPassword(),
                request.getFullName()
            );
            
            // Call business service
            User user = userService.createUser(userRequest);
            
            // Convert domain object to gRPC response
            RegisterResponse response = RegisterResponse.newBuilder()
                .setSuccess(true)
                .setUserId(String.valueOf(user.getId()))
                .build();
            
            responseObserver.onNext(response);
            responseObserver.onCompleted();
            
        } catch (DuplicateUserException e) {
            // Convert exception to gRPC status
            responseObserver.onError(
                Status.ALREADY_EXISTS.withDescription(e.getMessage()).asException()
            );
        }
    }
}
```

## Error Propagation Flow

```
Layer 1: REST Endpoint         Layer 2: Service              Layer 3: Repository
┌──────────────────────┐      ┌──────────────────────┐     ┌──────────────────┐
│ @PostMapping         │      │ @Service             │     │ JpaRepository    │
│ Controller           │      │ ProductService       │     │ ProductRepo      │
└──────┬───────────────┘      └──────┬───────────────┘     └────┬─────────────┘
       │                             │                          │
       │ Calls                       │ Calls                     │
       ├────────────────────────────>│                           │
       │                             ├──────────────────────────>│
       │                             │                           │ SQL Error
       │                             │                     <─────┤
       │                             │ catch + wrap
       │                             │ throws ProductNotFoundException
       │                    <────────┤
       │ throws ProductNotFoundException
       │
       │ Catches exception
       │ (GlobalExceptionHandler catches it)
       │
       ├─> Logs: "Resource not found: {}"
       ├─> Status: 404
       └─> Response: { success: false, message: "..." }
       
       │
       └─> Client
```

**Best Practices:**

1. **Catch at repository level** - Convert database exceptions
2. **Wrap and re-throw** - Keep context, convert between layers
3. **Use specific exceptions** - Avoid generic `Exception`
4. **Don't catch in middle layers** - Let exceptions propagate
5. **Handle at top level** - GlobalExceptionHandler handles HTTP conversion

```java
// Repository level: convert database exception
@Repository
public class ProductRepository extends JpaRepository<Product, Long> {
    public Product getById(Long id) {
        try {
            return findById(id).orElseThrow(() ->
                new ProductNotFoundException("Product not found"));
        } catch (DatabaseException e) {
            throw new DataAccessException("Database error", e);
        }
    }
}

// Service level: add context, let it propagate
@Service
public class ProductService {
    public Product getProduct(Long id) {
        // Let exception propagate
        return productRepository.getById(id);
    }
}

// Controller level: let GlobalExceptionHandler deal with it
@RestController
public class ProductController {
    @GetMapping("/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        // Exception propagates to GlobalExceptionHandler
        return ResponseEntity.ok(productService.getProduct(id));
    }
}

// GlobalExceptionHandler: convert to HTTP response
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ProductNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }
}
```

## Logging and Tracing Strategy

### Correlation ID / Request ID

```java
// MDC (Mapped Diagnostic Context) for request tracking
@Component
public class RequestIdFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId);
        MDC.put("userId", extractUserId(request));
        MDC.put("endpoint", request.getRequestURI());
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}

// logback.xml configuration
<appender name="FILE" class="ch.qos.logback.core.FileAppender">
    <file>logs/application.log</file>
    <encoder>
        <pattern>
            %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %X{requestId} %X{userId} %-5level %logger{36} - %msg%n
        </pattern>
    </encoder>
</appender>
```

### Structured Logging for Observability

```java
// All logs should be structured for easier parsing/searching
log.info("Product viewed", 
    "productId", productId,
    "userId", userId,
    "viewDuration", duration,
    "device", userAgent
);

// Parsed as:
// timestamp=... productId=123 userId=456 viewDuration=1234 device=Chrome
```

### Distributed Tracing

```
Gateway (Request arrives)
  ├─ Trace ID: abc123
  ├─ Span ID: span-1
  ├─ Log: "Auth: Request received"
  │
  ├─ Call User Service (gRPC)
  │ ├─ Propagate Trace ID: abc123
  │ ├─ Span ID: span-2
  │ └─ Log: "Auth: Validating token"
  │
  └─ Call Products Service (gRPC)
    ├─ Propagate Trace ID: abc123
    ├─ Span ID: span-3
    └─ Log: "Products: Fetching product"
```

## Configuration Management

### Environment-Based Configuration

```yaml
# application.yml (base)
spring:
  application:
    name: gateway
  profiles:
    active: dev

---
# application-dev.yml
spring:
  profiles: dev
  datasource:
    url: jdbc:mysql://localhost:3306/auction_dev
    username: root
    password: dev_password
  redis:
    host: localhost
    port: 6379

logging:
  level:
    root: INFO
    gateway: DEBUG

---
# application-prod.yml
spring:
  profiles: prod
  datasource:
    url: jdbc:mysql://${MYSQL_HOST}:3306/auction_prod
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}
  redis:
    host: ${REDIS_HOST}
    password: ${REDIS_PASSWORD}

logging:
  level:
    root: WARN
    gateway: INFO
```

### Secrets Management

```bash
# DO: Use environment variables
export JWT_SECRET="your-secret-key-minimum-32-chars"
export MYSQL_PASSWORD="secure-password"

# In application.properties
jwt.secret=${JWT_SECRET}
spring.datasource.password=${MYSQL_PASSWORD}

# DON'T: Hardcode secrets
jwt.secret=hardcoded-secret  # ❌ WRONG

# For production, use Vault or secrets manager
# NOT environment variables for highly sensitive data
```

## Security Boundaries

### Authentication Boundaries

```
Public Endpoints (no auth required):
  ├─ GET /api/guest/products           (browse listings)
  ├─ GET /api/guest/products/{id}      (view details)
  ├─ POST /api/auth/register           (user registration)
  ├─ POST /api/auth/login              (user login)
  └─ POST /api/auth/login-google       (OAuth login)

Protected Endpoints (auth required):
  ├─ GET /api/auth/profile             (own profile)
  ├─ POST /api/auth/profile            (update profile)
  ├─ POST /api/seller/products         (create listing)
  ├─ POST /api/bidder/products/{id}/bid (place bid)
  └─ GET /api/bidder/watchlist         (user's watchlist)

Admin Endpoints (role: ADMIN):
  ├─ GET /api/admin/users              (user management)
  ├─ DELETE /api/admin/products/{id}   (delete listing)
  └─ POST /api/admin/users/{id}/ban    (ban user)
```

### Service-to-Service Authentication

```java
// Services use mutual TLS (mTLS) for authentication
// Each service has certificate:

// gateway-ca.crt
// gateway.crt
// gateway.key

// user-ca.crt
// user.crt
// user.key

// gRPC channel configuration with TLS:
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 9090)
    .useTransportSecurity()
    .sslContext(sslContext)  // Load certificates
    .build();
```

### Data Security

```java
// Sensitive fields should be encrypted at rest
@Entity
public class User {
    
    @Id
    private Long id;
    
    private String email;  // Not sensitive
    
    @Lob
    @Convert(converter = EncryptedAttributeConverter.class)
    private String phoneNumber;  // Encrypted
    
    private String passwordHash;  // Hashed, not encrypted
    
    @Convert(converter = EncryptedAttributeConverter.class)
    private String ssn;  // Encrypted
}

// Password hashing (one-way)
public String hashPassword(String password) {
    return BCrypt.hashpw(password, BCrypt.gensalt());
}

// Verify password
public boolean verifyPassword(String plainPassword, String hash) {
    return BCrypt.checkpw(plainPassword, hash);
}
```

## Deployment Architecture

### Service Deployment Order

```
1. Infrastructure
   ├─ MySQL Database
   ├─ Redis Cache
   ├─ RabbitMQ Message Broker
   └─ Loki (Logging)

2. Core Services (can run in parallel)
   ├─ User Service (9090)
   ├─ Products Service (9091)
   └─ Rating Service (9093)

3. Supporting Services
   ├─ Chat Service (8081)
   └─ Notification Service (9092)

4. Gateway (last)
   └─ API Gateway (8080) - depends on all services
```

### Health Check Strategy

```java
// Each service should provide health endpoints
@RestController
@RequestMapping("/actuator/health")
public class HealthController {
    
    @GetMapping("/liveness")
    public ResponseEntity<?> liveness() {
        // Is service alive? (process running)
        return ResponseEntity.ok("UP");
    }
    
    @GetMapping("/readiness")
    public ResponseEntity<?> readiness() {
        // Is service ready to accept traffic?
        // Check: database connection, external services, cache
        return ResponseEntity.ok("UP");
    }
}

// Kubernetes deployment configuration
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 5
```

---

For implementation details, see [CODE_STANDARDS.md](./CODE_STANDARDS.md) and [LOGGING_GUIDE.md](./LOGGING_GUIDE.md).
