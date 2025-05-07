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
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Tech Stack
- **Frontend**: React, Vite, Chakra UI, MUI, NextUI, React Query, TinaCMS, Jest, Playwright
- **Backend**: Node.js, TypeScript, Express, Drizzle ORM, Drizzle Seed, Zod, JWT, Stripe, Swagger (OpenAPI), TinaCMS
- **Database**: PostgreSQL (local via Docker Compose or Neon serverless)
- **DevOps**: Docker, Docker Compose, Vercel

## Prerequisites
- Node.js v22.8.0 or later
- npm v8 or later
- Docker & Docker Compose

## Environment Variables
Create a `.env` file at the project root with the following variables:

```dotenv
PORT=5000
DATABASE_URL=postgres://postgres:password@localhost:5433/ecommerce
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret_key
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_github_repository
GIT_BRANCH=main
GITHUB_PERSONAL_ACCESS_TOKEN=your_personal_access_token
LOCAL_POSTGRES_URL=postgres://postgres:password@localhost:5433/ecommerce
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

## Deployment
Deploy to Vercel:
```bash
npm run deploy
```

## Project Structure
```
apps/
  backend/   # Express API, migrations, seed scripts, TinaCMS config
  frontend/  # React/Vite app with TinaCMS integration
e2e/          # Playwright end-to-end tests
docker-compose.yml
drizzle.config.json
playwright.config.js
tsconfig.base.json
tsconfig.json
vite.config.js
```

## Contributing
Contributions are welcome! Please fork the project, create a feature branch, and submit a pull request.

## Security
- JWT tokens are stored in `sessionStorage`; consider using HTTP-only cookies in production.
- Keep secrets (`JWT_SECRET`, `STRIPE_SECRET_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`) secure.

## License
This project is private.
