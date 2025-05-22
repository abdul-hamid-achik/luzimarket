# LUZIMARKET

Luzimarket is a full-stack e-commerce platform with a React/Vite frontend and a Node.js/TypeScript/Express backend.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Development](#development)
- [Build & Preview](#build--preview)
- [Database Migrations & Seeding](#database-migrations--seeding)
- [API Documentation](#api-documentation)
- [Local URLs](#local-urls)
- [Testing](#testing)
  - [Offline Testing with PGlite](#offline-testing-with-pglite)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Tech Stack
- **Frontend**: React, Vite, Chakra UI, MUI, NextUI, React Query, Jest, Playwright
- **Backend**: Node.js, TypeScript, Express, Drizzle ORM, Drizzle Seed, Zod, JWT, Stripe, Swagger (OpenAPI)
- **Database**: Neon PostgreSQL (primary), PGlite (offline testing)
- **DevOps**: Vercel

## Prerequisites
- Node.js v22.8.0 or later
- npm v8 or later

## Environment Variables
Create a `.env` file at the project root with the following variables:

```dotenv
PORT=5000
DATABASE_URL=your_neon_postgres_url
DB_MODE=neon # Options: neon (default) or pglite (for offline testing)
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret_key
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_github_repository
GIT_BRANCH=main
GITHUB_PERSONAL_ACCESS_TOKEN=your_personal_access_token

```

## Installation
```bash
git clone <repo-url>
cd <repo-directory>
npm install
```

## Development
```bash
# Start frontend and backend concurrently
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Build & Preview
```bash
# Build both backend and frontend
npm run build

# Preview built frontend
npm run preview:frontend
```

## Database Migrations & Seeding
```bash
# Create a new migration
npm run migrate:generate -- <name>

# Apply pending migrations
npm run migrate:up

# Roll back the last migration
npm run migrate:down

# Seed the database (reset & insert sample data)
npm run seed
```
Alternatively, inside the backend workspace:
```bash
cd apps/backend
npm run db:setup  # drop, migrate, and seed
```

## API Documentation
- Swagger UI (OpenAPI): http://localhost:5000/api/docs

## Local URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Testing
- **Backend unit & integration tests** (Jest & Supertest):
  ```bash
  npm run test:backend
  ```
- **Frontend unit tests** (Jest):
  ```bash
  npm run test:frontend
  ```
- **End-to-end tests** (Playwright):
  ```bash
  npm run test:e2e
  ```
- **All unit tests**:
  ```bash
  npm test
  ```

### Offline Testing with PGlite

The project supports running tests in an offline mode using PGlite, a WebAssembly-based PostgreSQL that can run without an internet connection. This is especially useful for AI coding assistants like Codex or Cursor that operate in isolated environments.

To use PGlite:

1. Setup PGlite and apply migrations:
   ```bash
   npm run pglite:setup
   ```

2. Seed the PGlite database:
   ```bash
   npm run pglite:seed
   ```

3. Run backend tests with PGlite:
   ```bash
   npm run test:backend:offline
   ```

4. Run all tests with PGlite:
   ```bash
   npm run test:offline
   ```

5. Run Playwright E2E tests with PGlite:
   ```bash
   DB_MODE=pglite npm run test:e2e
   ```

You can set the `DB_MODE` environment variable to `pglite` for any command to use PGlite instead of Neon:

```bash
DB_MODE=pglite npm run dev
DB_MODE=pglite npm run test:e2e
```

## Deployment
Deploy to Vercel:
```bash
npm run deploy
```

## Project Structure
```
apps/
  backend/   # nextjs api 
  frontend/  # React/Vite app with backend integration
e2e/          # Playwright end-to-end tests
drizzle.config.json
playwright.config.js
tsconfig.base.json
tsconfig.json
vite.config.ts
```

## Contributing
Contributions are welcome! Please fork the project, create a feature branch, and submit a pull request.

## Security
- JWT tokens are stored in `sessionStorage`; consider using HTTP-only cookies in production.
- Keep secrets (`NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`) secure.

## License
This project is private.
