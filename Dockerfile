# Multi-stage build for production
FROM node:22-alpine AS dependencies
# Install Python and build dependencies for native modules
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

FROM node:22-alpine AS builder
# Install Python and build dependencies for native modules
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Set dummy environment variables for build time (not used in production)
ENV DATABASE_URL="postgresql://postgres:password@localhost:5432/luzimarket"
ENV NEXT_PUBLIC_APP_URL="https://luzimarket.shop"
ENV NEXTAUTH_URL="https://luzimarket.shop"
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV STRIPE_SECRET_KEY="dummy-stripe-key"
ENV STRIPE_WEBHOOK_SECRET="dummy-webhook-secret"
ENV RESEND_API_KEY="dummy-resend-key"
ENV EMAIL_FROM="noreply@luzimarket.shop"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]