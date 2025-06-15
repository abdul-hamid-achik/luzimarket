# LUZIMARKET

A modern e-commerce platform for curated gifts and experiences in Mexico.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions, Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod
- **Forms**: React Hook Form
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

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

3. **Start the database with Docker**
```bash
docker-compose up -d postgres
```

4. **Set up environment variables**
Create a `.env.local` file:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/luzimarket
NEXT_PUBLIC_APP_URL=https://luzimarket.shop
```

5. **Set up the database**
```bash
# Generate database migrations
npm run db:generate

# Apply migrations to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

6. **Start the development server**
```bash
npm run dev
```

Visit http://localhost:3000 to see the application in development, or https://luzimarket.shop in production.

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Apply migrations to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio for database management

## Features

- 🛍️ Product browsing by category
- 🔍 Product search and filtering
- 👥 Vendor registration system
- 🎨 Beautiful, responsive design with custom fonts
- 🔒 Type-safe with TypeScript and Zod validation
- ⚡ Fast with Next.js server components
- 🗄️ PostgreSQL database with Drizzle ORM
- 🐳 Docker support for easy deployment
- 📱 Mobile-responsive design

## Pages

1. **Coming Soon Landing** (`/coming-soon`) - Pre-launch page with vendor registration CTA
2. **Home** (`/`) - Category grid showcasing main product categories
3. **Product Listing** (`/products`) - Filtered product browsing with sidebar
4. **Category Pages** (`/category/[slug]`) - Category-specific product listings
5. **Vendor Registration** (`/vendor/register`) - Multi-step form for vendor onboarding

## Database Schema

- **vendors** - Store vendor/business information
- **categories** - Product categories
- **products** - Product catalog with images and tags
- **subscriptions** - Email newsletter subscriptions

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

## TODO - Features from Mockups

### Remaining Tasks
- [ ] **Email Template Management** - UI for managing transactional email templates
- [ ] **Multi-step Progress Indicators** - Add visual progress for checkout and registration flows

### Completed ✓
- [x] **Logo implementation** - Across different user contexts (public, admin, vendor)
- [x] **Social media icons** - In footer with proper links
- [x] **Product Filtering Sidebar** - Category, vendor, price filters with collapsible sections
- [x] **Category Page Hero Banners** - Gradient overlays with decorative elements
- [x] **Search Functionality** - Autocomplete search with debouncing
- [x] **Mobile Responsiveness** - Filter drawer and responsive layouts
- [x] **Product Grid Enhancements** - Vendor info, hover effects, wishlist button
- [x] **Form Validation Indicators** - Green checkmarks and red X visual feedback
- [x] **Wishlist Functionality** - Complete wishlist with localStorage persistence
- [x] **Loading States** - Skeleton loaders throughout the app
- [x] **Newsletter Component** - Styled signup with validation
- [x] **Decorative Elements** - All mockup decorations implemented
- [x] **Customer Account Dashboard** - Profile, orders, addresses, payment methods
- [x] **Authentication Pages** - Login and registration with proper styling
- [x] **About Page** - Company mission with signature decoration
- [x] **Vendor Product Management** - Complete CRUD operations with image upload
- [x] **Order Success Page** - Detailed order confirmation with Stripe integration
- [x] **Stripe Webhooks** - Payment and subscription event handlers
- [x] **Product Reviews/Ratings** - Complete review system with verified purchase badges
- [x] **Quick View Modal** - Product preview with gallery and actions
- [x] Basic vendor registration form
- [x] Category and product listing pages
- [x] Internationalization setup (es/en)

## License

All rights reserved - MOMENTO ESPECIAL SAPI DE CV © 2024