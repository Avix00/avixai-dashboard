import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// OAuth2 client configuration
function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
}

// GET /api/auth/google/login - Redirect to Google OAuth consent screen
export async function GET(request: NextRequest) {
    try {
        // ============================================
        // SECURITY: Rate Limiting (Prevent brute force)
        // ============================================
        const rateLimitResult = checkRateLimit(request, RATE_LIMITS.AUTH);
        if (!rateLimitResult.success) {
            console.warn('Rate limit exceeded for OAuth login');
            return createRateLimitResponse(rateLimitResult);
        }

        // Validate environment variables
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('Missing Google OAuth credentials');
            return NextResponse.json(
                { error: 'Google OAuth non configurato' },
                { status: 500 }
            );
        }

        if (!process.env.NEXT_PUBLIC_APP_URL) {
            console.error('Missing NEXT_PUBLIC_APP_URL');
            return NextResponse.json(
                { error: 'Configurazione URL mancante' },
                { status: 500 }
            );
        }

        // ============================================
        // CRITICAL: Get authenticated user to pass in state
        // ============================================
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('User not authenticated for Google OAuth');
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_required`
            );
        }

        const oauth2Client = getOAuth2Client();

        // Encode user_id in state parameter for callback to identify user
        const stateData = {
            user_id: user.id,
            timestamp: Date.now(),
        };
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

        // Generate the OAuth URL with required scopes
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // CRITICAL: Get refresh_token for offline access
            prompt: 'consent', // Force consent to always get refresh_token
            state, // Pass user_id for callback identification
            scope: [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ],
        });

        // Redirect to Google consent screen
        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('OAuth login error:', error);
        return NextResponse.json(
            { error: 'Errore durante il login Google' },
            { status: 500 }
        );
    }
}

