# Luzimarket Development Workflow Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker Desktop installed and running
- Git

### Initial Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd luzimarket
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. **Start Docker services:**
```bash
# For local development (recommended):
npm run docker:dev   # Only starts DB, Redis, Mail

# Or run everything in Docker:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

4. **Set up database:**
```bash
npm run db:push    # Create schema
npm run db:seed    # Load sample data
```

5. **Start development server:**
```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
luzimarket/
├── app/                    # Next.js 15 app directory
│   ├── [locale]/          # Internationalized pages (es/en)
│   ├── (public)/          # Public pages without auth
│   ├── (auth)/            # Protected pages
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Business logic
│   ├── actions/          # Server actions
│   └── schemas/          # Zod schemas
├── db/                    # Database files
│   ├── schema.ts         # Drizzle schema
│   └── seed.ts           # Seed data
├── i18n/                  # Internationalization
└── e2e/                   # E2E tests
```

## 🛠️ Development Commands

### Database Management
```bash
npm run db:generate    # Generate migrations from schema changes
npm run db:push       # Apply schema to database (dev)
npm run db:migrate    # Run migrations (production)
npm run db:studio     # Open Drizzle Studio GUI
npm run db:seed       # Seed with sample data
```

### Docker Services
```bash
npm run docker:up     # Start all services
npm run docker:down   # Stop all services
npm run docker:logs   # View service logs
npm run docker:clean  # Stop and remove volumes

# For development with Next.js in Docker:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# For production build:
docker build -f Dockerfile.production -t luzimarket:prod .
```

### Testing
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Run tests with UI mode
npm run test:e2e:debug        # Debug tests
npm run test:e2e:headed       # Run tests with browser visible
npm run test:e2e:report       # View test report
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run build         # Build for production
```

## 🔄 Development Workflow

### 1. Feature Development

1. **Create a new branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes following patterns:**
- Server actions in `/lib/actions/`
- Zod schemas in `/lib/schemas/`
- Components in `/components/`
- Use existing UI components from shadcn/ui

3. **Test your changes:**
```bash
# Manual testing
npm run dev

# Run relevant E2E tests
npm run test:e2e -- --grep "your-test"
```

### 2. Database Changes

1. **Modify schema:**
```typescript
// db/schema.ts
export const newTable = pgTable('new_table', {
  id: text('id').primaryKey(),
  // ... columns
});
```

2. **Generate and apply:**
```bash
npm run db:generate   # Creates migration
npm run db:push      # Apply to dev database
```

3. **Update seed data if needed:**
```bash
# Edit db/seed.ts
npm run db:seed
```

### 3. Adding New Pages

1. **For internationalized pages:**
```typescript
// app/[locale]/your-page/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function YourPage() {
  const t = await getTranslations('YourPage');
  // ...
}
```

2. **Add translations:**
```json
// i18n/messages/es.json
{
  "YourPage": {
    "title": "Tu título"
  }
}
```

3. **Update routing if needed:**
```typescript
// i18n/routing.ts
pathnames: {
  '/your-page': {
    es: '/tu-pagina',
    en: '/your-page'
  }
}
```

### 4. Server Actions Pattern

```typescript
// lib/actions/your-action.ts
'use server';

import { z } from 'zod';
import { db } from '@/db';

const schema = z.object({
  field: z.string()
});

export async function yourAction(data: z.infer<typeof schema>) {
  try {
    const validated = schema.parse(data);
    
    // Database operation
    const result = await db.insert(...).values(validated);
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Error message' };
  }
}
```

## 🐛 Debugging

### View Logs
```bash
# Next.js logs
npm run dev

# Database logs
npm run docker:logs postgres

# Email logs (Mailcatcher)
open http://localhost:1080
```

### Database Issues
```bash
# Check connection
docker compose exec postgres psql -U postgres -d luzimarket

# Reset database
npm run docker:clean
npm run docker:up
npm run db:push
npm run db:seed
```

### Common Issues

1. **Port conflicts:**
   - PostgreSQL: 5432
   - Redis: 6379
   - Mailcatcher: 1025, 1080
   - Next.js: 3000

2. **Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Database connection failed:**
   - Check Docker is running
   - Verify DATABASE_URL in .env.local
   - Check service health: `docker compose ps`

## 🚢 Deployment

### Vercel Deployment
1. Push to main branch
2. Vercel automatically deploys
3. Set environment variables in Vercel dashboard

### Production Database
- Use a managed PostgreSQL service (Vercel Postgres, Supabase, etc.)
- Run migrations: `npm run db:migrate`

## 📝 Best Practices

1. **Always use TypeScript** - No `any` types
2. **Server Components by default** - Use 'use client' only when needed
3. **Use Server Actions** for data mutations
4. **Follow existing patterns** in the codebase
5. **Test your changes** with E2E tests
6. **Keep components small** and focused
7. **Use Tailwind CSS** for styling
8. **Validate with Zod** on both client and server

## 🎨 Styling Guidelines

- Font families:
  - Headings: `font-times-now`
  - Body: `font-univers`
- Use Tailwind classes
- Follow mockup designs in `/mockups`
- Components from shadcn/ui

## 🔐 Security

- Never commit `.env.local`
- Use environment variables for secrets
- Validate all user inputs
- Use NextAuth for authentication
- Sanitize data before database operations

## 📚 Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Playwright](https://playwright.dev)