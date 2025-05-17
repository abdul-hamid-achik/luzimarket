# Codex Project Guidance

## Project Setup

1. Install all dependencies from the project root:
   ```bash
   npm install
   ```
2. Start the required services via Docker but also when run `npm run test:e2e` this will be run:
   ```bash
   docker compose up -d
   ```
   - If Docker is unavailable, backend tests automatically use an in-memory Postgres database provided by **pglite**.
3. Run database migrations for the backend and strapi:
   ```bash
   npm run migrate
   ```
4. Seed the databases for both the backend and Strapi:
   ```bash
   npm run seed
   ```
   This script calls the necesary `./scripts/seed-all.js`

## Testing

- **Backend unit tests** run against pglite when `docker compose` is not running:
  ```bash
  npm run test:backend
  ```
- **Frontend unit tests**:
  ```bash
  npm run test:frontend
  ```
- **End-to-end tests** require the Docker containers to be running and seeded. After performing the steps above, run:
  ```bash
  npm run test:e2e
  ```

The `playwright.config.js` file uses the commands above to spin up the services and seed data automatically when running E2E tests.
