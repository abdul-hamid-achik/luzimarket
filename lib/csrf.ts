import { NextRequest } from 'next/server'
import crypto from 'crypto'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_FIELD_NAME = 'csrfToken'

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Generate a cryptographically secure random token
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

// Extract CSRF token from request
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) return headerToken

  // Check body for form submissions
  // Note: This requires parsing the body which can only be done once
  // In a real implementation, you'd need to handle this carefully
  
  return null
}

// Get CSRF token from cookie
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  const cookieValue = request.cookies.get(CSRF_COOKIE_NAME)?.value
  return cookieValue || null
}

// Verify CSRF token
export function verifyCsrfToken(token: string | null, cookieToken: string | null): boolean {
  if (!token || !cookieToken) return false
  
  // Use timing-safe comparison to prevent timing attacks
  if (token.length !== cookieToken.length) return false
  
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(cookieToken)
  )
}

// Check if request should be protected by CSRF
export function shouldProtectRequest(request: NextRequest): boolean {
  // Skip CSRF for safe methods
  if (!PROTECTED_METHODS.includes(request.method)) {
    return false
  }

  const pathname = request.nextUrl.pathname

  // Skip CSRF for API routes that are webhooks
  if (pathname.startsWith('/api/webhooks/')) {
    return false
  }

  // Skip CSRF for public API endpoints (if any)
  const publicApiPaths = [
    '/api/search',
    '/api/products',
    '/api/categories',
  ]
  
  if (publicApiPaths.some(path => pathname.startsWith(path)) && request.method === 'GET') {
    return false
  }

  // Protect all other state-changing requests
  return true
}

// Main CSRF protection function
export async function checkCsrfProtection(request: NextRequest): Promise<{
  valid: boolean
  newToken?: string
  error?: string
}> {
  // Check if this request needs CSRF protection
  if (!shouldProtectRequest(request)) {
    return { valid: true }
  }

  // Get tokens
  const requestToken = getCsrfTokenFromRequest(request)
  const cookieToken = getCsrfTokenFromCookie(request)

  // For GET requests or if no cookie token exists, generate a new one
  if (!cookieToken && request.method === 'GET') {
    return {
      valid: true,
      newToken: generateCsrfToken(),
    }
  }

  // Verify tokens match
  if (!verifyCsrfToken(requestToken, cookieToken)) {
    return {
      valid: false,
      error: 'Invalid or missing CSRF token',
    }
  }

  return { valid: true }
}

// Helper to create CSRF cookie options
export function getCsrfCookieOptions() {
  return {
    name: CSRF_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  }
}

// Helper to inject CSRF token into forms (for server-side rendering)
export function injectCsrfToken(html: string, token: string): string {
  // This is a simple implementation - in production you'd want something more robust
  const metaTag = `<meta name="csrf-token" content="${token}">`
  const inputField = `<input type="hidden" name="${CSRF_FIELD_NAME}" value="${token}">`
  
  // Add meta tag to head
  html = html.replace('</head>', `${metaTag}</head>`)
  
  // Add hidden input to forms
  html = html.replace(/<form/g, (match) => {
    return `${match}>${inputField}<`
  })
  
  return html
}

// Client-side helper to get CSRF token (for use in components)
export function getClientCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  
  // Try to get from meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  if (metaTag) {
    return metaTag.getAttribute('content')
  }
  
  // Try to get from cookie (if not httpOnly)
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_COOKIE_NAME) {
      return value
    }
  }
  
  return null
}