# Deployment Guide

## Prerequisites

- Java 21+
- Maven 3.9+
- Docker & Docker Compose (for containerized deployment)
- MySQL 8.0+
- Redis 7.0+
- RabbitMQ 3.13+

## Local Development Setup

### 1. Start Infrastructure (Docker Compose)

```bash
cd backend
docker-compose up -d
```

This will start:
- MySQL (port 3306)
- Redis (port 6379)
- RabbitMQ (port 5672, management UI: http://localhost:15672)
- Loki (port 3100)
- Grafana (port 3000)

### 2. Build the Project

```bash
mvn clean package
```

Or skip tests for faster build:
```bash
mvn clean package -DskipTests
```

### 3. Run Individual Services

Each microservice can be run independently:

**Gateway (API Entry Point)**
```bash
cd gateway
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- URL: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

**User Service (gRPC)**
```bash
cd user
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- Port: 9090

**Products Service (gRPC)**
```bash
cd products
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- Port: 9091

**Notification Service**
```bash
cd notification
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Chat Service**
```bash
cd chat
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Environment Variables

Copy `.env.example` to `.env` and set your values:

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key variables:
- `MYSQL_PASSWORD` - Database password
- `RABBITMQ_PASSWORD` - RabbitMQ password
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `STRIPE_SECRET_KEY` - Stripe API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `CLOUDINARY_API_SECRET` - Cloudinary secret

## Production Deployment

### 1. Build Docker Images

```bash
# Build gateway image
docker build -t auction-gateway:1.0.0 --build-arg SERVICE_NAME=gateway .

# Build other services similarly
docker build -t auction-products:1.0.0 --build-arg SERVICE_NAME=products .
docker build -t auction-user:1.0.0 --build-arg SERVICE_NAME=user .
docker build -t auction-notification:1.0.0 --build-arg SERVICE_NAME=notification .
docker build -t auction-chat:1.0.0 --build-arg SERVICE_NAME=chat .
```

### 2. Deploy to Kubernetes (Example)

```bash
kubectl apply -f k8s/
```

Ensure you have configured:
- ConfigMaps for application properties
- Secrets for sensitive data (credentials, API keys)
- PersistentVolumes for database storage

### 3. Set Deployment Profile

Use production configuration profile:

```bash
export SPRING_PROFILES_ACTIVE=prod
```

## Database Migrations

Flyway automatically runs database migrations on application startup from:
- `src/main/resources/db/migration/`

To manually run migrations:
```bash
mvn flyway:migrate
```

## Health Checks

### Liveness Probe (is service running?)
```bash
curl http://localhost:8080/actuator/health/liveness
```

### Readiness Probe (is service ready to serve requests?)
```bash
curl http://localhost:8080/actuator/health/readiness
```

## Monitoring

### Prometheus Metrics
```bash
curl http://localhost:8080/actuator/prometheus
```

### Grafana Dashboard
- URL: http://localhost:3000
- Default credentials: admin/admin
- Add Loki data source: http://loki:3100

### Logs
All logs are pushed to Loki and viewable in Grafana.

## Performance Tuning

### JVM Heap Settings
```bash
java -XX:+UseG1GC \
     -XX:MaxRAMPercentage=75.0 \
     -XX:InitialRAMPercentage=50.0 \
     -jar gateway.jar
```

### Database Connection Pool
Configured in `application.properties`:
- `spring.r2dbc.pool.initial-size=10`
- `spring.r2dbc.pool.max-size=20`

Adjust based on expected concurrent connections.

### Rate Limiting
Configured per environment in `application-{profile}.properties`:
- `rate.limit.auth.capacity` - Auth endpoint limit
- `rate.limit.authenticated.capacity` - Authenticated user limit
- `rate.limit.public.capacity` - Public endpoint limit

## Troubleshooting

### Service won't start
1. Check logs: `docker logs <container-name>`
2. Verify environment variables are set
3. Check database connectivity: `mysql -h localhost -u root -p`

### High latency
1. Check Prometheus metrics for slow queries
2. Monitor database connection pool usage
3. Review Grafana dashboards for bottlenecks

### Memory issues
1. Monitor heap usage in Grafana
2. Increase JVM heap size: `-Xmx2g`
3. Check for memory leaks in logs

## Graceful Shutdown

Services gracefully shutdown with:
```bash
kill -SIGTERM <pid>
```

Maximum wait time: 30 seconds (configured in `application.properties`)

## Security Checklist

- [ ] All credentials in environment variables (not in config files)
- [ ] HTTPS/TLS enabled in production
- [ ] JWT secret is strong (min 32 characters)
- [ ] Database credentials are unique per environment
- [ ] Rate limiting is enabled
- [ ] CORS origins are restricted
- [ ] Sensitive endpoints require authentication
- [ ] Logs don't contain sensitive information
