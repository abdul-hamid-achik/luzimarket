# Codex Project Guidance

This file provides additional instructions for working with this repository through Codex.

## How Codex Reads Instructions

Codex will look for `AGENTS.md` files in the following locations and merge them from general to specific:

1. `~/.codex/AGENTS.md`
2. `AGENTS.md` at the repository root (this file)
3. `AGENTS.md` in subfolders

To disable these instructions, run Codex with `--no-project-doc` or set `CODEX_DISABLE_PROJECT_DOC=1`.

## Project Setup

1. Install all dependencies from the project root:
   ```bash
   npm install
   ```
2. Start the required services via Docker:
   ```bash
   docker compose up -d
   ```
   - If Docker is unavailable, backend tests automatically use an in-memory Postgres database provided by **pglite**.
3. Run database migrations for the backend:
   ```bash
   npm run migrate:up
   ```
4. Seed the databases for both the backend and Strapi:
   ```bash
   npm run seed
   ```
   This script calls `seed:backend` and `seed:strapi` as needed.

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
