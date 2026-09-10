# Online Auction Platform - Backend Services

Enterprise-grade microservices architecture for an online auction platform built with Spring Boot 3.5.7 and Spring Cloud.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Client Applications                  │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│         API Gateway (HTTP/REST)                      │
│  - JWT Authentication                               │
│  - Rate Limiting (Bucket4j)                         │
│  - Request/Response Logging                         │
│  - Global Exception Handling                        │
└────┬──────────┬──────────┬──────────┬──────────────┘
     │          │          │          │
┌────▼──┐  ┌────▼──┐  ┌───▼───┐  ┌──▼────┐
│ User  │  │Products│ │Notifi-│  │ Chat  │
│Service│  │Service │ │cation │  │Service│
│(gRPC) │  │(gRPC) │ │(gRPC) │  │(WS)   │
└────┬──┘  └────┬──┘  └───┬───┘  └──┬────┘
     │          │         │        │
     └──────────┼─────────┼────────┘
                │         │
         ┌──────▼──────┬──▼─────┐
         │   MySQL     │ Redis  │
         │  Database   │ Cache  │
         └─────────────┴────────┘
```

## 📦 Microservices

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| **Gateway** | 8080 | HTTP/REST | API entry point, authentication, rate limiting |
| **User Service** | 9090 | gRPC | User management, authentication, JWT generation |
| **Products Service** | 9091 | gRPC | Auction listings, bidding, product search |
| **Notification Service** | N/A | gRPC + RabbitMQ | Email notifications, event processing |
| **Chat Service** | 8081 | HTTP/WebSocket | Real-time messaging between users |

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Maven 3.9+
- Docker & Docker Compose

### Development Setup

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Build all services
mvn clean package

# 3. Run services (from separate terminals)
cd gateway && mvn spring-boot:run -Dspring-boot.run.profiles=dev
cd user && mvn spring-boot:run -Dspring-boot.run.profiles=dev
cd products && mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**API is available at:** http://localhost:8080
**Swagger UI:** http://localhost:8080/swagger-ui.html

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
MYSQL_URL=r2dbc:mysql://localhost:3306/mydb
MYSQL_USER=root
MYSQL_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters

# Email (for notifications)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# External Services
STRIPE_SECRET_KEY=sk_live_xxxxx
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
CLOUDINARY_API_SECRET=xxxxx
```

### Profiles

- **dev** - Development environment (verbose logging, all endpoints exposed)
- **prod** - Production environment (minimal logging, restricted endpoints)

Set profile:
```bash
export SPRING_PROFILES_ACTIVE=prod
```

## 🔐 Security Features

✅ **JWT Authentication**
- Stateless token-based authentication
- Configurable expiration times
- Refresh token support

✅ **Rate Limiting**
- Per-endpoint rate limiting
- IP-based throttling
- DDoS protection

✅ **Input Validation**
- @Valid annotations on request DTOs
- Custom validation utilities
- XSS prevention

✅ **CORS Protection**
- Configurable allowed origins
- Preflight request handling

✅ **Credentials Management**
- Environment variables for secrets
- No hardcoded passwords in code
- Support for secret management systems (Vault)

## 📊 Monitoring & Observability

### Metrics
- Prometheus metrics on `/actuator/prometheus`
- Custom metrics: login attempts, product views, bids placed
- Performance percentiles (p50, p95, p99)

### Logging
- Centralized logging with Loki
- Request/response logging with correlation IDs
- Structured logging with SLF4J/MDC

### Health Checks
- Liveness probe: `/actuator/health/liveness`
- Readiness probe: `/actuator/health/readiness`

### Distributed Tracing
- Request ID propagation across services
- Trace ID in all logs for correlation

## 📈 Performance Optimizations

- **Reactive Programming** - R2DBC for async database access
- **Connection Pooling** - Configurable pool sizes (10-50 connections)
- **Caching** - Redis caching for frequently accessed data
- **Async Processing** - RabbitMQ for async notifications
- **Compression** - Gzip compression for HTTP responses

## 🧪 Testing

### Run Tests
```bash
mvn clean test
mvn clean test -Dtest=ValidationServiceTest
```

### Test Coverage
- Unit tests for services and utilities
- Integration tests for gRPC calls
- End-to-end API tests

Example test structure:
```
src/test/java/
├── gateway/
│   ├── controller/
│   ├── service/
│   └── config/
└── integration/
```

## 📚 API Documentation

### Swagger/OpenAPI
- Interactive API docs: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

### Key Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/login-google` - Login with Google OAuth
- `POST /api/auth/refresh` - Refresh access token

**Products**
- `GET /api/guest/products` - Search products
- `GET /api/guest/products/{id}` - Get product details
- `POST /api/seller/products` - Create auction listing
- `PUT /api/seller/products/{id}` - Update listing

**Bidding**
- `POST /api/bidder/products/{id}/bid` - Place bid
- `GET /api/bidder/products/{id}/highest-bidder` - Check highest bidder

See Swagger UI for complete API specification.

## 🐳 Docker Deployment

### Build Images
```bash
docker build -t auction-gateway:1.0.0 --build-arg SERVICE_NAME=gateway .
docker build -t auction-products:1.0.0 --build-arg SERVICE_NAME=products .
```

### Run Containers
```bash
docker run -e SPRING_PROFILES_ACTIVE=prod \
           -e MYSQL_PASSWORD=secure_password \
           -e JWT_SECRET=secure_jwt_secret \
           -p 8080:8080 \
           auction-gateway:1.0.0
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

## 🛠️ Troubleshooting

### Common Issues

**Port already in use**
```bash
lsof -i :8080
kill -9 <PID>
```

**Database connection failed**
```bash
# Check MySQL is running
docker ps | grep mysql

# Verify credentials in .env
mysql -h localhost -u root -p
```

**gRPC service not found**
```bash
# Ensure all services are running
mvn spring-boot:run
```

**Memory leaks**
```bash
# Monitor heap usage
curl http://localhost:8080/actuator/prometheus | grep jvm_memory
```

## 📋 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `products` - Auction listings
- `bids` - Bid history
- `watchlist` - User watchlists
- `conversations` - Chat conversations
- `messages` - Chat messages
- `user_ratings` - User ratings and reviews

Database migrations run automatically via Flyway on application startup.

## 📋 Code Quality & Development Standards

### Development Standards
Follow our comprehensive development guidelines for consistent, high-quality code:
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines, Git workflow, commit message format, PR process, and code review checklist
- **[CODE_STANDARDS.md](./CODE_STANDARDS.md)** - Naming conventions, code organization, error handling, validation patterns, and testing requirements

### Architecture & Design
Understand the system architecture and design decisions:
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Microservices architecture, service design, communication patterns, data flow, error propagation, and security boundaries

### API Design
Guidelines for REST API and gRPC implementation:
- **[API_GUIDELINES.md](./API_GUIDELINES.md)** - REST design principles, HTTP status codes, error response formats, pagination, versioning strategy, and API documentation

### Logging & Observability
Best practices for logging, monitoring, and troubleshooting:
- **[LOGGING_GUIDE.md](./LOGGING_GUIDE.md)** - Log levels, structured logging, correlation IDs, sensitive data handling, performance considerations, and monitoring integration

### Naming Conventions
- Classes: PascalCase (`ProductService`, `AuthController`)
- Methods: camelCase (`getUserById`, `validateEmail`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- Files: Match class name (`ProductService.java`)

### Code Organization
- Package by feature (not layer)
- Max 500 LOC per class
- Single Responsibility Principle
- Dependency Injection (Constructor-based)

## 🔄 Development Workflow

1. **Create Feature Branch** - See [CONTRIBUTING.md](./CONTRIBUTING.md#branch-naming)
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md) guidelines
   - Write unit tests (>80% coverage)
   - Update documentation and Swagger annotations

3. **Test Locally**
   ```bash
   mvn clean test
   mvn clean compile
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

4. **Commit with Conventional Commits** - See [CONTRIBUTING.md](./CONTRIBUTING.md#commit-message-format)
   ```bash
   git commit -m "feat(products): add product filtering
   
   Implement product filtering by category and price range
   to improve user search experience.
   
   Fixes #123"
   ```

5. **Create Pull Request** - See [CONTRIBUTING.md](./CONTRIBUTING.md#pull-request-process)
   - Include test coverage proof
   - Reference related issues
   - Get 2 approvals before merging
   - Squash commits if requested

## 📚 Complete Documentation Index

**Essential Reading (Start Here):**
1. [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute code
2. [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Code style and best practices
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and components

**Reference Guides:**
4. [API_GUIDELINES.md](./API_GUIDELINES.md) - REST API and gRPC standards
5. [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) - Logging and observability
6. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment and operations
7. [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Project improvements and future work

## 📞 Support & Contact

For issues or questions:
1. Check relevant documentation files (see index above)
2. Review [CONTRIBUTING.md](./CONTRIBUTING.md#questions-or-need-help) for FAQs
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design questions
4. Review Swagger documentation at http://localhost:8080/swagger-ui.html
5. Check application logs for errors (see [LOGGING_GUIDE.md](./LOGGING_GUIDE.md))
6. Open an issue on GitHub with detailed information

## 📄 License

[Your License Here]

## 🎯 Next Steps

- [ ] Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow
- [ ] Review [CODE_STANDARDS.md](./CODE_STANDARDS.md) for coding guidelines
- [ ] Understand [ARCHITECTURE.md](./ARCHITECTURE.md) system design
- [ ] Set up CI/CD pipeline with quality gates
- [ ] Configure monitoring alerts (see [LOGGING_GUIDE.md](./LOGGING_GUIDE.md))
- [ ] Implement circuit breakers for resilience
- [ ] Add comprehensive integration tests (>80% coverage)
- [ ] Set up database backup strategy
- [ ] Configure SSL/TLS certificates for production
- [ ] Implement per-user API rate limiting
