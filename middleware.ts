import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing)

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    return response
  }
  
  // Handle __nextjs_original-stack-frames endpoint
  if (request.nextUrl.pathname === '/__nextjs_original-stack-frames') {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
  
  // Handle internationalization for all other routes
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, assets, etc)
    '/((?!_next|_vercel|.*\\..*|api/health).*)',
    // Include API routes for CORS handling
    '/api/:path*'
  ]
}