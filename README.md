# LUZIMARKET

A modern e-commerce platform for curated gifts and unique experiences in Mexico.

## Tech Stack

- **Frontend**: Next.js 15.3.3, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js Server Actions, Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: NextAuth.js with email/password and OAuth
- **Payments**: Stripe integration
- **Email**: Resend API with React Email templates
- **Internationalization**: next-intl (Spanish/English)
- **Validation**: Zod
- **Forms**: React Hook Form
- **Containerization**: Docker & Docker Compose
- **File Storage**: Uploadthing for image uploads
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional for local development)
- npm or pnpm

### Development Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd luzimarket
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file with all required variables (see `.env.example` for reference):
```env
# Database (Neon)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Luzimarket <no-reply@luzimarket.shop>

# Uploadthing
UPLOADTHING_TOKEN=...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up the database**
```bash
# Generate database client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

5. **Start development services (optional)**
```bash
# Start PostgreSQL, Redis, Mailcatcher, and Stripe CLI
docker-compose up -d
```

6. **Start the development server**
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

### Docker Setup (Full Stack)

To run the entire application with Docker:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Next.js application on port 3000

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (public)/          # Public-facing routes
│   │   ├── page.tsx       # Home page with categories
│   │   ├── products/      # Product listing page
│   │   └── category/      # Category pages
│   ├── (vendor)/          # Vendor-specific routes
│   │   └── register/      # Vendor registration form
│   ├── coming-soon/       # Coming soon landing page
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components (Header, Footer)
│   ├── forms/            # Form components
│   └── ui/               # shadcn/ui components
├── db/                    # Database configuration
│   ├── schema.ts         # Drizzle ORM schemas
│   ├── index.ts          # Database connection
│   ├── seed.ts           # Database seeding script
│   └── migrations/       # Generated SQL migrations
├── lib/                   # Utility functions
│   ├── actions/          # Server actions
│   ├── schemas/          # Zod validation schemas
│   └── utils.ts          # Utility functions
└── public/               # Static assets
    ├── fonts/            # Custom fonts
    └── images/           # Images
        ├── logos/        # Brand logos
        ├── socials/      # Social media icons
        └── links/        # Product images
```

## Available Scripts

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate migrations from schema changes
- `npm run db:push` - Apply schema directly to database (development)
- `npm run db:migrate` - Run migrations (production)
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio GUI for database management

### Testing
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run tests with Playwright UI
- `npm run test:e2e:debug` - Debug tests with Playwright

## Features

### Core E-commerce
- 🛍️ Product browsing with advanced filtering (category, vendor, price)
- 🔍 Real-time search with autocomplete
- 🛒 Shopping cart with persistent state
- ❤️ Wishlist functionality
- ⭐ Product reviews and ratings system
- 👁️ Quick view modal for products
- 💳 Stripe checkout integration
- 📦 Order tracking and history

### Multi-vendor Platform
- 👥 Vendor registration and onboarding
- 📊 Vendor dashboard with analytics
- 📝 Product management (CRUD operations)
- 📈 Sales and revenue tracking

### Technical Features
- 🌐 Internationalization (Spanish/English)
- 🔒 Authentication with NextAuth.js
- 📧 Transactional emails with React Email
- 🎨 Custom typography (Adobe Myungjo, Times Now, Univers)
- 📱 Fully responsive design
- ⚡ Optimized with React Server Components
- 🔄 Real-time updates with Server Actions
- 🖼️ Image optimization and uploads

## Key Pages

### Public
- **Home** (`/[locale]`) - Category grid and featured products
- **Products** (`/[locale]/products`) - Product catalog with filters
- **Product Detail** (`/[locale]/products/[slug]`) - Product info, reviews, related items
- **Categories** (`/[locale]/category/[slug]`) - Category-specific listings
- **Search** (`/[locale]/search`) - Search results page
- **Cart** (`/[locale]/cart`) - Shopping cart management
- **Checkout** (`/[locale]/checkout`) - Stripe-powered checkout flow

### Account
- **Login/Register** (`/[locale]/login`, `/[locale]/register`) - Authentication
- **Account Dashboard** (`/[locale]/account`) - User profile and settings
- **Orders** (`/[locale]/orders`) - Order history and tracking

### Vendor
- **Vendor Dashboard** (`/vendor/dashboard`) - Sales overview and analytics
- **Product Management** (`/vendor/products`) - CRUD operations for products
- **Order Management** (`/vendor/orders`) - Vendor order fulfillment

### Admin
- **Admin Dashboard** (`/admin`) - Platform overview
- **User Management** (`/admin/users`) - Manage all users
- **Vendor Management** (`/admin/vendors`) - Approve/reject vendors
- **Order Management** (`/admin/orders`) - All platform orders

## Database Schema

### Core Tables
- **users** - User accounts with roles (customer, vendor, admin)
- **vendors** - Vendor profiles and business information
- **categories** - Product categories with slugs and images
- **products** - Product catalog with variants and inventory
- **product_images** - Multiple images per product
- **product_tags** - Tag system for products

### E-commerce
- **carts** - Shopping cart items
- **wishlists** - User wishlists
- **orders** - Order records with status tracking
- **order_items** - Individual items in orders
- **reviews** - Product reviews and ratings

### Supporting Tables
- **subscriptions** - Newsletter subscriptions
- **addresses** - User shipping/billing addresses
- **payment_methods** - Stored payment methods (Stripe)

## Development Tips

1. **Database Management**
   - Use `npm run db:studio` to visually manage your database
   - Migrations are automatically generated from schema changes

2. **Adding New Components**
   - Use `npx shadcn@latest add <component>` to add new UI components
   - Custom components go in `/components`

3. **Server Actions**
   - Place server actions in `/lib/actions`
   - Use Zod schemas for validation

4. **Styling**
   - Custom fonts are loaded from `/public/fonts`
   - Use Tailwind classes with custom font families: `font-univers`, `font-times-now`, `font-adobe-myungjo`

## Deployment

The app is configured for containerized deployment with Docker. The production build uses Next.js standalone output for optimal container size.

## Testing

The project includes comprehensive end-to-end tests using Playwright:

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

Test coverage includes:
- Authentication flows
- Product browsing and search
- Shopping cart operations
- Checkout process
- Vendor operations
- Admin functionality
- Accessibility compliance

## License

All rights reserved - MOMENTO ESPECIAL SAPI DE CV © 2024