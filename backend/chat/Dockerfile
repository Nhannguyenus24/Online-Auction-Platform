FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy chat module
COPY chat ./chat

# Build chat module standalone (it uses Spring Boot parent directly)
WORKDIR /app/chat
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

COPY --from=build /app/chat/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]

