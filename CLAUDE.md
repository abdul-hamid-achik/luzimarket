# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start development server on http://localhost:3000
docker-compose up -d     # Start all services (PostgreSQL, Redis, Mailcatcher, Stripe CLI)
```

### Database Management
```bash
npm run db:generate      # Generate migrations from schema changes
npm run db:push         # Apply schema directly to database (development)
npm run db:migrate      # Run migrations (production)
npm run db:studio       # Open Drizzle Studio GUI
npm run db:seed         # Seed database with sample data
```

### Build & Deployment
```bash
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
docker-compose up --build  # Build and run full stack with Docker
```

## Architecture Overview

This is a Next.js 15 e-commerce platform using App Router with the following key architectural decisions:

### Tech Stack
- **Frontend**: Next.js 15.3.3 with React 19, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js Server Actions (no separate API needed)
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Internationalization**: next-intl supporting Spanish (es) and English (en)
- **Authentication**: NextAuth.js with email/password and OAuth providers
- **Payments**: Stripe integration for checkout
- **Email**: Resend API with React Email templates

### Key Patterns

1. **Server Components by Default**: All components are React Server Components unless explicitly marked with 'use client'

2. **Server Actions**: Business logic is implemented as server actions in `/lib/actions/`. These functions:
   - Use Zod for input validation
   - Return typed responses with success/error states
   - Handle database operations through Drizzle ORM

3. **Form Handling**: Forms use a consistent pattern:
   - React Hook Form for client-side state
   - Zod schemas for validation (shared between client and server)
   - Server actions for submission
   - Loading states and error handling

4. **Database Access**: 
   - Schema defined in `/db/schema.ts` using Drizzle ORM
   - Database client exported from `/db/index.ts`
   - Migrations in `/db/migrations/`
   - Type-safe queries using Drizzle's query builder

5. **Internationalization**:
   - Routes are prefixed with locale (`/es/`, `/en/`)
   - Messages stored in `/i18n/messages/`
   - Use `getTranslations()` in server components
   - Use `useTranslations()` hook in client components

6. **Styling Architecture**:
   - Tailwind CSS for utility classes
   - shadcn/ui for component library
   - Custom fonts: Adobe Myungjo (headings), Times Now (body), Univers (UI)
   - CSS variables for theming in `app/globals.css`

### Project Structure

- `/app/[locale]/` - Internationalized routes
  - `(public)/` - Public routes (products, categories, checkout)
  - `(vendor)/` - Vendor-specific routes
  - `admin/` - Admin dashboard (protected)
  - `api/` - API routes for webhooks and external integrations

- `/components/` - Reusable React components
  - `ui/` - shadcn/ui components (don't modify directly)
  - `forms/` - Form components with validation
  - `layout/` - Layout components (Header, Footer)

- `/lib/` - Business logic and utilities
  - `actions/` - Server actions for data mutations
  - `schemas/` - Zod validation schemas
  - `utils.ts` - Helper functions

### Development Workflow

1. **Adding Features**: 
   - Define Zod schema in `/lib/schemas/`
   - Create server action in `/lib/actions/`
   - Build UI components using shadcn/ui
   - Add translations to `/i18n/messages/`

2. **Database Changes**:
   - Modify schema in `/db/schema.ts`
   - Run `npm run db:generate` to create migration
   - Run `npm run db:push` for development
   - Use `npm run db:migrate` for production

3. **Adding Components**:
   - Use `npx shadcn@latest add <component>` for UI components
   - Create custom components in `/components/`
   - Follow existing patterns for consistency