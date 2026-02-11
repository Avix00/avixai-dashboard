/**
 * Rate Limiting Utility
 * OWASP Best Practice: Protect against brute force and DoS attacks
 * 
 * Uses sliding window algorithm with in-memory storage.
 * For production with multiple instances, consider Redis.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting
// Key: IP or userId, Value: { count, windowStart }
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.windowStart > windowMs * 2) {
            rateLimitStore.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Optional: Use user ID instead of IP for authenticated routes */
    keyGenerator?: (req: NextRequest) => string;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
}

/**
 * Check rate limit for a request
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig
): RateLimitResult {
    const { limit, windowMs, keyGenerator } = config;

    // Generate key: use custom generator or fall back to IP
    const key = keyGenerator
        ? keyGenerator(request)
        : getClientIP(request);

    const now = Date.now();

    // Cleanup old entries periodically
    cleanupExpiredEntries(windowMs);

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        // New window
        entry = { count: 1, windowStart: now };
        rateLimitStore.set(key, entry);

        return {
            success: true,
            limit,
            remaining: limit - 1,
            resetTime: now + windowMs,
        };
    }

    // Within existing window
    entry.count++;

    if (entry.count > limit) {
        return {
            success: false,
            limit,
            remaining: 0,
            resetTime: entry.windowStart + windowMs,
        };
    }

    return {
        success: true,
        limit,
        remaining: limit - entry.count,
        resetTime: entry.windowStart + windowMs,
    };
}

/**
 * Extract client IP from request headers
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: NextRequest): string {
    // Vercel/Cloudflare headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Cloudflare specific
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Real IP header
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback
    return 'unknown';
}

/**
 * Create a 429 Too Many Requests response
 * OWASP: Include Retry-After header for graceful degradation
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
    const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

    return NextResponse.json(
        {
            error: 'Troppe richieste. Riprova più tardi.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfterSeconds,
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSeconds),
                'X-RateLimit-Limit': String(result.limit),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(result.resetTime),
            },
        }
    );
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
    response: NextResponse,
    result: RateLimitResult
): NextResponse {
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));
    return response;
}

// Pre-configured rate limiters for common use cases
export const RATE_LIMITS = {
    /** Auth routes: 10 requests per minute */
    AUTH: { limit: 10, windowMs: 60 * 1000 },

    /** Webhook: 50 requests per minute */
    WEBHOOK: { limit: 50, windowMs: 60 * 1000 },

    /** Tools: 30 requests per minute */
    TOOLS: { limit: 30, windowMs: 60 * 1000 },

    /** Calendar: 60 requests per minute */
    CALENDAR: { limit: 60, windowMs: 60 * 1000 },

    /** Default: 100 requests per minute */
    DEFAULT: { limit: 100, windowMs: 60 * 1000 },
} as const;
