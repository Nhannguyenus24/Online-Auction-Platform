# Code Standards and Best Practices

This document defines technical coding standards and best practices for the Online Auction Platform backend microservices.

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Code Organization](#code-organization)
3. [Error Handling](#error-handling)
4. [Logging Standards](#logging-standards)
5. [Validation Patterns](#validation-patterns)
6. [Response Format Standards](#response-format-standards)
7. [Exception Handling Hierarchy](#exception-handling-hierarchy)
8. [Security Considerations](#security-considerations)
9. [Performance Guidelines](#performance-guidelines)
10. [Testing Patterns](#testing-patterns)

## Naming Conventions

### Classes

| Type | Pattern | Example |
|------|---------|---------|
| Service Classes | `{Domain}Service` | `ProductService`, `UserService` |
| REST Controllers | `{Domain}Controller` | `ProductController`, `AuthController` |
| Repository | `{Domain}Repository` | `ProductRepository` |
| Entity/Model | `{Domain}` or `{Domain}Entity` | `Product`, `User`, `Bid` |
| Exception | `{Domain}Exception` or `{Specific}Exception` | `ProductNotFoundException`, `InvalidBidException` |
| Configuration | `{Domain}Config` | `WebSecurityConfig`, `JwtDecoderConfig` |
| Utility | `{Domain}Utils` or `{Domain}Helper` | `ValidationUtils`, `DateHelper` |
| DTO | `{Domain}{Operation}Request/Response` | `PlaceBidRequest`, `ProductResponse` |

### Methods

```java
// Queries (should not modify state)
public Product getProductById(Long id)
public List<Product> searchProducts(String query)
public boolean isProductActive(Long id)
public Optional<User> findUserByEmail(String email)

// Commands (should modify state)
public void createProduct(ProductRequest request)
public void updateProductStatus(Long id, Status status)
public void deleteBid(Long bidId)

// Boolean methods
public boolean isValidEmail(String email)
public boolean hasActiveAuction(Long productId)
public boolean canUserBid(Long userId, Long productId)

// Special cases
public void initialize()
public void shutdown()
public void process()
```

### Variables

```java
// Local variables - descriptive names
String userEmail = "user@example.com";
int maxRetries = 3;
LocalDateTime bidDeadline = LocalDateTime.now().plusHours(24);

// Loop variables - acceptable use of short names
for (int i = 0; i < items.size(); i++) { }
items.forEach(item -> item.process());

// Stream operations
list.stream()
    .filter(p -> p.getPrice() > 100)
    .map(Product::getName)
    .collect(Collectors.toList());
```

### Constants

```java
// Class-level constants
private static final int MAX_LOGIN_ATTEMPTS = 5;
private static final String JWT_HEADER_PREFIX = "Bearer ";
private static final Duration TOKEN_EXPIRATION = Duration.ofHours(1);
private static final long REQUEST_TIMEOUT_MS = 5000L;

// Configuration constants
public static final String USER_ROLE_ADMIN = "ADMIN";
public static final String USER_ROLE_SELLER = "SELLER";
public static final String USER_ROLE_BIDDER = "BIDDER";
```

## Code Organization

### Package Structure

```
gateway/
├── config/                    # Spring configuration
│   ├── WebSecurityConfig.java
│   ├── JwtDecoderConfig.java
│   └── OpenApiConfig.java
├── controller/               # REST endpoints
│   ├── AuthController.java
│   ├── ProductController.java
│   └── ErrorController.java
├── grpc/                     # gRPC service clients
│   ├── UserGrpcClient.java
│   └── ProductGrpcClient.java
├── service/                  # Business logic
│   ├── GoogleOAuthService.java
│   └── StripeService.java
├── exception/                # Custom exceptions
│   ├── GlobalExceptionHandler.java
│   └── ApiException.java
└── dto/                      # Data transfer objects
    ├── request/
    └── response/
```

### Class Structure Order

```java
public class ProductService {
    // 1. Static constants
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    private static final int MAX_PRODUCTS_PER_PAGE = 50;
    
    // 2. Static fields
    private static int instanceCount = 0;
    
    // 3. Instance fields (declare as private)
    private final ProductRepository productRepository;
    private final ValidationUtils validationUtils;
    private ProductCache cache;
    
    // 4. Constructor(s)
    public ProductService(ProductRepository productRepository, ValidationUtils validationUtils) {
        this.productRepository = productRepository;
        this.validationUtils = validationUtils;
    }
    
    // 5. Public methods (sorted by logical grouping)
    public Product createProduct(CreateProductRequest request) { }
    public Product getProductById(Long id) { }
    public List<Product> searchProducts(SearchCriteria criteria) { }
    
    // 6. Protected/Package-private methods
    protected void updateProductIndex(Long productId) { }
    
    // 7. Private helper methods
    private void validateProductData(Product product) { }
    private void invalidateCache(Long productId) { }
}
```

### File Organization

- One public class per file
- File name matches public class name
- Imports organized by: Java, third-party, local
- Maximum 500 lines of code per class

```java
// File: ProductService.java
package gateway.service;

// Standard library imports
import java.time.*;
import java.util.*;

// Third-party imports
import org.springframework.stereotype.*;
import reactor.core.publisher.Mono;

// Local imports
import gateway.dto.*;
import gateway.exception.*;
import common_libs.validation.*;
```

### Formatting Standards

- **Indentation:** 4 spaces (consistent throughout)
- **Line Length:** Maximum 120 characters
- **Method Length:** Maximum 30-40 lines (for readability)
- **Class Size:** Maximum 500 lines
- **Parameter Count:** Maximum 5 parameters (use builder or DTO if more needed)

```java
// Good: Under 30 lines, clear logic
public ResponseEntity<ProductResponse> getProduct(Long id) {
    log.info("Getting product with id: {}", id);
    
    try {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException("Product not found"));
        
        ProductResponse response = mapToResponse(product);
        log.info("Product retrieved successfully");
        return ResponseEntity.ok(response);
        
    } catch (ProductNotFoundException e) {
        log.error("Product not found: {}", id);
        return ResponseEntity.notFound().build();
    }
}

// Bad: Too many parameters
public void updateProduct(Long id, String name, String description, 
                         Double price, String category, String location,
                         Integer quantity, String imageUrl, Boolean active) {
    // Many parameters makes this hard to call
}

// Better: Use builder or DTO
public void updateProduct(Long id, UpdateProductRequest request) {
    // Cleaner, easier to maintain
}
```

## Error Handling

### Hierarchy of Error Handling

1. **Validate early** - Check input before processing
2. **Throw specific exceptions** - Custom exceptions for known error cases
3. **Handle gracefully** - Catch known exceptions, return appropriate responses
4. **Log appropriately** - Info for expected errors, error for unexpected

```java
// ANTI-PATTERN: Catching generic exceptions
try {
    processProduct(id);
} catch (Exception e) {
    log.error("Error", e);
    return ResponseEntity.status(500).build();
}

// PATTERN: Specific error handling
public ResponseEntity<ApiResponse> processProduct(Long id) {
    try {
        // Validate early
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid product ID"));
        }
        
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(
                String.format("Product with ID %d not found", id)
            ));
        
        // Process product
        return ResponseEntity.ok(ApiResponse.success(product));
        
    } catch (ProductNotFoundException e) {
        log.warn("Product not found: {}", e.getMessage());
        return ResponseEntity.notFound().build();
        
    } catch (ValidationException e) {
        log.warn("Validation error: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(e.getMessage()));
            
    } catch (Exception e) {
        log.error("Unexpected error processing product", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Internal server error"));
    }
}
```

### Exception Best Practices

```java
// DO: Provide meaningful error messages
throw new InvalidBidException(
    String.format("Bid amount %.2f is below minimum bid %.2f", 
        bidAmount, minimumBid)
);

// DON'T: Generic error messages
throw new InvalidBidException("Invalid bid");

// DO: Chain exceptions to preserve stack trace
try {
    database.save(product);
} catch (SQLException e) {
    throw new DataAccessException("Failed to save product", e);
}

// DON'T: Lose original exception
catch (SQLException e) {
    throw new DataAccessException("Failed to save product");
}
```

## Logging Standards

### Log Levels and Usage

| Level | When to Use | Example |
|-------|------------|---------|
| **TRACE** | Detailed diagnostic information (rarely used) | Method entry/exit with parameters |
| **DEBUG** | Development/debugging information | Variable values, intermediate states |
| **INFO** | Normal application flow | Operation completed, configuration loaded |
| **WARN** | Potentially harmful situations | Deprecated API usage, expected errors |
| **ERROR** | Error conditions requiring attention | Database failures, unexpected exceptions |
| **FATAL** | Severe errors causing shutdown | JVM shutdown, critical service failure |

### Structured Logging

Use SLF4J with structured format:

```java
private static final Logger log = LoggerFactory.getLogger(ProductService.class);

// Good: Structured logging with context
log.info("Product created", "productId", id, "userId", userId, "price", price);
log.warn("Low inventory warning", "productId", productId, "quantity", quantity);
log.error("Database connection failed", "attempt", retryCount, "error", e.getMessage());

// Or using MDC for correlation IDs
MDC.put("requestId", uuid);
MDC.put("userId", userId);
log.info("Processing bid request");
MDC.clear();

// Format: key=value pairs for easy parsing
log.info("User login successful", "userId", user.getId(), "email", user.getEmail(), "timestamp", LocalDateTime.now());
```

### Sensitive Data Handling

```java
// DON'T: Log sensitive information
log.info("User login with password: {}", password);
log.debug("Credit card: {}", creditCard);

// DO: Mask or omit sensitive data
log.info("User login for email: {}", maskEmail(email));
log.debug("Payment processing for user: {}", userId);

private static String maskEmail(String email) {
    int atIndex = email.indexOf('@');
    if (atIndex > 1) {
        return email.charAt(0) + "***" + email.substring(atIndex - 1);
    }
    return "***";
}
```

### Logging Patterns

```java
// Public API methods - log input and outcome
@PostMapping("/products")
public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
    log.info("Creating product", "title", request.getTitle(), "userId", getCurrentUserId());
    
    try {
        Product product = productService.create(request);
        log.info("Product created successfully", "productId", product.getId());
        return ResponseEntity.ok(product);
    } catch (ValidationException e) {
        log.warn("Product creation failed - validation error", "error", e.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }
}

// Service methods - log operations and errors
public Product updateProduct(Long id, UpdateProductRequest request) {
    log.debug("Updating product", "productId", id);
    
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    
    // Update fields
    product.setTitle(request.getTitle());
    product.setDescription(request.getDescription());
    
    Product saved = productRepository.save(product);
    log.info("Product updated successfully", "productId", id, "userId", getCurrentUserId());
    
    return saved;
}
```

## Validation Patterns

### Input Validation

```java
// Centralize validation logic
public class ValidationUtils {
    
    public static void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Email is required");
        }
        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ValidationException("Invalid email format");
        }
    }
    
    public static void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters");
        }
        if (!password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$")) {
            throw new ValidationException(
                "Password must contain uppercase, lowercase, digit, and special character"
            );
        }
    }
    
    public static void validateRange(int value, int min, int max, String fieldName) {
        if (value < min || value > max) {
            throw new ValidationException(
                String.format("%s must be between %d and %d", fieldName, min, max)
            );
        }
    }
}

// Use in controllers
@PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    ValidationUtils.validateEmail(request.getEmail());
    ValidationUtils.validatePassword(request.getPassword());
    
    // Process registration
    return ResponseEntity.ok(result);
}
```

### Bean Validation

```java
// Use Jakarta Validation annotations
public class CreateProductRequest {
    
    @NotBlank(message = "Product title is required")
    @Length(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;
    
    @NotBlank(message = "Product description is required")
    @Length(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;
    
    @NotNull(message = "Starting price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal startingPrice;
    
    @Future(message = "Auction end time must be in the future")
    private LocalDateTime endTime;
    
    @NotEmpty(message = "At least one category must be selected")
    private List<String> categories;
    
    // Getters and setters
}

// In controller
@PostMapping("/products")
public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
    // validation is automatic before method is called
    Product product = productService.create(request);
    return ResponseEntity.ok(product);
}
```

## Response Format Standards

### Standard API Response

```java
public class ApiResponse<T> {
    private boolean success;
    private int statusCode;
    private String message;
    private T data;
    private long timestamp;
    
    // Success response
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.statusCode = 200;
        response.message = "Success";
        response.data = data;
        response.timestamp = System.currentTimeMillis();
        return response;
    }
    
    // Error response
    public static <T> ApiResponse<T> error(int statusCode, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.statusCode = statusCode;
        response.message = message;
        response.timestamp = System.currentTimeMillis();
        return response;
    }
}

// Usage
ResponseEntity.ok(ApiResponse.success(productData));
ResponseEntity.badRequest().body(ApiResponse.error(400, "Invalid input"));
ResponseEntity.notFound().build();
```

### Pagination Response

```java
public class PageResponse<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean hasMore;
    
    public PageResponse(List<T> content, int pageNumber, int pageSize, long totalElements) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = (int) Math.ceil((double) totalElements / pageSize);
        this.hasMore = (pageNumber * pageSize) < totalElements;
    }
}

// Controller
@GetMapping("/products")
public ResponseEntity<ApiResponse<PageResponse<ProductDto>>> getProducts(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize) {
    
    Page<Product> products = productService.findAll(page - 1, pageSize);
    PageResponse<ProductDto> pageResponse = new PageResponse<>(
        products.getContent().stream().map(this::mapToDto).collect(Collectors.toList()),
        page,
        pageSize,
        products.getTotalElements()
    );
    
    return ResponseEntity.ok(ApiResponse.success(pageResponse));
}
```

## Exception Handling Hierarchy

### Custom Exception Hierarchy

```java
// Base exception
public abstract class ApplicationException extends RuntimeException {
    private final int statusCode;
    
    public ApplicationException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }
    
    public ApplicationException(int statusCode, String message, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }
    
    public int getStatusCode() {
        return statusCode;
    }
}

// Domain-specific exceptions
public class ValidationException extends ApplicationException {
    public ValidationException(String message) {
        super(400, message);
    }
}

public class ResourceNotFoundException extends ApplicationException {
    public ResourceNotFoundException(String message) {
        super(404, message);
    }
}

public class UnauthorizedException extends ApplicationException {
    public UnauthorizedException(String message) {
        super(401, message);
    }
}

public class ForbiddenException extends ApplicationException {
    public ForbiddenException(String message) {
        super(403, message);
    }
}

public class ConflictException extends ApplicationException {
    public ConflictException(String message) {
        super(409, message);
    }
}

public class InternalServerException extends ApplicationException {
    public InternalServerException(String message, Throwable cause) {
        super(500, message, cause);
    }
}
```

### Global Exception Handler

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ApiResponse<Void>> handleApplicationException(ApplicationException ex) {
        log.warn("Application exception: {} - {}", ex.getStatusCode(), ex.getMessage());
        return ResponseEntity
            .status(ex.getStatusCode())
            .body(ApiResponse.error(ex.getStatusCode(), ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });
        
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "Validation failed", errors));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        log.error("Unexpected exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(500, "Internal server error"));
    }
}
```

## Security Considerations

### Input Validation and Sanitization

```java
// Validate all user input
@PostMapping("/products")
public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
    // Validate required fields
    if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
        throw new ValidationException("Product title is required");
    }
    
    // Sanitize input to prevent XSS
    String cleanTitle = sanitizeHtml(request.getTitle());
    
    // Validate format
    if (cleanTitle.length() > 200) {
        throw new ValidationException("Title exceeds maximum length");
    }
    
    // Process
}

private static String sanitizeHtml(String input) {
    // Remove/escape HTML tags
    return input.replaceAll("<[^>]*>", "").trim();
}
```

### Authentication and Authorization

```java
// Always check authentication for protected endpoints
@GetMapping("/products/{id}/edit")
public ResponseEntity<?> editProduct(@PathVariable Long id) {
    // Get current user from security context
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String currentUserId = auth.getName();
    
    Product product = productService.getById(id);
    
    // Check authorization - user must be owner or admin
    if (!product.getUserId().equals(currentUserId) && 
        !hasRole(auth, "ADMIN")) {
        throw new ForbiddenException("You don't have permission to edit this product");
    }
    
    return ResponseEntity.ok(product);
}

private boolean hasRole(Authentication auth, String role) {
    return auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
}
```

### Secure Sensitive Data

```java
// Don't expose sensitive information in responses
public class UserDto {
    private String id;
    private String email;
    private String fullName;
    // password, ssn, credit card NOT included
    
    // Getters (no setters for sensitive fields)
}

// Hash passwords before storage
public void createUser(CreateUserRequest request) {
    String hashedPassword = passwordEncoder.encode(request.getPassword());
    User user = new User(request.getEmail(), hashedPassword);
    userRepository.save(user);
}

// Use HTTPS/TLS for all communications
// Set secure cookie flags
cookie.setHttpOnly(true);  // Prevent JavaScript access
cookie.setSecure(true);    // Only send over HTTPS
cookie.setSameSite("Strict");  // CSRF protection
```

## Performance Guidelines

### Database Best Practices

```java
// DO: Use pagination
public Page<Product> searchProducts(String query, Pageable pageable) {
    return productRepository.findByTitleContainingIgnoreCase(query, pageable);
}

// DON'T: Fetch all records
public List<Product> getAllProducts() {
    return productRepository.findAll();  // BAD if table has millions of rows
}

// DO: Use proper indexes on frequently queried fields
// In database schema or via @Index annotation
@Table(name = "products", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class Product {
    // fields
}

// DO: Cache frequently accessed data
@Cacheable("products")
public Product getProductById(Long id) {
    return productRepository.findById(id).orElse(null);
}

// DO: Use batch operations for bulk updates
public void updateProductStatuses(List<Long> ids, String status) {
    productRepository.updateStatusByIds(ids, status);  // Single query
}

// DON'T: N+1 queries
for (Long productId : productIds) {
    Product product = getProductById(productId);  // Multiple queries!
}

// DO: Eager load or batch fetch related data
public List<Product> getProductsWithBids(List<Long> ids) {
    return productRepository.findByIdInWithBids(ids);  // Single query with join
}
```

### Code Efficiency

```java
// Use appropriate data structures
// Use HashSet for lookups (O(1) instead of List O(n))
Set<Long> validProductIds = new HashSet<>(allowedProducts);
if (validProductIds.contains(productId)) { }

// Avoid unnecessary object creation
// Use StringBuilder for string concatenation in loops
StringBuilder sb = new StringBuilder();
for (String item : items) {
    sb.append(item).append(",");  // Good
}

// Not this:
String result = "";
for (String item : items) {
    result += item + ",";  // Bad - creates new string each iteration
}

// Use streams wisely
// Parallel streams for CPU-intensive operations on large collections
List<Product> results = products.parallelStream()
    .filter(this::isExpensive)
    .map(this::calculateValue)
    .collect(Collectors.toList());

// Sequential for I/O operations
List<Product> filtered = products.stream()
    .filter(p -> p.getPrice() > 100)
    .collect(Collectors.toList());
```

### Connection Pooling

```yaml
# application.properties - Optimize connection pool
spring:
  datasource:
    hikari:
      maximum-pool-size: 20  # Max connections
      minimum-idle: 5        # Min idle connections
      connection-timeout: 20000  # 20 seconds
      idle-timeout: 300000   # 5 minutes
      max-lifetime: 1200000  # 20 minutes
```

## Testing Patterns

### Unit Test Structure

```java
public class ProductServiceTest {
    
    private ProductService productService;
    
    @Mock
    private ProductRepository productRepository;
    
    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        productService = new ProductService(productRepository);
    }
    
    // Test: [method]_[condition]_[expected result]
    @Test
    public void testGetProductById_WithValidId_ReturnsProduct() {
        // Arrange
        Long productId = 1L;
        Product expectedProduct = new Product();
        expectedProduct.setId(productId);
        expectedProduct.setTitle("Test Product");
        
        when(productRepository.findById(productId))
            .thenReturn(Optional.of(expectedProduct));
        
        // Act
        Product result = productService.getProductById(productId);
        
        // Assert
        assertNotNull(result);
        assertEquals(productId, result.getId());
        assertEquals("Test Product", result.getTitle());
        verify(productRepository, times(1)).findById(productId);
    }
}
```

### Integration Test Structure

```java
@SpringBootTest
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private UserGrpcClient userGrpcClient;
    
    @Test
    public void testLoginEndpoint_WithValidCredentials_ReturnsAccessToken() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        
        // Mock gRPC response
        LoginResponse grpcResponse = LoginResponse.newBuilder()
            .setSuccess(true)
            .setAccessToken("jwt-token-here")
            .build();
        
        when(userGrpcClient.login(any())).thenReturn(Mono.just(grpcResponse));
        
        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.accessToken").exists());
    }
}
```

### Test Coverage Requirements

- **Unit Tests:** >80% line coverage
- **Critical Paths:** 100% coverage required
- **Integration Tests:** For all API endpoints
- **Edge Cases:** Always include

---

For more information, see [ARCHITECTURE.md](./ARCHITECTURE.md), [API_GUIDELINES.md](./API_GUIDELINES.md), and [LOGGING_GUIDE.md](./LOGGING_GUIDE.md).
