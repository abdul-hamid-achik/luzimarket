# LUZIMARKET
This is an e-commerce platform combining a React frontend with a Node.js/TypeScript backend (Express, Drizzle ORM, Zod, PostgreSQL).

## Setup

1. Clone the repo and install all dependencies across workspaces:
   ```bash
   npm install          # installs dependencies for both frontend and backend
   ```

2. Start both frontend and backend in development:
   ```bash
   npm run dev          # runs frontend and backend concurrently
   ```

3. (Optional) Launch only one side:
   ```bash
   npm run dev:frontend   # Frontend only (apps/frontend)
   npm run dev:backend    # Backend only (apps/backend)
   ```

4. (Optional) Build or preview the web application:
   ```bash
   npm run build:frontend   # Builds frontend under apps/frontend/
   npm run preview:frontend # Previews built frontend
   ```

5. Database migrations (backend only):
   ```bash
   npm run migrate:up                 # Apply pending migrations
   npm run migrate:down               # Roll back last migration
   npm run migrate:generate -- <name> # Scaffold a new migration file
   ```

6. Seed the backend database:
   ```bash
   npm run seed:backend               # Runs migrations then seed script in apps/backend/
   ```

The frontend will be available at http://localhost:5173 and the backend API at http://localhost:5000.

## API Documentation

Visit http://localhost:5000/api/docs for Swagger/OpenAPI docs.

## Running Tests

### Backend Unit & Integration Tests

We use Jest and Supertest to validate API endpoints in the backend.

```bash
npm run test:backend   # runs Jest tests in apps/backend/
```

### End-to-End Tests (Full Stack)

We use Playwright to test the full application stack, including the database, backend, and frontend. Docker Compose will bring up the PostgreSQL database and backend service automatically.

```bash
npm install                # installs dependencies and Playwright browsers
npm run test:frontend      # spins up DB+backend via Docker Compose and runs the E2E suite
```

### Full Test Suite

To run both backend and frontend tests:

```bash
npm test
```

## Security Note

JWT tokens are stored in `sessionStorage` (vs. `localStorage`) to limit persistence to the browser session. For production, consider HTTP-only secure cookies or other strategies to mitigate XSS risks.

## Node.js Version Requirement

This project requires **Node.js v22.8.0 or later** due to a critical UTF-8 encoding bug in earlier v22.x releases. See [nodejs/node#54543](https://github.com/nodejs/node/issues/54543) for details.
