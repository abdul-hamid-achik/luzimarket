import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { 
  rateLimit, 
  securityHeaders, 
  validateRequest, 
  csrfProtection,
  AuditLogger
} from '@/lib/middleware/security';

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Rate limiting configurations for different endpoints (Mexican market)
const rateLimitConfigs = {
  '/api/auth': { windowMs: 15 * 60 * 1000, maxRequests: 5, message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.' },
  '/api/checkout': { windowMs: 60 * 1000, maxRequests: 3, message: 'Demasiados intentos de compra. Intenta de nuevo en un minuto.' },
  '/api/newsletter': { windowMs: 60 * 1000, maxRequests: 2, message: 'Demasiadas suscripciones. Intenta de nuevo en un minuto.' },
  '/api/reviews': { windowMs: 60 * 1000, maxRequests: 10, message: 'Demasiadas reseñas. Intenta de nuevo en un minuto.' },
  '/api/vendor': { windowMs: 60 * 1000, maxRequests: 30, message: 'Demasiadas solicitudes de vendedor. Intenta de nuevo en un minuto.' },
  '/api': { windowMs: 60 * 1000, maxRequests: 100, message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_') ||
    pathname.includes('.') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/trpc')
  ) {
    return intlMiddleware(request);
  }

  // Apply security measures for API routes
  if (pathname.startsWith('/api')) {
    // CSRF Protection
    const csrfResponse = csrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Rate Limiting
    const rateLimitConfig = Object.entries(rateLimitConfigs)
      .find(([path]) => pathname.startsWith(path))?.[1] || 
      rateLimitConfigs['/api'];
    
    const rateLimitMiddleware = rateLimit(rateLimitConfig);
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      // Log rate limit violation
      await AuditLogger.log({
        action: 'RATE_LIMIT_EXCEEDED',
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || '',
        resource: pathname,
        details: { 
          method: request.method,
          rateLimitConfig 
        }
      });
      return rateLimitResponse;
    }

    // Request Validation
    const validationOptions = {
      maxBodySize: pathname.includes('/upload') ? 10 * 1024 * 1024 : 1024 * 1024, // 10MB for uploads, 1MB for others
      allowedMethods: getMethodsForPath(pathname),
      requireAuth: pathname.startsWith('/api/vendor') || pathname.startsWith('/api/admin'),
    };

    const validationResponse = await validateRequest(request, validationOptions);
    if (validationResponse) {
      return validationResponse;
    }

    // Audit logging for sensitive operations
    if (shouldAuditPath(pathname)) {
      await AuditLogger.log({
        action: 'API_REQUEST',
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || '',
        resource: pathname,
        details: { 
          method: request.method,
          timestamp: new Date()
        }
      });
    }
  }

  // Apply i18n middleware for non-admin/vendor routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/vendor')) {
    const response = intlMiddleware(request);
    
    // Apply security headers to all responses
    if (response instanceof NextResponse) {
      return securityHeaders(response);
    }
  }
  
  // Create new response with security headers for admin/vendor routes
  const newResponse = NextResponse.next();
  return securityHeaders(newResponse);
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cf = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  if (cf) {
    return cf;
  }
  
  return (request as any).ip || 'unknown';
}

function getMethodsForPath(pathname: string): string[] {
  if (pathname.includes('/auth')) {
    return ['POST'];
  }
  if (pathname.includes('/checkout')) {
    return ['POST'];
  }
  if (pathname.includes('/newsletter')) {
    return ['POST'];
  }
  if (pathname.includes('/reviews')) {
    return ['GET', 'POST', 'PATCH', 'DELETE'];
  }
  if (pathname.includes('/vendor') || pathname.includes('/admin')) {
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  }
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
}

function shouldAuditPath(pathname: string): boolean {
  const auditPaths = [
    '/api/auth',
    '/api/checkout',
    '/api/vendor',
    '/api/admin',
    '/api/webhooks'
  ];
  
  return auditPaths.some(path => pathname.startsWith(path));
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!trpc|_next|_vercel|.*\\..*).*)', '/']
};