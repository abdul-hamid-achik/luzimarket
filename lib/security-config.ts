// Security configuration for the application

// Allowed origins for CORS
export const getAllowedOrigins = (): string[] => {
  const origins: string[] = []

  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '3000'
    origins.push(
      `http://localhost:${port}`,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3005',
      `http://127.0.0.1:${port}`,
      'http://127.0.0.1:3000'
    )
  }

  // Production origins
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL)
  }

  // Vercel preview URLs
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }

  // Add your production domains
  origins.push(
    'https://luzimarket.shop',
    'https://www.luzimarket.shop',
    'https://luzimarket.vercel.app'
  )

  // Remove duplicates
  return [...new Set(origins)]
}

// Rate limit configurations by endpoint type
export const rateLimitConfigs = {
  // API endpoints
  '/api/': {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },

  // Authentication endpoints - reasonable limits for auth flows
  '/api/auth/': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per 5 minutes (allows for normal auth flows)
  },

  // Search endpoint - higher limit for autocomplete
  '/api/search': {
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute
  },

  // Vendor registration - prevent spam
  '/api/vendor/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
  },

  // Stripe webhooks - higher limit
  '/api/webhooks/stripe': {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
  },

  // Review submission - prevent review spam
  '/api/reviews': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 reviews per hour
  },
}

// Paths that should skip CSRF protection
export const csrfExcludePaths = [
  '/api/webhooks/', // Webhooks can't send CSRF tokens
  '/api/health', // Health check endpoint
  '/api/auth/', // All NextAuth endpoints need to skip CSRF protection
]

// Security headers to add to responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Content Security Policy
export const getContentSecurityPolicy = (): string => {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://vercel.live wss://ws.vercel.live https://*.vercel-insights.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}