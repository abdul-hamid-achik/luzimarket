# LUZIMARKET

[![CI: backend, frontend and end to end tests](https://github.com/abdul-hamid-achik/luzimarket/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/abdul-hamid-achik/luzimarket/actions/workflows/ci.yml)

**LUZIMARKET** is an enterprise-level **multi-tenant e-commerce marketplace** specializing in Mexican artisan gifts, flowers, chocolates, and luxury items. Built for the Northern Mexican market, it features a sophisticated multi-application architecture with comprehensive vendor management, advanced CMS capabilities, employee dashboards, and a premium customer experience.

## 🌟 Live Applications

- **🛍️ Customer Marketplace**: [luzimarket.shop](https://luzimarket.shop) - Premium shopping experience
- **🔧 Backend & Admin**: [luzimarket-backend.vercel.app](https://luzimarket-backend.vercel.app) - API & management interfaces

## 📋 Table of Contents
- [Multi-Application Architecture](#multi-application-architecture)
- [Core Features](#core-features)
- [User Roles & Capabilities](#user-roles--capabilities)
- [Tech Stack](#tech-stack)
- [API Documentation](#api-documentation)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation & Development](#installation--development)
- [Database Management](#database-management)
- [Testing Infrastructure](#testing-infrastructure)
- [Default User Accounts](#default-user-accounts)
- [Deployment Strategy](#deployment-strategy)
- [Project Architecture](#project-architecture)

## 🏗️ Multi-Application Architecture

LUZIMARKET operates as a **sophisticated multi-tenant marketplace** with four distinct user interfaces:

### 🛍️ **Customer Storefront** (`/`)
- **Purpose**: Premium shopping experience for end customers
- **Features**: Product browsing, cart management, checkout, order tracking, favorites
- **Technology**: React 19 + Vite with Bootstrap UI
- **Deployment**: [luzimarket.shop](https://luzimarket.shop)

### 🏢 **Vendor Dashboard** (Multi-vendor Support)
- **Purpose**: Business partner product and order management
- **Features**: Product listings, inventory control, commission tracking, order fulfillment
- **Access**: Integrated within customer app with role-based routing

### 👷‍♂️ **Employee Dashboard** (`/dashboard`)
- **Purpose**: Operational management for staff
- **Features**: Order processing, inventory management, customer support, analytics
- **Roles**: Sales managers, marketing specialists, inventory coordinators

### 👨‍💼 **Admin CMS** (`/admin/cms`)
- **Purpose**: Complete system administration and content management
- **Features**: User management, product catalog, vendor approval, system configuration
- **Technology**: Advanced React components with comprehensive forms and data management

## 🚀 Core Features

### 🛒 **E-commerce Marketplace**
- **Product Catalog**: 100+ curated Mexican artisan products with high-quality images
- **Multi-vendor Support**: Commission-based vendor management with approval workflows
- **Smart Cart & Wishlist**: Persistent shopping experience with session management
- **Advanced Search**: Category-based filtering with occasion-specific recommendations
- **Payment Processing**: Stripe integration with Mexican peso support and webhooks
- **Order Management**: Complete lifecycle from placement to delivery with status tracking
- **Geolocation Services**: Leaflet maps for delivery zone management

### 🎨 **Content Management System**
- **Product Management**: Advanced CRUD operations with variant support and bulk actions
- **Media Management**: Vercel Blob integration for optimized image storage and delivery
- **Homepage Carousel**: Dynamic slide management with visual editor and preview
- **Vendor Onboarding**: Complete vendor application and approval workflow
- **Content Publishing**: Rich text editing for product descriptions and editorial content
- **Analytics Dashboard**: Real-time sales metrics with Recharts visualizations

### 📊 **Business Intelligence**
- **Sales Analytics**: Revenue tracking, trend analysis, and performance metrics
- **Inventory Management**: Stock tracking, low-stock alerts, and automated reordering
- **Customer Insights**: Purchase behavior analysis and customer segmentation
- **Vendor Performance**: Commission tracking, sales reporting, and performance metrics
- **Order Analytics**: Processing times, delivery performance, and customer satisfaction

## 🔐 User Roles & Capabilities

### 👨‍💼 **Admin Users** (Complete System Control)
```
Features:
✅ Full CMS access (products, categories, content)
✅ User management and role assignment
✅ Vendor approval and commission management
✅ System configuration and settings
✅ Advanced analytics and reporting
✅ Database management and maintenance
```

### 👷‍♂️ **Employee Users** (Operational Management)
```
Specialized Roles:
• Sales Manager (Gerente de Ventas):
  ✅ Order processing and customer support
  ✅ Sales analytics and performance tracking
  
• Marketing Specialist (Especialista en Marketing):
  ✅ Content management and promotions
  ✅ Discount code creation and campaigns
  
• Inventory Coordinator (Coordinador de Inventario):
  ✅ Stock management and supply chain
  ✅ Vendor coordination and purchasing
```

### 🏢 **Vendor Users** (Business Partners)
```
Features:
✅ Product catalog management for their items
✅ Order fulfillment and inventory updates
✅ Commission tracking and payment reports
✅ Performance analytics and sales insights
✅ Customer communication tools
```

### 🛍️ **Customer Users** (Shopping Experience)
```
Features:
✅ Advanced product browsing and search
✅ Shopping cart and wishlist management
✅ Secure checkout with multiple payment options
✅ Order tracking and history
✅ Address management and delivery preferences
✅ Product reviews and ratings
✅ Favorites and recommendation system
```

## 🛠 Tech Stack

### **Frontend Architecture**
- **Framework**: React 19 (latest) with Vite build system
- **Routing**: React Router v7 with advanced route protection
- **UI Framework**: Bootstrap 5.3 + React Bootstrap components
- **State Management**: TanStack React Query v4 + Context API
- **Forms**: React Hook Form with validation
- **Maps**: Leaflet + React Leaflet for geolocation
- **Charts**: Recharts for analytics visualization
- **Payments**: Stripe React components
- **Testing**: Vitest + React Testing Library + MSW

### **Backend Architecture**
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Drizzle ORM with dual-mode support
  - **Production**: Neon PostgreSQL (serverless)
  - **Development/Testing**: SQLite with Better SQLite3
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Vercel Blob for optimized image delivery
- **Payment Processing**: Stripe webhooks and API integration
- **API Documentation**: Swagger/OpenAPI with JSDoc annotations
- **Testing**: Vitest + Supertest for API testing

### **Database & Infrastructure**
- **Primary Database**: Neon PostgreSQL (production)
- **Testing Database**: SQLite (offline development)
- **Migrations**: Drizzle Kit with version control
- **Seeding**: Comprehensive Spanish dataset with realistic data
- **File Storage**: Vercel Blob with CDN distribution
- **Deployment**: Dual Vercel applications

### **Development & Quality Assurance**
- **Package Management**: NPM workspaces (monorepo)
- **Code Quality**: ESLint + TypeScript strict mode
- **Testing**: Comprehensive suite with >85% coverage
- **E2E Testing**: Playwright with visual regression testing
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Vercel Analytics + Next Axiom logging

## 📚 API Documentation

### **Comprehensive API Endpoints (20+)**
The backend provides a fully documented RESTful API:

**🛒 E-commerce Core**
- `GET/POST /api/products` - Product catalog with advanced filtering
- `GET/POST /api/categories` - Category management
- `GET/POST /api/cart` - Shopping cart operations
- `GET/POST /api/orders` - Order processing and tracking
- `GET/POST /api/favorites` - Wishlist management

**👥 User Management**
- `POST /api/auth/login` - JWT authentication
- `GET/POST /api/profiles` - User profile management
- `GET/POST /api/admin/users` - Admin user management

**🏢 Vendor Operations**
- `GET/POST /api/vendors` - Vendor management
- `GET /api/analytics/vendor/:id` - Vendor performance metrics

**💰 Payment & Financial**
- `POST /api/create-payment-intent` - Stripe payment processing
- `POST /api/webhooks/stripe` - Payment webhooks
- `GET /api/sales` - Sales analytics

**📊 Business Intelligence**
- `GET /api/analytics` - System-wide analytics
- `GET /api/admin/dashboard` - Admin dashboard data

**🎨 Content Management**
- `GET/POST /api/homepage-slides` - Homepage carousel management
- `GET/POST /api/upload` - File upload to Vercel Blob

### **API Features**
- **Swagger Documentation**: Available at `/api/docs`
- **Request Validation**: Comprehensive input validation
- **Error Handling**: Structured HTTP status codes
- **Rate Limiting**: API protection and performance optimization
- **CORS Support**: Configurable cross-origin requests

## ✅ Prerequisites
- **Node.js**: v18.0.0 - v22.x (recommended: v22.8.0)
- **NPM**: v8 or later
- **Git**: For version control
- **Vercel Account**: For deployment and Blob storage

## 🔧 Environment Setup

Create a `.env` file at the project root:

```env
# Database Configuration
DATABASE_URL="your-neon-postgres-url"
DRIZZLE_DATABASE_URL="your-neon-postgres-url"
DB_MODE="neon" # or "offline" for SQLite

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-256bit"

# Stripe Payment Configuration
STRIPE_SECRET_KEY="sk_test_..." # or sk_live_ for production
STRIPE_PUBLISHABLE_KEY="pk_test_..." # or pk_live_ for production
STRIPE_WEBHOOK_SECRET="whsec_..." # from Stripe Dashboard

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token_from_dashboard"

# Application URLs
FRONTEND_URL="https://luzimarket.shop" # or localhost:5173 for dev
BACKEND_URL="https://luzimarket-backend.vercel.app" # or localhost:3000 for dev

# Optional: Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Development Environment
NODE_ENV="development" # production, staging, development
```

## 🚀 Installation & Development

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/abdul-hamid-achik/luzimarket.git
cd luzimarket

# Install all dependencies (workspace-aware)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run migrate:push
npm run seed

# Start development servers (both apps)
npm run dev
```

### **Development Commands**
```bash
# Parallel development (recommended)
npm run dev                    # Both frontend and backend
npm run dev:frontend          # React app at localhost:5173
npm run dev:backend           # Next.js API at localhost:3000

# Database operations
npm run migrate:generate      # Generate new migrations
npm run migrate:up           # Apply migrations
npm run seed                 # Seed with sample data
npm run studio               # Open Drizzle Studio (DB GUI)

# Code quality
npm run lint                 # ESLint for both apps
npm run lint:frontend        # Frontend only
npm run lint:backend         # Backend only
```

### **Local Development URLs**
- **🛍️ Customer Store**: http://localhost:5173
- **🔧 Backend API**: http://localhost:3000/api
- **👨‍💼 Admin CMS**: http://localhost:3000/admin/cms
- **📚 API Docs**: http://localhost:3000/api/docs
- **🗄️ Database Studio**: Launched via `npm run studio`

## 🗄️ Database Management

### **Schema Management**
```bash
# Generate migration from schema changes
npm run migrate:generate

# Apply pending migrations
npm run migrate:up

# Rollback migrations (if needed)
npm run migrate:down

# Push schema directly (development only)
npm run migrate:push
```

### **Data Management**
```bash
# Seed database with comprehensive Spanish dataset
npm run seed

# Reset and reseed (development only)
npm run migrate:down && npm run migrate:up && npm run seed

# Open visual database browser
npm run studio
```

### **Dual Database Support**
```bash
# Switch to offline SQLite mode
export DB_MODE=offline
npm run seed

# Switch back to PostgreSQL
export DB_MODE=neon
npm run migrate:up
```

## 🧪 Testing Infrastructure

### **Comprehensive Test Suite**
```bash
# Run all tests (unit + integration + e2e)
npm test

# Individual test suites
npm run test:frontend        # React component tests
npm run test:backend         # API and business logic tests
npm run test:e2e            # Playwright end-to-end tests

# Development testing
npm run test:frontend -- --watch  # Watch mode for frontend
npm run test:backend -- --coverage # Backend with coverage
```

### **Testing Technologies**
- **Unit Testing**: Vitest with React Testing Library
- **API Testing**: Supertest for endpoint validation
- **E2E Testing**: Playwright with visual regression
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **Coverage**: Comprehensive coverage reporting with V8

### **E2E Test Coverage**
- ✅ Complete user registration and authentication flows
- ✅ Product browsing and search functionality
- ✅ Shopping cart and checkout processes
- ✅ Admin CMS product and vendor management
- ✅ Employee dashboard operations
- ✅ Payment processing with Stripe integration

### **Quality Metrics**
- **Frontend Coverage**: >85% with component and integration tests
- **Backend Coverage**: >90% with API and business logic tests
- **E2E Coverage**: Critical user journeys across all applications

## 🔑 Default User Accounts

After running `npm run seed`, access the system with these pre-configured accounts:

### **👨‍💼 Admin Accounts** (Complete System Control)
```
Primary Admin:
Email: admin@luzimarket.shop
Password: LuziAdmin2024!
Access: Full system administration, CMS, user management

Secondary Admin:
Email: maria.admin@luzimarket.shop  
Password: MariaAdmin123!
Access: Full administrative privileges, backup admin
```

### **👷‍♂️ Employee Accounts** (Operational Staff)
```
Sales Manager:
Email: carlos.ventas@luzimarket.shop
Password: Carlos123!
Role: Gerente de Ventas
Access: Order management, customer support, sales analytics

Marketing Specialist:
Email: ana.marketing@luzimarket.shop
Password: Ana123!
Role: Especialista en Marketing  
Access: Content management, promotions, campaign analytics

Inventory Coordinator:
Email: luis.inventario@luzimarket.shop
Password: Luis123!
Role: Coordinador de Inventario
Access: Stock management, vendor coordination, purchasing
```

### **🏢 Vendor Accounts** (Business Partners)
```
Premium Distributor:
Email: proveedor1@email.com
Password: Proveedor123!
Business: Distribuidora Premium
Commission: 8%
Access: Product management, order fulfillment, performance analytics

Luxury Products Partner:
Email: proveedor2@email.com
Password: Proveedor123!
Business: Productos de Lujo SA  
Commission: 12%
Access: Vendor dashboard, inventory management, sales reports
```

### **🛍️ Customer Accounts** (Shopping Experience)
```
Customer Examples:
Email: sofia.cliente@email.com | Password: Sofia123!
Email: diego.comprador@email.com | Password: Diego123!
Email: carmen.user@email.com | Password: Carmen123!
Email: rafael.cliente@email.com | Password: Rafael123!
Email: lucia.compras@email.com | Password: Lucia123!

Access: Full shopping experience with order history, favorites, reviews
```

## 🚀 Deployment Strategy

### **Dual Vercel Deployment Architecture**

**Frontend Application** (Customer Marketplace)
```bash
# Deploy customer storefront
cd apps/frontend
vercel --prod
# Custom domain: luzimarket.shop
```

**Backend Application** (API & Admin)
```bash
# Deploy API and admin interfaces
cd apps/backend
vercel --prod
# Domain: luzimarket-backend.vercel.app
```

### **Environment Configuration**
Both deployments require environment variables configured in Vercel:
- Database credentials (Neon PostgreSQL)
- Stripe keys and webhook secrets
- JWT authentication secrets
- Vercel Blob storage tokens

### **Production Optimizations**
- **Frontend**: Vite build optimization with code splitting
- **Backend**: Next.js serverless functions with edge optimization
- **Database**: Connection pooling with Neon serverless PostgreSQL
- **Images**: Automatic optimization with Vercel Blob CDN
- **Monitoring**: Real-time analytics and error tracking

## 📁 Project Architecture

```
luzimarket/ (Workspace Root)
├── apps/
│   ├── frontend/              # React 19 + Vite Customer Application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   │   ├── cms/       # Admin CMS components (3 major)
│   │   │   │   ├── dashboard/ # Employee dashboard components
│   │   │   │   └── ui/        # Shared UI components
│   │   │   ├── pages/         # Route components by feature
│   │   │   │   ├── inicio/    # Customer storefront pages
│   │   │   │   └── empleados/ # Employee interface pages
│   │   │   ├── context/       # React Context providers (4 total)
│   │   │   ├── api/           # API client functions
│   │   │   ├── router/        # React Router v7 configuration
│   │   │   └── utils/         # Helper functions and constants
│   │   ├── public/            # Static assets and images
│   │   └── __mocks__/         # Testing mocks and fixtures
│   │
│   └── backend/               # Next.js 15 API & Admin Application
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   │   └── api/       # API routes (20+ endpoints)
│       │   │       ├── products/      # Product management APIs
│       │   │       ├── auth/          # Authentication endpoints
│       │   │       ├── cart/          # Shopping cart APIs
│       │   │       ├── orders/        # Order processing APIs
│       │   │       ├── admin/         # Admin-only endpoints
│       │   │       └── analytics/     # Business intelligence APIs
│       │   ├── db/            # Database layer
│       │   │   ├── schema.ts          # Drizzle ORM schemas
│       │   │   ├── seed.ts            # Comprehensive data seeding
│       │   │   └── services/          # Database services
│       │   └── lib/           # Shared utilities and helpers
│       ├── drizzle/           # Database migrations and metadata
│       └── docs/              # API documentation
│
├── e2e/                       # Playwright End-to-End Tests
│   ├── admin/                 # Admin interface tests
│   ├── auth/                  # Authentication flow tests
│   ├── cms/                   # Content management tests
│   ├── shopping/              # Customer journey tests
│   └── fixtures/              # Test data and utilities
│
├── config/                    # Shared configuration
├── scripts/                   # Build and deployment scripts
└── Root Configuration Files
    ├── package.json           # Workspace configuration
    ├── playwright.config.js   # E2E testing configuration
    ├── vitest.config.mjs      # Unit test configuration
    └── tsconfig.base.json     # TypeScript configuration
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Develop** with comprehensive tests
4. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request with detailed description

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain >85% test coverage
- Update API documentation for new endpoints
- Test across both SQLite and PostgreSQL
- Ensure responsive design compliance

## 🔒 Security & Compliance

- **Authentication**: JWT tokens with secure secret rotation
- **Authorization**: Role-based access control (RBAC) with route protection
- **Data Protection**: Input validation and sanitization on all endpoints
- **Payment Security**: PCI-compliant Stripe integration with webhooks
- **CORS Configuration**: Properly configured for production domains
- **Rate Limiting**: API protection against abuse and DDoS
- **Environment Security**: Secure secret management with Vercel
- **Database Security**: Parameterized queries and injection prevention

## 📊 Performance & Monitoring

- **Frontend Performance**: Vite optimization with code splitting and lazy loading
- **Backend Performance**: Next.js serverless functions with edge caching
- **Database Performance**: Optimized queries with connection pooling
- **Image Optimization**: Automatic optimization with Vercel Blob CDN
- **Real-time Monitoring**: Vercel Analytics with performance insights
- **Error Tracking**: Comprehensive logging with Next Axiom
- **Uptime Monitoring**: Automated health checks and alerting

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**LUZIMARKET** - *Elevating Mexican artisan commerce through technology* 🇲🇽✨

*A sophisticated multi-tenant e-commerce marketplace built with modern technologies for the digital age.*