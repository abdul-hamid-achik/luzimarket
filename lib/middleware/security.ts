import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Rate limiting storage (in production, use Redis or a proper cache)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const clientIp = getClientIp(request);
    const key = `${clientIp}:${request.nextUrl.pathname}`;
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
    
    const current = rateLimitStore.get(key);
    
    if (!current) {
      // First request
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }
    
    if (now > current.resetTime) {
      // Window expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        { 
          error: config.message || "Too many requests",
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString(),
          }
        }
      );
    }
    
    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);
    
    return null; // Allow request
  };
}

/**
 * Get client IP address from request
 */
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

/**
 * Security headers middleware
 */
export function securityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://*.vercel-blob.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  return response;
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Sanitize SQL input to prevent injection
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove or escape potentially dangerous characters
    return input
      .replace(/[';\\]/g, '') // Remove semicolons and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove SQL block comments start
      .replace(/\*\//g, '') // Remove SQL block comments end
      .trim();
  }
  
  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string | null {
    if (typeof email !== 'string') return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.toLowerCase().trim();
    
    if (!emailRegex.test(sanitized)) {
      return null;
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return '';
    
    // Remove all non-digit characters except + at the beginning
    return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  }
  
  /**
   * Sanitize text input (general purpose)
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }
  
  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(url: string): string | null {
    if (typeof url !== 'string') return null;
    
    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      
      return parsed.toString();
    } catch {
      return null;
    }
  }
}

/**
 * Request validation middleware
 */
export async function validateRequest(
  request: NextRequest,
  options: {
    maxBodySize?: number;
    allowedMethods?: string[];
    requireAuth?: boolean;
  } = {}
): Promise<NextResponse | null> {
  const { maxBodySize = 1024 * 1024, allowedMethods, requireAuth = false } = options;
  
  // Check HTTP method
  if (allowedMethods && !allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }
  
  // Check content length
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxBodySize) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    );
  }
  
  // Check content type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }
  }
  
  // Basic auth check (you'll need to implement proper auth validation)
  if (requireAuth) {
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return null; // Allow request
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }
  
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    `https://${host}`,
    `http://${host}`, // For development
  ].filter(Boolean);
  
  // Check origin
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: 'CSRF protection: Invalid origin' },
      { status: 403 }
    );
  }
  
  // Check referer as fallback
  if (!origin && referer) {
    const refererUrl = new URL(referer);
    if (!allowedOrigins.some(allowed => allowed && refererUrl.origin === new URL(allowed).origin)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid referer' },
        { status: 403 }
      );
    }
  }
  
  return null; // Allow request
}

/**
 * Audit logging utility
 */
export class AuditLogger {
  static async log(event: {
    action: string;
    userId?: string;
    ip: string;
    userAgent?: string;
    resource?: string;
    details?: Record<string, any>;
    timestamp?: Date;
  }): Promise<void> {
    try {
      const logEntry = {
        ...event,
        timestamp: event.timestamp || new Date(),
        environment: process.env.NODE_ENV,
      };
      
      // In production, you'd send this to a logging service
      console.log('[AUDIT]', JSON.stringify(logEntry));
      
      // TODO: Implement proper audit logging to database or external service
      // await db.insert(auditLogs).values(logEntry);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}