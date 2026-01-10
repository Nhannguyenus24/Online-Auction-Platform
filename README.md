# Online Auction Platform

A comprehensive online auction platform built with microservices architecture, featuring real-time bidding, automated auctions, and integrated payment processing.

## 🚀 Features

### Core Functionalities
- **Multi-tier Category System** - Browse products across hierarchical categories
- **Real-time Bidding** - Live auction updates with WebSocket integration
- **Automated Bidding** - Set maximum bid limits and let the system bid automatically
- **Auto-extension** - Auctions automatically extend when last-minute bids are placed
- **Watch List** - Save and track favorite auction items
- **Rating System** - Bidders and sellers rate each other to build trust
- **Q&A System** - Buyers can ask sellers questions about products
- **Full-text Search** - Vietnamese-aware search with accent insensitivity

### Special Features
- **Automatic Auction System** - Users set their maximum price, and the system automatically places the minimum bid needed to stay ahead
- **Reputation-based Access Control** - Users with 80%+ positive ratings get priority bidding access
- **Smart Email Notifications** - Real-time email alerts for all important auction events
- **Post-auction Payment Flow** - Integrated payment gateway (MoMo/ZaloPay/VNPay/Stripe/PayPal) with order completion workflow
- **Real-time Chat** - WebSocket-powered chat between buyers and sellers
- **Admin Dashboard** - Comprehensive analytics and user management

## 🛠️ Technology Stack

### Backend (Microservices)
- **Framework**: Spring Boot 3.x
- **Build Tool**: Maven
- **Architecture**: Microservices with API Gateway
- **Services**:
  - Gateway Service (API Gateway & Load Balancer)
  - User Service (Authentication & User Management)
  - Products Service (Auction Listings & Bidding)
  - Chat Service (Real-time Messaging)
  - Notification Service (Email & Push Notifications)
- **Security**: JWT (Access Token + Refresh Token)
- **Database**: MySQL
- **Caching**: Redis
- **Message Queue**: RabbitMQ
- **API Documentation**: Swagger/OpenAPI
- **Monitoring**: Grafana / ELK Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Router**: React Router
- **State Management**: React Context / Redux / Zustand
- **Form Handling**: Formik / React Hook Form
- **UI Architecture**: Flux pattern with unidirectional data flow
- **Styling**: Consistent design system across all pages

### DevOps
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git/GitHub

## 📋 Prerequisites

- **Java**: JDK 17 or higher
- **Maven**: 3.8+
- **Node.js**: 18+ with npm
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **MySQL**: 8.0+ (or use Docker)
- **Redis**: Latest (or use Docker)
- **RabbitMQ**: Latest (or use Docker)

## ⚙️ Configuration & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Nhannguyenus24/Online-Auction-Platform.git
cd Online-Auction-Platform
```

### 2. Database Setup
```bash
# Import database schema and sample data
mysql -u root -p < docs/mysqldb.sql
mysql -u root -p < docs/sample_data.sql
```

### 3. Backend Configuration

Each microservice has its own `application.properties` or `application.yml`. Update the following:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/auction_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# Redis
spring.redis.host=localhost
spring.redis.port=6379

# RabbitMQ
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest

# JWT
jwt.secret=your_secret_key
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

### 4. Frontend Configuration

Create `.env` file in the `frontend/` directory:

```env
VITE_API_GATEWAY_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Online Auction Platform
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
```

**Note:** To get a reCAPTCHA v2 site key:
1. Go to https://www.google.com/recaptcha/admin/create
2. Register a new site with reCAPTCHA v2 "I'm not a robot" Checkbox
3. Add your domain (localhost for development)
4. Copy the Site Key and add it to your `.env` file

## 🚀 Running the Application

### Step 1: Using Docker Compose (for database)

```bash
# Build and start all services
docker-compose up --build
```

### Step 2: Service setup

#### Backend Services

```bash
# Navigate to backend directory
cd backend

# Build all services
mvn clean install

# Run each service separately (in different terminals)
cd gateway && mvn spring-boot:run
cd user && mvn spring-boot:run
cd products && mvn spring-boot:run
cd chat && mvn spring-boot:run
cd notification && mvn spring-boot:run
```

#### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📚 API Documentation

Once the backend services are running, access the Swagger documentation at:
- Gateway: http://localhost:8080/swagger-ui.html

## 👥 User Roles

1. **Guest** - Browse auctions, search products, view details
2. **Bidder** - Place bids, manage watch list, ask questions
3. **Seller** - List products, manage auctions, answer questions
4. **Administrator** - Manage categories, users, and system settings

## 📝 Sample Data

The database comes pre-loaded with:
- 20+ auction products across 4-5 categories
- Sample users (bidders, sellers, admin)
- Bid history for each product (minimum 5 bids)
- Product descriptions and images

## 🔐 Security Features

- Password encryption using bcrypt/scrypt
- JWT-based authentication with refresh tokens
- OTP verification for email confirmation
- reCAPTCHA for registration
- Role-based access control (RBAC)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Development Team

HCMUS 22KTPM2 - Final Project

---

For detailed feature specifications in Vietnamese, please refer to the project documentation.
