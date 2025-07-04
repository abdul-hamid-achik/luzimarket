import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message?: string // Error message
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitStore {
  increment(key: string): Promise<{ count: number; resetTime: number }>
  decrement(key: string): Promise<void>
  reset(key: string): Promise<void>
}

// In-memory store for development/edge runtime
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  private windowMs: number

  constructor(windowMs: number) {
    this.windowMs = windowMs
  }

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const record = this.store.get(key)
    
    if (!record || now > record.resetTime) {
      const resetTime = now + this.windowMs
      this.store.set(key, { count: 1, resetTime })
      return { count: 1, resetTime }
    }
    
    record.count++
    return { count: record.count, resetTime: record.resetTime }
  }

  async decrement(key: string): Promise<void> {
    const record = this.store.get(key)
    if (record && record.count > 0) {
      record.count--
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Default key generator uses IP address
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  
  const ip = forwardedFor?.split(',')[0].trim() || 
             realIp || 
             cfConnectingIp || 
             'unknown'
  
  return `rate-limit:${ip}`
}

// Rate limiter factory
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = config

  const store = new MemoryStore(windowMs)
  
  // Cleanup expired entries every minute
  if (typeof setInterval !== 'undefined') {
    setInterval(() => store.cleanup(), 60000)
  }

  return {
    async check(req: NextRequest): Promise<{
      success: boolean
      limit: number
      remaining: number
      reset: Date
      message?: string
    }> {
      const key = keyGenerator(req)
      const { count, resetTime } = await store.increment(key)
      
      const limit = max
      const remaining = Math.max(0, limit - count)
      const reset = new Date(resetTime)
      
      if (count > limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset,
          message,
        }
      }
      
      return {
        success: true,
        limit,
        remaining,
        reset,
      }
    },
    
    async reset(req: NextRequest): Promise<void> {
      const key = keyGenerator(req)
      await store.reset(key)
    }
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
  }),
  
  // Auth endpoints: 5 attempts per 15 minutes
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts. Please try again later.',
  }),
  
  // Password reset: 3 attempts per hour
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts. Please try again later.',
  }),
  
  // Stripe webhooks: Higher limit for payment processing
  webhook: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
  }),
}