import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { rateLimiters, createRateLimiter } from '@/lib/rate-limit'
import { checkCsrfProtection, getCsrfCookieOptions, generateCsrfToken } from '@/lib/csrf'
import {
  getAllowedOrigins,
  rateLimitConfigs,
  csrfExcludePaths,
  securityHeaders,
  getContentSecurityPolicy
} from '@/lib/security-config'
// Remove direct import of server actions that use database

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing)

// Get appropriate rate limiter for the path
function getRateLimiter(pathname: string) {
  // Check for specific path configurations
  for (const [path, config] of Object.entries(rateLimitConfigs)) {
    if (pathname.startsWith(path)) {
      return createRateLimiter(config)
    }
  }

  // Default to general API rate limiter
  if (pathname.startsWith('/api/auth/')) {
    return rateLimiters.auth
  } else if (pathname.startsWith('/api/')) {
    return rateLimiters.api
  }

  return null
}

// Check if origin is allowed
function isAllowedOrigin(origin: string | null): boolean {
  // Allow null origin in development/testing (e.g., file:// or direct access)
  if (!origin && (process.env.NODE_ENV === 'development' || process.env.PLAYWRIGHT_TEST === 'true')) return true
  if (!origin) return false
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin)
}

// Apply security headers to response
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', getContentSecurityPolicy())
  }

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Bypass middleware for static assets and public files explicitly
  // This avoids locale/rate/csrf logic interfering with images and other assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images/') ||
    pathname === '/favicon.ico' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Track session activity for authenticated users (non-blocking)
  // Note: Session activity tracking moved to a client-side approach or API route
  // to avoid importing database functions in Edge Runtime middleware

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    try {
      const response = NextResponse.next()

      // Apply security headers
      applySecurityHeaders(response)

      // Configure CORS
      const origin = request.headers.get('origin')

      if (isAllowedOrigin(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      } else if (process.env.NODE_ENV === 'development') {
        // In development, be more permissive but only log warning for non-null origins
        // Skip warning during tests to reduce noise
        if (origin !== null) {
          console.warn(`CORS request from unauthorized origin: ${origin}`)
        }

        response.headers.set('Access-Control-Allow-Origin', origin || '*')
      }

      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token')

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: response.headers })
      }

      // Apply rate limiting
      const rateLimiter = getRateLimiter(pathname)
      if (rateLimiter) {
        const { success, limit, remaining, reset, message } = await rateLimiter.check(request)

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', limit.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', reset.toISOString())

        if (!success) {
          return new Response(JSON.stringify({ error: message }), {
            status: 429,
            headers: {
              ...Object.fromEntries(response.headers),
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString(),
            },
          })
        }
      }

      // Apply CSRF protection
      const shouldCheckCsrf = !csrfExcludePaths.some(path => pathname.startsWith(path))
      if (shouldCheckCsrf) {
        try {
          const csrfResult = await checkCsrfProtection(request)

          if (!csrfResult.valid) {
            console.log('[Middleware] CSRF check failed for:', pathname);
            return new Response(JSON.stringify({ error: csrfResult.error }), {
              status: 403,
              headers: {
                ...Object.fromEntries(response.headers),
                'Content-Type': 'application/json',
              },
            })
          }

          // Set new CSRF token if needed
          if (csrfResult.newToken) {
            const cookieOptions = getCsrfCookieOptions()
            response.cookies.set(cookieOptions.name, csrfResult.newToken, cookieOptions)
          }
        } catch (csrfError) {
          console.error('[Middleware] CSRF check threw error:', csrfError);
          // Don't block request if CSRF check fails
          // Return JSON error instead of letting it throw
          return new Response(JSON.stringify({ error: 'CSRF check failed' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }
      }

      return response
    } catch (middlewareError) {
      console.error('[Middleware] Error handling API route:', pathname, middlewareError);
      // Return JSON error instead of letting Next.js render HTML error page
      return new Response(JSON.stringify({
        error: 'Internal server error in middleware',
        details: middlewareError instanceof Error ? middlewareError.message : String(middlewareError)
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  }

  // Handle __nextjs_original-stack-frames endpoint
  if (pathname === '/__nextjs_original-stack-frames') {
    const response = NextResponse.next()
    const origin = request.headers.get('origin')

    if (process.env.NODE_ENV === 'development' && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    return response
  }

  // For non-API routes, ensure CSRF token is set
  const response = intlMiddleware(request)

  // Apply security headers to all responses
  applySecurityHeaders(response)

  // Set CSRF token for page requests
  if (request.method === 'GET' && !request.cookies.get(getCsrfCookieOptions().name)) {
    const token = generateCsrfToken()
    const cookieOptions = getCsrfCookieOptions()
    response.cookies.set(cookieOptions.name, token, cookieOptions)
  }

  return response
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, assets, etc)
    '/((?!_next|_vercel|api/health|images/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|otf|ttf|woff|woff2)).*)',
    // Include API routes for security handling
    '/api/:path*'
  ]
}