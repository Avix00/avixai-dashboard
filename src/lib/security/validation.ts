/**
 * Input Validation & Sanitization Utilities
 * OWASP Best Practice: Validate all inputs, sanitize outputs
 * 
 * Uses Zod for schema-based validation with strict type checking.
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

/**
 * ISO Date string validation (YYYY-MM-DD)
 * Rejects dates in the past for booking purposes
 */
export const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (usa YYYY-MM-DD)')
    .refine((date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
    }, 'Data non valida')
    .refine((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(date);
        return inputDate >= today;
    }, 'La data non può essere nel passato');

/**
 * Time string validation (HH:MM, 24h format)
 * Validates business hours (08:00 - 20:00)
 */
export const timeSchema = z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato orario non valido (usa HH:MM)')
    .refine((time) => {
        const [hours] = time.split(':').map(Number);
        return hours >= 8 && hours < 20;
    }, 'Orario fuori dall\'orario di lavoro (08:00-20:00)');

/**
 * Italian phone number validation
 * Accepts: +39..., 3..., 0... formats
 */
export const phoneSchema = z.string()
    .min(8, 'Numero di telefono troppo corto')
    .max(20, 'Numero di telefono troppo lungo')
    .regex(
        /^(\+39\s?)?[03]\d{2}[\s.-]?\d{6,8}$/,
        'Formato numero di telefono non valido'
    );

/**
 * Customer name validation
 * Prevents XSS by rejecting HTML tags
 */
export const nameSchema = z.string()
    .min(2, 'Nome troppo corto')
    .max(100, 'Nome troppo lungo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contiene caratteri non validi')
    .transform((name) => sanitizeString(name));

/**
 * UUID validation (for Supabase IDs)
 */
export const uuidSchema = z.string()
    .uuid('ID non valido');

/**
 * Google Calendar Event ID validation
 * Alphanumeric with some special chars, max 256
 */
export const eventIdSchema = z.string()
    .min(1, 'ID evento mancante')
    .max(256, 'ID evento troppo lungo')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID evento non valido');

/**
 * Email validation
 */
export const emailSchema = z.string()
    .email('Email non valida')
    .max(254, 'Email troppo lunga');


// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Remove HTML tags and dangerous characters
 * OWASP: Prevent XSS attacks
 */
export function sanitizeString(input: string): string {
    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script-related patterns
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        // Trim whitespace
        .trim();
}

/**
 * Sanitize and limit string length
 */
export function sanitizeAndLimit(input: string, maxLength: number): string {
    return sanitizeString(input).slice(0, maxLength);
}

/**
 * Normalize phone number (remove formatting)
 */
export function normalizePhone(phone: string): string {
    return phone.replace(/[\s.-]/g, '');
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and parse input with Zod schema
 * Returns typed result or error details
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format error message from Zod issues
    const errorMessage = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

    return { success: false, error: errorMessage };
}

/**
 * Check payload size limit
 * OWASP: Prevent resource exhaustion attacks
 */
export async function checkPayloadSize(
    request: Request,
    maxSizeBytes: number = 100 * 1024 // 100KB default
): Promise<{ valid: boolean; size: number }> {
    const contentLength = request.headers.get('content-length');

    if (contentLength) {
        const size = parseInt(contentLength, 10);
        return { valid: size <= maxSizeBytes, size };
    }

    // If no content-length, we'll check after parsing
    return { valid: true, size: 0 };
}

// ============================================
// SECURITY ERROR RESPONSES
// ============================================

export const SECURITY_ERRORS = {
    INVALID_INPUT: {
        code: 'INVALID_INPUT',
        status: 400,
        message: 'Input non valido',
    },
    PAYLOAD_TOO_LARGE: {
        code: 'PAYLOAD_TOO_LARGE',
        status: 413,
        message: 'Payload troppo grande',
    },
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'Non autorizzato',
    },
    FORBIDDEN: {
        code: 'FORBIDDEN',
        status: 403,
        message: 'Accesso negato',
    },
} as const;
