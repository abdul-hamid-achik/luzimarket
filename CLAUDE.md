# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LUZIMARKET is an enterprise-level multi-tenant e-commerce marketplace built as a monorepo with two main applications:
- **Frontend**: React 19 + Vite customer marketplace (`apps/frontend`)
- **Backend**: Next.js 15 API + Admin CMS (`apps/backend`)

The system serves four distinct user interfaces: Customer Storefront, Employee Dashboard, Admin CMS, and Vendor Portal.

## Common Development Commands

### Development
```bash
npm run dev              # Run both apps in parallel (frontend: 5173, backend: 3000)
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
```

### Building
```bash
npm run build            # Build both apps
npm run build:frontend   # Frontend only
npm run build:backend    # Backend only
```

### Testing
```bash
npm test                 # All tests (backend + frontend + e2e)
npm run test:backend     # Backend unit tests
npm run test:frontend    # Frontend unit tests
npm run test:e2e        # Playwright E2E tests

# Run specific test file
npm run test:backend -- src/app/api/products/route.spec.ts
npm run test:frontend -- src/api/products.spec.js
```

### Database Management
```bash
npm run migrate:generate # Generate migrations from schema changes
npm run migrate:up       # Apply migrations
npm run seed            # Seed database with Spanish dataset
npm run studio          # Open Drizzle Studio GUI
```

### Code Quality
```bash
npm run lint            # Lint both apps
npm run lint:frontend   # Frontend only
npm run lint:backend    # Backend only
```

## Architecture & Code Organization

### Multi-Application Structure
The project uses NPM workspaces to manage multiple applications:

1. **Customer Application** (`apps/frontend/src/pages/inicio/*`)
   - Public shopping experience with product browsing, cart, checkout
   - Uses React Router v7 with route protection
   - TanStack Query for API state management

2. **Employee Dashboard** (`apps/frontend/src/pages/empleados/*`)
   - Operational management interface
   - Role-based access for different employee types
   - Real-time analytics with Recharts

3. **Admin CMS** (`apps/frontend/src/components/cms/*`)
   - Complete system administration
   - Product, vendor, and user management
   - Advanced forms with validation

4. **API Backend** (`apps/backend/src/app/api/*`)
   - RESTful API with 20+ endpoints
   - JWT authentication with role-based access
   - Drizzle ORM with PostgreSQL

### Key API Patterns

**Authentication Flow**:
- Login: `POST /api/auth/login` returns JWT token
- Protected routes require `Authorization: Bearer <token>` header
- Role-based middleware checks user permissions

**Database Operations**:
- All DB queries use Drizzle ORM
- Schema defined in `apps/backend/src/db/schema.ts`
- Service layer in `apps/backend/src/db/service.ts`

**File Uploads**:
- Images uploaded to Vercel Blob via `/api/upload/photos`
- Automatic optimization and CDN delivery
- Reference stored in database

### Frontend State Management

**Global State**:
- Auth: `src/context/auth_context.jsx`
- Cart: `src/context/cart_context.jsx`
- Favorites: `src/context/favorites_context.jsx`

**API Integration**:
- All API calls in `apps/frontend/src/api/*`
- Uses TanStack Query for caching and synchronization
- Custom hooks in `apps/frontend/src/api/hooks.js`

### Testing Strategy

**Backend Testing**:
- API endpoint tests with Supertest
- Database tests with test transactions
- JWT authentication mocking

**Frontend Testing**:
- Component tests with React Testing Library
- API mocking with MSW
- Route testing with memory router

**E2E Testing**:
- Critical user journeys with Playwright
- Visual regression testing
- Payment flow testing with Stripe test mode

## Important Development Notes

### Database Considerations
- Production uses Neon PostgreSQL (serverless)
- Migrations must be generated and committed
- Always test with `npm run migrate:up` before pushing

### API Development
- All new endpoints need JSDoc comments for Swagger
- Input validation required on all POST/PUT endpoints
- Follow existing error response patterns

### Frontend Routing
- Customer routes: No prefix (e.g., `/`, `/categorias`)
- Employee routes: `/dashboard/*` prefix
- Admin routes: `/admin/cms/*` prefix
- Use `RequireAuth` and `RequireRole` components for protection

### Payment Integration
- Stripe webhook endpoint at `/api/webhooks/stripe`
- Test webhooks locally with Stripe CLI
- Always use test keys in development

### Image Handling
- Upload through `/api/upload/photos` endpoint
- Vercel Blob handles optimization
- Store only the URL in database

### Environment Variables
Critical variables that must be set:
- `DATABASE_URL` - Neon PostgreSQL connection
- `JWT_SECRET` - 256-bit secret for auth
- `STRIPE_SECRET_KEY` - Stripe API key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token

## Deployment Process

### Frontend Deployment
```bash
cd apps/frontend
vercel --prod
```

### Backend Deployment
```bash
cd apps/backend
vercel --prod
```

Both apps deploy independently but share the same database and environment configuration.

## Common Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is set correctly
- Check Neon dashboard for connection limits
- Use `npm run studio` to verify schema

### Authentication Problems
- Verify JWT_SECRET matches between environments
- Check token expiration (24h default)
- Ensure role permissions in middleware

### Build Failures
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build:backend`
- Verify all environment variables are set

### Test Failures
- Run `npm run seed` to reset test data
- Check for port conflicts (5173, 3000)
- Ensure test database is properly configured