# Codex Project Guidance

## Project Setup

1. Install all dependencies from the project root:
   ```bash
   npm install
   ```
2. Start the required services via Docker (e.g. CI). When running `npm run test:e2e` this is attempted:
   ```bash
   docker compose up -d
   ```
   - If Docker is unavailable, tests fall back to local processes using **pglite** for the backend and SQLite. This is handled directly in `playwright.config.js`.
3. Run database migrations:
   ```bash
   npm run migrate
   ```
4. Seed the database:
   ```bash
   npm run seed
   ```

## Testing

- **Backend unit tests** run against pglite when `docker compose` is not running:
  ```bash
  npm run test:backend
  ```
- **Frontend unit tests**:
  ```bash
  npm run test:frontend
  ```
- **End-to-end tests** will try to use Docker containers if available. When Docker cannot be started, the tests automatically run against local instances started with pglite and SQLite. Run:
  ```bash
  npm run test:e2e
  ```

The `playwright.config.js` file detects Docker availability and starts the appropriate services before running E2E tests without relying on extra helper scripts.
