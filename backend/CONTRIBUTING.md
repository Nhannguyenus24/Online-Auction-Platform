# Contributing Guidelines

Welcome to the Online Auction Platform backend! This document provides guidelines for contributing high-quality code to our enterprise microservices architecture.

## Table of Contents

1. [Code Style and Conventions](#code-style-and-conventions)
2. [Git Workflow](#git-workflow)
3. [Commit Message Format](#commit-message-format)
4. [Pull Request Process](#pull-request-process)
5. [Code Review Checklist](#code-review-checklist)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Requirements](#documentation-requirements)
8. [Signing Commits](#signing-commits)

## Code Style and Conventions

### Java Naming Conventions

**Classes and Interfaces:**
- Use PascalCase
- Use descriptive names that reflect purpose
- Suffix with appropriate type: `Service`, `Controller`, `Repository`, `Config`, `Exception`

```java
// Good
public class ProductService { }
public class AuthController { }
public class ValidationException extends RuntimeException { }

// Bad
public class productService { }
public class PC { }
```

**Methods:**
- Use camelCase
- Use verbs for action methods
- Use `get`/`set` prefixes for accessors
- Use `is`/`has` prefixes for boolean methods

```java
// Good
public Product getProductById(Long id) { }
public void setProductName(String name) { }
public boolean isValidEmail(String email) { }

// Bad
public Product product_ById(Long id) { }
public void updateProductName(String name) { } // for simple getter/setter
```

**Variables and Parameters:**
- Use camelCase
- Use meaningful, descriptive names
- Avoid single-letter names except in loops and lambdas

```java
// Good
private String userEmail;
private int maxRetries = 3;

// Bad
private String ue;
private int m = 3;
```

**Constants:**
- Use UPPER_SNAKE_CASE
- Must be `final static`

```java
// Good
private static final int MAX_LOGIN_ATTEMPTS = 5;
private static final String JWT_HEADER_PREFIX = "Bearer ";

// Bad
private static final int max_attempts = 5;
private static final String jwtPrefix = "Bearer ";
```

### Code Organization

**Package Structure:**
- Organize by feature, not by layer
- Each service is a bounded context
- Maximum 500 lines of code per class

```
gateway/
├── config/              # Configuration classes
├── controller/          # REST endpoints
├── grpc/               # gRPC clients
├── service/            # Business logic
├── exception/          # Custom exceptions
└── dto/               # Data transfer objects
```

**Import Organization:**
- Group imports logically
- Java standard library first
- Third-party libraries
- Local application imports

```java
import java.time.*;
import java.util.*;

import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;

import gateway.service.*;
import com.auction.dto.*;
```

**Class Member Order:**
1. Static fields (constants first, then variables)
2. Instance fields
3. Constructors
4. Public methods
5. Protected methods
6. Private methods

### Formatting Standards

- **Indentation:** 4 spaces (no tabs)
- **Line Length:** Maximum 120 characters
- **Braces:** Always use braces, even for single-line blocks
- **Spacing:** One blank line between methods

```java
// Good
if (isValid) {
    doSomething();
}

// Bad
if (isValid) doSomething();
```

## Git Workflow

### Branch Naming

Use feature branches with descriptive names following this pattern:

```
feature/feature-name          # New feature
bugfix/bug-description        # Bug fix
hotfix/critical-issue         # Critical production fix
refactor/area-of-improvement  # Code refactoring
test/test-description         # Testing improvements
docs/documentation-topic      # Documentation updates
```

**Examples:**
```
feature/add-product-filtering
bugfix/fix-jwt-expiration-check
hotfix/database-connection-leak
refactor/simplify-validation-logic
```

### Branch Management

```bash
# Create and switch to feature branch
git checkout -b feature/new-feature

# Keep branch updated with main
git fetch origin
git rebase origin/main

# Delete local branch after merge
git branch -d feature/new-feature

# Delete remote branch after merge
git push origin --delete feature/new-feature
```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of:
- **feat:** A new feature
- **fix:** A bug fix
- **docs:** Documentation only changes
- **style:** Changes that don't affect code meaning (formatting, missing semi-colons, etc.)
- **refactor:** Code change that neither fixes a bug nor adds a feature
- **perf:** Code change that improves performance
- **test:** Adding missing tests or correcting existing tests
- **chore:** Changes to build process, dependencies, or tooling

### Scope

The scope should specify what area/service/component is affected:
- `auth` - Authentication/Authorization
- `product` - Product service
- `user` - User service
- `notification` - Notification service
- `chat` - Chat service
- `gateway` - API Gateway
- `common` - Common utilities

### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters
- Be specific and clear

### Body

- Wrap at 72 characters
- Explain *what* and *why*, not *how*
- Include relevant issue numbers

### Footer

Include issue references if applicable:

```
Fixes #123
Closes #456
References #789
```

### Examples

**Good commit messages:**

```
feat(auth): add JWT token refresh endpoint

Implement refresh token functionality to extend user sessions
without requiring re-authentication. Uses httpOnly cookies for
secure token storage.

Fixes #145

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

```
fix(product): prevent duplicate product listings

Add unique constraint check before creating new product listing
to prevent database constraint violations and improve error
handling for duplicate submissions.

References #156

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

```
refactor(validation): extract email validation to utility

Move email validation logic from AuthController to shared
ValidationUtils for reuse across services and improved
maintainability.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## Pull Request Process

### Before Creating PR

1. **Ensure branch is up-to-date:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run tests locally:**
   ```bash
   mvn clean test
   ```

3. **Verify code compiles:**
   ```bash
   mvn clean compile
   ```

4. **Check for code style issues:**
   - Follow CODE_STANDARDS.md

### PR Title and Description

**Title format:** `[TYPE] Brief description`

**Description template:**

```markdown
## Summary
Brief description of changes.

## Related Issue
Closes #123

## Changes Made
- Bullet point of changes
- Another change
- And another

## Testing Done
- How was this tested?
- What test cases were covered?
- Any edge cases considered?

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Commit messages are clear
```

### Review Process

1. **Request review** from at least 2 team members
2. **Address feedback** with new commits (don't amend during review)
3. **Re-request review** after addressing comments
4. **Squash commits** before merge if requested
5. **Delete branch** after merge

### Merge Requirements

- [ ] At least 2 approvals from code reviewers
- [ ] All CI/CD checks passing
- [ ] No merge conflicts
- [ ] All conversations resolved
- [ ] Tests demonstrate the changes work

## Code Review Checklist

### Functionality
- [ ] Code implements the intended feature correctly
- [ ] Edge cases are handled
- [ ] Error cases are properly handled
- [ ] No obvious bugs or logical errors
- [ ] Thread safety considered (if applicable)

### Code Quality
- [ ] Follows CODE_STANDARDS.md conventions
- [ ] No code duplication
- [ ] Methods are single-responsibility
- [ ] Class size is reasonable (<500 LOC)
- [ ] No hardcoded values (use constants)

### Security
- [ ] Input validation is present
- [ ] No SQL injection vulnerabilities
- [ ] No sensitive data in logs
- [ ] Authentication/authorization checks present
- [ ] CORS properly configured

### Testing
- [ ] Unit tests written for new code
- [ ] Test coverage is adequate (>80%)
- [ ] Tests are meaningful and not just for coverage
- [ ] Integration tests for cross-service calls
- [ ] Edge cases have corresponding tests

### Performance
- [ ] No unnecessary database queries (N+1 queries)
- [ ] Proper use of caching where applicable
- [ ] No memory leaks or resource leaks
- [ ] Reasonable algorithm complexity

### Documentation
- [ ] JavaDoc for public methods
- [ ] Inline comments for complex logic
- [ ] README/guides updated if needed
- [ ] API documentation (Swagger) updated

### Dependencies
- [ ] No unnecessary dependencies added
- [ ] Dependency versions are pinned
- [ ] No known vulnerabilities in dependencies

## Testing Requirements

### Unit Tests

- **Location:** `src/test/java`
- **Naming:** `{ClassName}Test.java`
- **Coverage Goal:** >80% line coverage

```java
@Test
public void testGetProductById_WhenProductExists_ReturnProduct() {
    // Arrange
    Long productId = 1L;
    Product expected = createTestProduct();
    when(productRepository.findById(productId)).thenReturn(Optional.of(expected));
    
    // Act
    Product actual = productService.getProductById(productId);
    
    // Assert
    assertEquals(expected.getId(), actual.getId());
    assertEquals(expected.getName(), actual.getName());
}

@Test
public void testGetProductById_WhenProductNotFound_ThrowException() {
    // Arrange
    Long productId = 999L;
    when(productRepository.findById(productId)).thenReturn(Optional.empty());
    
    // Act & Assert
    assertThrows(ProductNotFoundException.class, () -> {
        productService.getProductById(productId);
    });
}
```

### Integration Tests

- **Test gRPC interactions** between services
- **Test database operations** with test database
- **Test API endpoints** end-to-end

```java
@SpringBootTest
public class AuthControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserGrpcClient userGrpcClient;
    
    @Test
    public void testLoginEndpoint() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("user@example.com", "password123");
        
        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
```

### Test Naming Convention

Use descriptive names following: `test{MethodName}_{Condition}_{ExpectedResult}`

```java
// Good
testFindProductById_WhenIdExists_ReturnProduct()
testValidateEmail_WithInvalidFormat_ReturnFalse()
testSaveProduct_WhenDuplicateExists_ThrowException()

// Bad
testFindProduct()
testValidate()
testSave()
```

### Running Tests

```bash
# Run all tests
mvn clean test

# Run specific test class
mvn test -Dtest=ProductServiceTest

# Run tests matching pattern
mvn test -Dtest=*ValidationTest

# Generate coverage report
mvn test jacoco:report
# View report: target/site/jacoco/index.html
```

## Documentation Requirements

### JavaDoc

**Required for:**
- All public classes
- All public methods
- Public constants

**Format:**

```java
/**
 * Validates email format against standard RFC 5322 pattern.
 *
 * @param email the email address to validate
 * @return true if email format is valid, false otherwise
 * @throws IllegalArgumentException if email is null
 * @see #isValidPassword(String)
 */
public boolean isValidEmail(String email) {
    // implementation
}

/**
 * Represents an auction product listing.
 * 
 * <p>This entity encapsulates product information and metadata
 * required for auction operations including bidding and tracking.
 */
public class Product {
    // fields and methods
}
```

### Inline Comments

- Explain *why*, not *what*
- Use for complex or non-obvious logic
- Keep brief and updated

```java
// Good
// Check if product is still accepting bids (auction hasn't ended)
if (product.getEndTime().isAfter(LocalDateTime.now())) {
    placeBid(bid);
}

// Bad
// Get the product
Product product = getProduct(id);
// Check if product exists
if (product != null) {
    // Place bid
    placeBid(bid);
}
```

### API Documentation

- Update Swagger/OpenAPI annotations when changing endpoints
- Include request/response examples
- Document error responses

```java
@PostMapping("/products/{id}/bid")
@Operation(
    summary = "Place a bid on a product",
    description = "Place a new bid on an auction product. Bid must exceed current highest bid."
)
@ApiResponse(
    responseCode = "200",
    description = "Bid placed successfully"
)
@ApiResponse(
    responseCode = "400",
    description = "Bid is lower than current highest bid"
)
public ResponseEntity<?> placeBid(
    @PathVariable Long id,
    @Valid @RequestBody PlaceBidRequest request) {
    // implementation
}
```

### README Updates

Update README.md or relevant documentation when:
- Adding new features
- Changing configuration
- Modifying API endpoints
- Updating deployment procedures

## Signing Commits

### Setup GPG Signing (Optional but Recommended)

```bash
# Generate GPG key
gpg --full-generate-key

# List keys
gpg --list-secret-keys --keyid-format LONG

# Configure Git to use key
git config --global user.signingkey <KEY_ID>

# Enable signing by default
git config --global commit.gpgsign true
```

### Sign Commits

```bash
# Sign specific commit
git commit -S -m "feat(auth): add JWT refresh token endpoint"

# Sign during merge
git merge --gpg-sign feature/new-feature

# Verify signature
git log --show-signature
```

## Development Environment Setup

### Prerequisites
- Java 21+
- Maven 3.9+
- Docker & Docker Compose
- Git with GPG (optional)

### Local Development

```bash
# Clone repository
git clone <repo-url>
cd Online-Auction-Platform/backend

# Start infrastructure
docker-compose up -d

# Build all services
mvn clean install

# Run tests
mvn clean test

# Run specific service
cd gateway && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### IDE Configuration

**IntelliJ IDEA:**
- Import as Maven project
- Set Java SDK to JDK 21+
- Enable annotation processing for Lombok (if using)
- Configure code style formatter with project settings

**VS Code:**
- Install Extension Pack for Java
- Install Spring Boot Extension Pack
- Configure Maven settings

## Questions or Need Help?

1. Check existing documentation (README.md, CODE_STANDARDS.md, ARCHITECTURE.md)
2. Review similar code patterns in the codebase
3. Ask in team communication channels
4. Open discussion in pull request comments

Thank you for contributing to the Online Auction Platform!
