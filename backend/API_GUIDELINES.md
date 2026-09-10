# REST API and gRPC Guidelines

Comprehensive guidelines for designing and implementing REST APIs and gRPC services in the Online Auction Platform.

## Table of Contents

1. [REST API Design Principles](#rest-api-design-principles)
2. [HTTP Status Codes](#http-status-codes)
3. [Error Response Format](#error-response-format)
4. [Request/Response Patterns](#requestresponse-patterns)
5. [Validation Error Format](#validation-error-format)
6. [gRPC Guidelines](#grpc-guidelines)
7. [gRPC Status Code Mapping](#grpc-status-code-mapping)
8. [Rate Limiting Behavior](#rate-limiting-behavior)
9. [Pagination Standards](#pagination-standards)
10. [Versioning Strategy](#versioning-strategy)
11. [API Documentation](#api-documentation)

## REST API Design Principles

### RESTful URL Design

**Use nouns for resources, not verbs:**

```
Good:
GET    /api/products              # List all products
POST   /api/products              # Create a product
GET    /api/products/{id}         # Get specific product
PUT    /api/products/{id}         # Update product
DELETE /api/products/{id}         # Delete product
GET    /api/products/{id}/bids    # Get bids for product

Bad:
GET    /api/getProducts           # Don't use verbs
POST   /api/createProduct         # Use resource names
GET    /api/deleteProduct/{id}    # HTTP method indicates action
```

**Use consistent URL structure:**

```
/api/{version}/{domain}/{resource}[/{id}][/{sub-resource}]

Examples:
/api/v1/products               # Collection
/api/v1/products/123           # Single resource
/api/v1/products/123/bids      # Sub-resource
/api/v1/products/123/ratings   # Another sub-resource
```

**Prefer plural nouns for collections:**

```
GET /api/products      # Good - collection
GET /api/product       # Bad - singular

POST /api/products     # Good - add to collection
POST /api/product      # Bad - singular
```

### HTTP Methods

| Method | Purpose | Safe | Idempotent | Request Body |
|--------|---------|------|-----------|--------------|
| **GET** | Retrieve resource | Yes | Yes | No |
| **POST** | Create new resource | No | No | Yes |
| **PUT** | Replace entire resource | No | Yes | Yes |
| **PATCH** | Partial update | No | No | Yes |
| **DELETE** | Delete resource | No | Yes | No |

**Usage Examples:**

```java
// GET - Retrieve (safe, idempotent)
@GetMapping("/products/{id}")
public ResponseEntity<Product> getProduct(@PathVariable Long id) {
    return ResponseEntity.ok(productService.getById(id));
}

// POST - Create new (not safe, not idempotent)
@PostMapping("/products")
public ResponseEntity<Product> createProduct(@RequestBody CreateProductRequest request) {
    Product product = productService.create(request);
    return ResponseEntity.created(URI.create("/api/products/" + product.getId()))
        .body(product);
}

// PUT - Replace entire resource (idempotent)
@PutMapping("/products/{id}")
public ResponseEntity<Product> updateProduct(
        @PathVariable Long id,
        @RequestBody UpdateProductRequest request) {
    Product product = productService.update(id, request);
    return ResponseEntity.ok(product);
}

// PATCH - Partial update (not idempotent due to conditional logic)
@PatchMapping("/products/{id}")
public ResponseEntity<Product> partialUpdate(
        @PathVariable Long id,
        @RequestBody Map<String, Object> updates) {
    Product product = productService.partialUpdate(id, updates);
    return ResponseEntity.ok(product);
}

// DELETE - Remove resource (idempotent)
@DeleteMapping("/products/{id}")
public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    productService.delete(id);
    return ResponseEntity.noContent().build();
}
```

## HTTP Status Codes

### Success Status Codes

| Code | Status | Usage |
|------|--------|-------|
| **200** | OK | Request succeeded, returning data |
| **201** | Created | Resource created successfully |
| **204** | No Content | Request succeeded, no content to return |
| **206** | Partial Content | Range request succeeded |

**Examples:**

```java
// 200 OK - Return data
@GetMapping("/{id}")
public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
    return ResponseEntity.ok(productService.getById(id));
}

// 201 Created - New resource
@PostMapping
public ResponseEntity<ProductResponse> createProduct(@RequestBody CreateProductRequest request) {
    Product product = productService.create(request);
    return ResponseEntity
        .created(URI.create("/api/products/" + product.getId()))
        .body(ProductResponse.from(product));
}

// 204 No Content - Successful deletion
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    productService.delete(id);
    return ResponseEntity.noContent().build();
}
```

### Client Error Status Codes

| Code | Status | When to Use |
|------|--------|------------|
| **400** | Bad Request | Invalid input, malformed request |
| **401** | Unauthorized | Missing/invalid authentication |
| **403** | Forbidden | Authenticated but no permission |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource conflict (duplicate, version mismatch) |
| **422** | Unprocessable Entity | Validation failed on field level |
| **429** | Too Many Requests | Rate limit exceeded |

**Examples:**

```java
// 400 Bad Request
@PostMapping
public ResponseEntity<?> createProduct(@RequestBody CreateProductRequest request) {
    if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
        throw new ValidationException("Title is required");  // → 400
    }
    // ...
}

// 401 Unauthorized
@GetMapping("/protected")
public ResponseEntity<?> getProtectedResource() {
    if (!isAuthenticated()) {
        throw new UnauthorizedException("Token required");  // → 401
    }
    // ...
}

// 403 Forbidden
@PostMapping("/{id}/edit")
public ResponseEntity<?> editProduct(@PathVariable Long id) {
    Product product = productService.getById(id);
    if (!isOwner(product)) {
        throw new ForbiddenException("You cannot edit this product");  // → 403
    }
    // ...
}

// 404 Not Found
@GetMapping("/{id}")
public ResponseEntity<?> getProduct(@PathVariable Long id) {
    return productService.getById(id)
        .map(ResponseEntity::ok)
        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));  // → 404
}

// 409 Conflict
@PostMapping
public ResponseEntity<?> createProduct(@RequestBody CreateProductRequest request) {
    if (productService.exists(request.getTitle())) {
        throw new ConflictException("Product with this title already exists");  // → 409
    }
    // ...
}

// 429 Too Many Requests
// Handled by rate limiting interceptor
```

### Server Error Status Codes

| Code | Status | When to Use |
|------|--------|------------|
| **500** | Internal Server Error | Unexpected server error |
| **502** | Bad Gateway | Upstream service unavailable |
| **503** | Service Unavailable | Server temporarily unavailable |
| **504** | Gateway Timeout | Upstream service timeout |

**Pattern:**

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<?> handleUnexpectedException(Exception ex) {
    log.error("Unexpected error", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, "An unexpected error occurred"));
}
```

## Error Response Format

### Standard Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": 1694000000000,
  "path": "/api/products",
  "data": null
}
```

### Error Response with Details

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation errors",
  "errors": {
    "title": "Title is required",
    "price": "Price must be greater than 0",
    "endTime": "End time must be in the future"
  },
  "timestamp": 1694000000000,
  "path": "/api/products"
}
```

### Implementation

```java
public class ApiResponse<T> {
    private boolean success;
    private int statusCode;
    private String message;
    private String error;
    private T data;
    private Map<String, String> errors;
    private long timestamp;
    private String path;
    
    // Success responses
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.statusCode = 200;
        response.message = "Success";
        response.data = data;
        response.timestamp = System.currentTimeMillis();
        return response;
    }
    
    // Error responses
    public static ApiResponse<?> error(int statusCode, String message) {
        ApiResponse<?> response = new ApiResponse<>();
        response.success = false;
        response.statusCode = statusCode;
        response.message = message;
        response.timestamp = System.currentTimeMillis();
        return response;
    }
    
    public static ApiResponse<?> validationError(Map<String, String> errors) {
        ApiResponse<?> response = new ApiResponse<>();
        response.success = false;
        response.statusCode = 422;
        response.message = "Validation errors";
        response.errors = errors;
        response.timestamp = System.currentTimeMillis();
        return response;
    }
}

// Usage in GlobalExceptionHandler
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach(error -> {
        String fieldName = ((FieldError) error).getField();
        String errorMessage = error.getDefaultMessage();
        errors.put(fieldName, errorMessage);
    });
    
    return ResponseEntity.badRequest()
        .body(ApiResponse.validationError(errors));
}
```

## Request/Response Patterns

### Request DTO Pattern

```java
// Request - use separate DTO for each operation
@Data
public class CreateProductRequest {
    @NotBlank
    private String title;
    
    @NotBlank
    private String description;
    
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal startingPrice;
    
    @Future
    private LocalDateTime endTime;
    
    @NotEmpty
    private List<String> categories;
}

// Create endpoint
@PostMapping
public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
    Product product = productService.create(request);
    return ResponseEntity.created(...)
        .body(ApiResponse.success(ProductResponse.from(product)));
}
```

### Response DTO Pattern

```java
// Response - expose only necessary fields
@Data
public class ProductResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal currentPrice;
    private String status;
    private LocalDateTime createdAt;
    private UserSummary seller;  // Nested DTO
    private List<BidSummary> recentBids;
    
    // Map from entity
    public static ProductResponse from(Product product) {
        ProductResponse response = new ProductResponse();
        response.id = product.getId();
        response.title = product.getTitle();
        response.description = product.getDescription();
        response.currentPrice = product.getCurrentPrice();
        response.status = product.getStatus().toString();
        response.createdAt = product.getCreatedAt();
        response.seller = UserSummary.from(product.getUser());
        response.recentBids = product.getBids().stream()
            .sorted((b1, b2) -> b2.getBidTime().compareTo(b1.getBidTime()))
            .limit(5)
            .map(BidSummary::from)
            .collect(Collectors.toList());
        return response;
    }
}

// Nested DTOs for relationships
@Data
public class UserSummary {
    private Long id;
    private String fullName;
    private Integer positiveReviews;
    
    public static UserSummary from(User user) {
        UserSummary summary = new UserSummary();
        summary.id = user.getId();
        summary.fullName = user.getFullName();
        summary.positiveReviews = user.getPositiveReviewCount();
        return summary;
    }
}
```

### Pagination Response

```java
@Data
public class PageResponse<T> {
    private List<T> content;
    private PaginationMetadata pagination;
    
    @Data
    public static class PaginationMetadata {
        private int currentPage;
        private int pageSize;
        private long totalElements;
        private int totalPages;
        private boolean hasMore;
    }
}

// Usage
@GetMapping
public ResponseEntity<?> listProducts(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize) {
    
    Page<Product> pageData = productService.findAll(
        PageRequest.of(page - 1, pageSize));
    
    PageResponse<ProductResponse> response = new PageResponse<>();
    response.setContent(pageData.getContent().stream()
        .map(ProductResponse::from)
        .collect(Collectors.toList()));
    
    PageResponse.PaginationMetadata metadata = new PageResponse.PaginationMetadata();
    metadata.setCurrentPage(page);
    metadata.setPageSize(pageSize);
    metadata.setTotalElements(pageData.getTotalElements());
    metadata.setTotalPages(pageData.getTotalPages());
    metadata.setHasMore((page * pageSize) < pageData.getTotalElements());
    response.setPagination(metadata);
    
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

## Validation Error Format

### Single Field Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format"
  }
}
```

### Multiple Field Errors

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation errors",
  "errors": {
    "title": "Title is required",
    "price": "Price must be greater than 0",
    "endTime": "End time must be in the future",
    "categories": "At least one category must be selected"
  }
}
```

### Implementation

```java
@ControllerAdvice
public class ValidationExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });
        
        ApiResponse<?> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setStatusCode(422);
        response.setMessage("Validation errors");
        response.setErrors(errors);
        response.setTimestamp(System.currentTimeMillis());
        
        return ResponseEntity.status(422).body(response);
    }
}
```

## gRPC Guidelines

### Service Definition

```proto
syntax = "proto3";

package auction.products;

option java_package = "com.auction.proto.products";
option java_multiple_files = true;

// Service definition
service ProductService {
    rpc GetProduct(GetProductRequest) returns (GetProductResponse);
    rpc CreateProduct(CreateProductRequest) returns (CreateProductResponse);
    rpc ListProducts(ListProductsRequest) returns (ListProductsResponse);
    rpc PlaceBid(PlaceBidRequest) returns (PlaceBidResponse);
}

// Request messages
message GetProductRequest {
    int64 product_id = 1;
}

message CreateProductRequest {
    string title = 1;
    string description = 2;
    decimal starting_price = 3;
    google.protobuf.Timestamp end_time = 4;
    repeated string categories = 5;
}

// Response messages
message ProductData {
    int64 id = 1;
    string title = 2;
    string description = 3;
    decimal current_price = 4;
    string status = 5;
    google.protobuf.Timestamp created_at = 6;
    UserData seller = 7;
}

message GetProductResponse {
    bool success = 1;
    string message = 2;
    ProductData product = 3;
}

message CreateProductResponse {
    bool success = 1;
    string message = 2;
    int64 product_id = 3;
}
```

### Service Implementation

```java
@Service
public class ProductGrpcService extends ProductServiceGrpc.ProductServiceImplBase {
    
    private final ProductService productService;
    
    @Override
    public void getProduct(GetProductRequest request,
                          StreamObserver<GetProductResponse> responseObserver) {
        try {
            log.info("Getting product: {}", request.getProductId());
            
            // Call business service
            Product product = productService.getById(request.getProductId());
            
            // Build response
            GetProductResponse response = GetProductResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Product retrieved successfully")
                .setProduct(mapToProto(product))
                .build();
            
            responseObserver.onNext(response);
            responseObserver.onCompleted();
            
        } catch (ResourceNotFoundException e) {
            log.warn("Product not found: {}", e.getMessage());
            responseObserver.onError(
                Status.NOT_FOUND.withDescription(e.getMessage()).asException()
            );
        } catch (Exception e) {
            log.error("Error getting product", e);
            responseObserver.onError(
                Status.INTERNAL.withDescription("Internal error").asException()
            );
        }
    }
}
```

### Client Usage

```java
@Service
public class ProductGrpcClient {
    
    private final ManagedChannel channel;
    private final ProductServiceGrpc.ProductServiceStub stub;
    
    public ProductGrpcClient(@Value("${grpc.product.host}") String host,
                            @Value("${grpc.product.port}") int port) {
        this.channel = ManagedChannelBuilder
            .forAddress(host, port)
            .usePlaintext()
            .build();
        this.stub = ProductServiceGrpc.newStub(channel);
    }
    
    // Async call pattern
    public Mono<ProductData> getProduct(Long productId) {
        return Mono.create(sink -> {
            GetProductRequest request = GetProductRequest.newBuilder()
                .setProductId(productId)
                .build();
            
            stub.getProduct(request, new StreamObserver<GetProductResponse>() {
                @Override
                public void onNext(GetProductResponse response) {
                    if (response.getSuccess()) {
                        sink.success(response.getProduct());
                    } else {
                        sink.error(new Exception(response.getMessage()));
                    }
                }
                
                @Override
                public void onError(Throwable t) {
                    sink.error(t);
                }
                
                @Override
                public void onCompleted() {}
            });
        });
    }
}
```

## gRPC Status Code Mapping

### Status Code Mapping to HTTP

| gRPC Status | HTTP Code | Use Case |
|-------------|-----------|----------|
| **OK** (0) | 200 | Success |
| **CANCELLED** (1) | 499 | Request cancelled by client |
| **UNKNOWN** (2) | 500 | Unknown server error |
| **INVALID_ARGUMENT** (3) | 400 | Invalid input parameters |
| **DEADLINE_EXCEEDED** (4) | 504 | Request timeout |
| **NOT_FOUND** (5) | 404 | Resource not found |
| **ALREADY_EXISTS** (6) | 409 | Resource already exists |
| **PERMISSION_DENIED** (7) | 403 | Unauthorized access |
| **RESOURCE_EXHAUSTED** (8) | 429 | Rate limit exceeded |
| **FAILED_PRECONDITION** (9) | 400 | Precondition failed |
| **ABORTED** (10) | 409 | Request aborted |
| **OUT_OF_RANGE** (11) | 400 | Out of range |
| **UNIMPLEMENTED** (12) | 501 | Not implemented |
| **INTERNAL** (13) | 500 | Internal error |
| **UNAVAILABLE** (14) | 503 | Service unavailable |
| **DATA_LOSS** (15) | 500 | Data loss error |
| **UNAUTHENTICATED** (16) | 401 | Not authenticated |

### Implementation

```java
// Convert gRPC status to HTTP response
public ResponseEntity<?> handleGrpcError(StatusRuntimeException ex) {
    Status status = ex.getStatus();
    
    return switch (status.getCode()) {
        case NOT_FOUND -> ResponseEntity.notFound().build();
        case INVALID_ARGUMENT -> ResponseEntity.badRequest()
            .body(ApiResponse.error(400, status.getDescription()));
        case PERMISSION_DENIED -> ResponseEntity.status(403)
            .body(ApiResponse.error(403, "Access denied"));
        case UNAUTHENTICATED -> ResponseEntity.status(401)
            .body(ApiResponse.error(401, "Authentication required"));
        case RESOURCE_EXHAUSTED -> ResponseEntity.status(429)
            .body(ApiResponse.error(429, "Rate limit exceeded"));
        case UNAVAILABLE -> ResponseEntity.status(503)
            .body(ApiResponse.error(503, "Service unavailable"));
        default -> ResponseEntity.status(500)
            .body(ApiResponse.error(500, "Internal server error"));
    };
}
```

## Rate Limiting Behavior

### Configuration

```yaml
# application.yml
rate-limit:
  enabled: true
  global:
    requests: 1000
    period: 60  # seconds
  per-user:
    requests: 100
    period: 60
  endpoints:
    /api/auth/register:
      requests: 5
      period: 3600  # 5 per hour
    /api/bidder/products/*/bid:
      requests: 50
      period: 60
```

### Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1694086400
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

### Implementation

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private final Bucket4j bucket4j;
    
    @Override
    public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response,
                            Object handler) throws Exception {
        
        String clientKey = getClientKey(request);  // IP or user ID
        Bucket bucket = bucket4j.resolveBucket(clientKey);
        
        if (!bucket.tryConsume(1)) {
            long waitFor = bucket.estimateAbilityToConsume(1).getRoundedSecondsToWait();
            
            response.setStatus(429);
            response.setContentType("application/json");
            response.addHeader("X-RateLimit-Retry-After-Seconds", String.valueOf(waitFor));
            response.getWriter().write(objectMapper.writeValueAsString(
                new RateLimitExceeded(waitFor)
            ));
            
            return false;
        }
        
        response.addHeader("X-RateLimit-Remaining",
            String.valueOf(bucket.getAvailableTokens()));
        
        return true;
    }
}
```

## Pagination Standards

### Query Parameters

```
GET /api/products?page=1&pageSize=20&sort=createdAt,desc&search=laptop
```

### Pagination Rules

- **page:** 1-based (starts at 1, not 0)
- **pageSize:** Default 20, max 100
- **sort:** Format `field,direction` (direction: asc/desc)
- **search:** Free text search

### Pagination Response

```json
{
  "success": true,
  "data": {
    "content": [
      { "id": 1, "title": "Product 1" },
      { "id": 2, "title": "Product 2" }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalElements": 150,
      "totalPages": 8,
      "hasMore": true,
      "links": {
        "first": "/api/products?page=1&pageSize=20",
        "last": "/api/products?page=8&pageSize=20",
        "next": "/api/products?page=2&pageSize=20",
        "prev": null
      }
    }
  }
}
```

### Implementation

```java
@GetMapping
public ResponseEntity<?> listProducts(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize,
        @RequestParam(defaultValue = "createdAt,desc") String sort,
        @RequestParam(required = false) String search) {
    
    // Validate pagination
    if (page < 1 || pageSize < 1 || pageSize > 100) {
        throw new ValidationException("Invalid page or pageSize");
    }
    
    // Parse sort
    String[] sortParts = sort.split(",");
    Sort.Direction direction = Sort.Direction.fromString(sortParts[1]);
    Sort sortObj = Sort.by(direction, sortParts[0]);
    
    // Execute query
    Pageable pageable = PageRequest.of(page - 1, pageSize, sortObj);
    Page<Product> pageData = search != null && !search.isEmpty()
        ? productService.search(search, pageable)
        : productService.findAll(pageable);
    
    // Build response
    return ResponseEntity.ok(
        ApiResponse.success(buildPageResponse(pageData, page))
    );
}
```

## Versioning Strategy

### URL Versioning

```
/api/v1/products      # Version 1
/api/v2/products      # Version 2
```

**Advantages:**
- Clear and explicit
- Easy to support multiple versions

**Disadvantages:**
- URL bloat
- Requires maintaining multiple endpoints

### Header Versioning

```http
GET /api/products HTTP/1.1
Accept: application/vnd.auction.v1+json
```

**Advantages:**
- Cleaner URLs
- More RESTful

**Disadvantages:**
- Less visible
- Requires client awareness

### Strategy

**Use URL versioning** for breaking changes:

```java
// Version 1 (stable)
@RestController
@RequestMapping("/api/v1/products")
public class ProductControllerV1 { }

// Version 2 (new version)
@RestController
@RequestMapping("/api/v2/products")
public class ProductControllerV2 { }

// Deprecated endpoint
@Deprecated
@RestController
@RequestMapping("/api/v1/products")
public class ProductControllerV1 {
    @Deprecated(since = "2.0", forRemoval = true)
    @GetMapping
    public ResponseEntity<?> listProducts() { }
}
```

## API Documentation

### Swagger/OpenAPI Annotations

```java
@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Product auction operations")
public class ProductController {
    
    @PostMapping
    @Operation(
        summary = "Create new auction listing",
        description = "Create a new product auction listing. Only authenticated sellers can create listings."
    )
    @ApiResponse(
        responseCode = "201",
        description = "Product created successfully",
        content = @Content(schema = @Schema(implementation = ProductResponse.class))
    )
    @ApiResponse(
        responseCode = "400",
        description = "Invalid product data",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class))
    )
    @ApiResponse(
        responseCode = "401",
        description = "Unauthorized - token required"
    )
    public ResponseEntity<?> createProduct(
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Product details",
                required = true,
                content = @Content(schema = @Schema(implementation = CreateProductRequest.class))
            )
            CreateProductRequest request) {
        // implementation
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get product details")
    @Parameter(name = "id", description = "Product ID", example = "123")
    @ApiResponse(
        responseCode = "200",
        description = "Product found",
        content = @Content(schema = @Schema(implementation = ProductResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Product not found")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        // implementation
    }
}
```

### DTO Documentation

```java
@Data
@Schema(description = "Request to create new product listing")
public class CreateProductRequest {
    
    @NotBlank
    @Schema(description = "Product title", example = "Vintage Bicycle", minLength = 5, maxLength = 200)
    private String title;
    
    @NotBlank
    @Schema(description = "Detailed product description", minLength = 10, maxLength = 2000)
    private String description;
    
    @NotNull
    @DecimalMin("0.01")
    @Schema(description = "Starting price in USD", example = "50.00")
    private BigDecimal startingPrice;
    
    @Future
    @Schema(description = "When the auction ends", example = "2024-01-01T00:00:00Z")
    private LocalDateTime endTime;
    
    @NotEmpty
    @Schema(description = "Product categories", example = "[\"Electronics\", \"Vintage\"]")
    private List<String> categories;
}
```

---

For implementation guidance, see [CODE_STANDARDS.md](./CODE_STANDARDS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
