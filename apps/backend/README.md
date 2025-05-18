# E-commerce Backend

This is a Node.js + TypeScript backend API for the e-commerce platform.

## Features

- SQLite database with Drizzle ORM
- API routes for authentication, categories, products, cart, orders
- Input validation with Zod
- JWT-based authentication
- Payment integration with Stripe
- Swagger docs at `/api/docs`

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   ```
   cd backend
   npm install
   ```
3. Run database migrations:
   ```
   npm run migrate:up
   ```
4. Start in development:
   ```
   npm run dev
   ```
5. Visit Swagger UI at `http://localhost:5000/api/docs`
