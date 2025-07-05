# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Notes

- **DO NOT REMOVE DEPENDENCIES** - Never remove or replace existing npm packages like drizzle-seed, even if they have compatibility issues. Find workarounds instead.
- **NO scripts folder** - All commands are defined in package.json
- **NO Docker** - Using Vercel managed services (Neon DB, Blob Storage)
- **Single seed script** - One db/seed.ts file that handles everything: reset, seeding, and AI image generation
- **Database reset integrated** - The seed script uses drizzle-seed's reset functionality (can be skipped with --no-reset)
  - Note: The seed script temporarily creates a node-postgres connection for drizzle-seed compatibility, then continues with the regular postgres-js driver
- **AI image generation** - Images are generated directly in seed.ts if OPENAI_SECRET_KEY is present
  - Note: Some product names like "Kit de Coctelería" may trigger OpenAI content policy errors
- **Realistic data** - Uses faker.js with Spanish (Mexico) locale for authentic vendor and product names
- **Category-aware pricing** - Products have realistic prices based on their category
- **Keep it simple** - Avoid creating duplicate scripts or complex variations
- **Database** - Using Neon serverless PostgreSQL
- **File Storage** - Using Vercel Blob for file storage

## Local Development Setup

### Prerequisites
- Node.js 22+ and npm 10+
- Vercel account with Neon DB and Blob Storage addons
- OpenAI API key (optional, for AI image generation)
- Stripe account (for payment testing)

### Initial Setup
```bash
# 1. Clone the repository
git clone <repo-url>
cd luzimarket

# 2. Install dependencies
npm install

# 3. Set up Vercel and link project
npm run vercel:link

# 4. Add Neon database
# Go to https://vercel.com/dashboard/stores
# Add Neon integration and create a database

# 5. Pull environment variables from Vercel
npm run vercel:env:pull

# 6. Set up database schema
npm run db:push

# 7. Seed database (optional)
npm run db:seed

# 8. Start development server
npm run dev
```

### Daily Development
```bash
# Start dev server
npm run dev

# Optional: Run Stripe CLI for webhook testing
npm run dev:stripe
```

### Commands

#### Development
```bash
npm run dev                 # Start Next.js development server
npm run dev:stripe          # Start Stripe CLI for webhook testing
```

#### Database Management
```bash
npm run db:generate         # Generate migrations from schema changes
npm run db:push            # Apply schema to database
npm run db:migrate         # Run migrations (for production)
npm run db:migrate:prod    # Run migrations with production env
npm run db:push:prod       # Push schema to production database
npm run db:studio          # Open Drizzle Studio GUI
npm run db:seed            # Seed database (uses AI if OPENAI_SECRET_KEY exists)
npm run db:seed:prod       # Seed production database
npm run db:reset           # Reset and re-seed database (same as db:seed)
npm run db:setup           # Run db:push + db:seed (initial setup)

# Seed options:
# - Default: Resets database and seeds with fresh data
# - With --no-reset flag: Seeds without resetting (appends data)
# - With --no-images flag: Skips AI image generation
# - With --fast flag: Generates images for only 10 products (for testing)
# Examples: 
#   npm run db:seed -- --no-reset
#   npm run db:seed -- --no-images
#   npm run db:seed -- --fast
#   npm run db:seed -- --no-images --no-reset
```

#### Build & Deployment
```bash
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
npm run vercel:deploy      # Deploy to Vercel preview
npm run vercel:deploy:prod # Deploy to Vercel production
```

#### Testing
```bash
npm run test:e2e           # Run end-to-end tests with Playwright
npm run test:e2e:ui        # Run tests with Playwright UI
npm run test:e2e:debug     # Debug tests with Playwright
npm run test:e2e:headed    # Run tests in headed mode
```

### Environment Variables

The project uses environment variables from Vercel. Use `npm run vercel:env:pull` to sync them locally.

#### Required Environment Variables
```bash
# Database (Neon)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Email (Resend)
RESEND_API_KEY=...
EMAIL_FROM=noreply@luzimarket.shop

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

#### AI Image Generation
The seed script automatically uses AI for images if you have an OpenAI key:
```bash
OPENAI_SECRET_KEY=sk-...  # Optional: If present, generates product/category images with DALL-E 3
```
- Single `npm run db:seed` command handles both cases
- With key: Generates unique AI images for all products and categories
- Without key: Uses placeholder images
- No need for separate scripts or commands

For Vercel Blob storage (production only):
```bash
BLOB_READ_WRITE_TOKEN=...  # Optional: Falls back to local file storage in dev
```

### Vercel Services Setup

#### 1. Neon Database
1. Go to https://vercel.com/dashboard/integrations
2. Search for "Neon" and click "Add Integration"
3. Follow the setup wizard to create a new database
4. Connect it to your project
5. Environment variables (DATABASE_URL, DIRECT_URL) are automatically added

#### 2. Vercel Blob Storage
1. Go to https://vercel.com/dashboard/stores
2. Click "Create Database" → Select "Blob"
3. Connect it to your project
4. Get the `BLOB_READ_WRITE_TOKEN` from the dashboard

#### 3. Local Development
- Use `npm run vercel:env:pull` to sync all environment variables
- The `.env.local` file will be created with all necessary values
- For local file storage during dev, the app falls back when `BLOB_READ_WRITE_TOKEN` is not set

### Testing with Playwright

#### Testing shadcn/ui Components

When writing tests for shadcn/ui components (which use Radix UI primitives):

1. **Sheet/Dialog Components**:
   - Use `role="dialog"` selector instead of looking for `aside` elements
   - Example: `await page.getByRole('dialog')`

2. **Checkbox Components**:
   - Not standard `<input type="checkbox">` elements
   - Click the label instead: `await page.locator('label[for="checkboxId"]').click()`
   - Or use: `await page.getByRole('checkbox', { name: 'Label text' })`

3. **Buttons with Lucide Icons**:
   - Don't search for text in buttons containing only SVG icons
   - Use parent selectors: `await page.locator('button:has(svg.h-3.w-3)').nth(1)`
   - Or use accessible names: `await page.getByRole('button', { name: 'aria-label value' })`

4. **Best Practices**:
   - Wait for animations: `await page.waitForTimeout(300)` after opening dialogs
   - Use role-based selectors when possible
   - Check for `data-slot` attributes added by shadcn components

## Architecture Overview

This is a Next.js 15 e-commerce platform using App Router with the following key architectural decisions:

### Tech Stack
- **Frontend**: Next.js 15.3.3 with React 19, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js Server Actions (no separate API needed)
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe queries
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

7. **File Storage**:
   - Production: Vercel Blob storage via `@vercel/blob`
   - Development: Local file storage in `/public/uploads/` (gitignored)
   - Automatic fallback when `BLOB_READ_WRITE_TOKEN` is not present

8. **Testing Architecture**:
   - E2E tests with Playwright
   - `data-testid` attributes throughout for reliable selectors
   - Automatic removal of test attributes in production builds via Next.js compiler

9. **AI Image Generation**:
   - Uses OpenAI DALL-E 3 for generating product and category images
   - Integrated into seed script - runs automatically if `OPENAI_SECRET_KEY` is present
   - Generates contextually appropriate e-commerce photography

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