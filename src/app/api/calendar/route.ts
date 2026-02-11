import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
    fetchCalendarEventsRobust,
    updateStoredAccessToken,
    extractPhoneFromEvent,
    isAvixBooking,
    getAttendeeName,
    getAttendeeEmail
} from '@/lib/google-calendar';
import { CalendarEvent } from '@/lib/supabase/types';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// Error message mapping for Italian UI
const ERROR_MESSAGES: Record<string, string> = {
    OAUTH_TOKEN_REVOKED: 'Token scaduto o revocato. Ricollega il calendario nelle Impostazioni.',
    INSUFFICIENT_PERMISSIONS: 'Permessi insufficienti. Ricollega il calendario con tutti i permessi richiesti.',
    CALENDAR_NOT_FOUND: 'Calendario non trovato. Verifica l\'ID nelle Impostazioni.',
    CALENDAR_FETCH_ERROR: 'Errore nel recupero degli eventi. Riprova più tardi.',
    NOT_CONFIGURED: 'Collega il tuo Google Calendar nelle Impostazioni.',
    MISSING_CREDENTIALS: 'Credenziali Google OAuth non configurate sul server.',
    SETTINGS_NOT_FOUND: 'Impostazioni non trovate.',
};

export async function GET(request: NextRequest) {
    try {
        // ============================================
        // SECURITY: Rate Limiting
        // ============================================
        const rateLimitResult = checkRateLimit(request, RATE_LIMITS.CALENDAR);
        if (!rateLimitResult.success) {
            console.warn('Rate limit exceeded for calendar fetch');
            return createRateLimitResponse(rateLimitResult);
        }

        // 1. Get Authenticated User using @supabase/ssr
        const cookieStore = await cookies();
        const authSupabase = createServerClient(
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

        const { data: { user }, error: userError } = await authSupabase.auth.getUser();

        if (userError || !user) {
            console.error('Auth error:', userError);
            return NextResponse.json({
                events: [],
                error: 'Unauthorized',
                errorCode: 'UNAUTHORIZED'
            }, { status: 401 });
        }

        // Use Service Role to fetch settings (bypasses RLS) but filter by user.id
        const supabase = createServiceRoleClient();

        // 2. Get User Settings (Filtered by user.id)
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('id, google_refresh_token, google_access_token, google_calendar_id, calendar_connected')
            .eq('user_id', user.id)
            .single();

        if (settingsError) {
            console.error('Settings fetch error:', settingsError);
            return NextResponse.json({
                events: [],
                error: ERROR_MESSAGES.SETTINGS_NOT_FOUND,
                errorCode: 'SETTINGS_NOT_FOUND'
            });
        }

        // Check if calendar is connected
        if (!settings?.calendar_connected || !settings?.google_refresh_token) {
            return NextResponse.json({
                events: [],
                error: ERROR_MESSAGES.NOT_CONFIGURED,
                errorCode: 'NOT_CONFIGURED'
            });
        }

        // Check if Google OAuth is configured
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({
                events: [],
                error: ERROR_MESSAGES.MISSING_CREDENTIALS,
                errorCode: 'MISSING_CREDENTIALS'
            });
        }

        // Get time range from query params or default to current month
        const searchParams = request.nextUrl.searchParams;
        const timeMin = searchParams.get('timeMin') || new Date().toISOString();
        const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch events with robust token handling
        const googleEvents = await fetchCalendarEventsRobust({
            refreshToken: settings.google_refresh_token,
            accessToken: settings.google_access_token,
            calendarId: 'primary', // Force 'primary' to avoid ID mismatch issues
            timeMin,
            timeMax,
            onTokenRefresh: async (newAccessToken) => {
                await updateStoredAccessToken(settings.id, newAccessToken);
            },
        });

        // Get all calls for matching (Filtered by User ID)
        const { data: calls } = await supabase
            .from('calls')
            .select('id, customer_number, summary, sentiment, recording_url, duration, created_at, transcript, transcript_json')
            .eq('user_id', user.id);

        // Transform and enrich events
        const enrichedEvents: CalendarEvent[] = googleEvents.map((event) => {
            const phone = extractPhoneFromEvent(event);
            const email = getAttendeeEmail(event);

            let matchedCall = null;
            if (phone && calls) {
                matchedCall = calls.find(c =>
                    c.customer_number &&
                    (c.customer_number.includes(phone) || phone.includes(c.customer_number.replace(/\D/g, '')))
                );
            }

            if (!matchedCall && email && calls) {
                matchedCall = calls.find(c =>
                    c.summary?.toLowerCase().includes(email.toLowerCase())
                );
            }

            const startDate = event.start?.dateTime || event.start?.date;
            const endDate = event.end?.dateTime || event.end?.date;

            return {
                id: event.id || '',
                googleEventId: event.id || '',
                title: event.summary || 'Evento',
                start: new Date(startDate || new Date()),
                end: new Date(endDate || new Date()),
                attendeeName: getAttendeeName(event),
                attendeeEmail: email || undefined,
                attendeePhone: phone || undefined,
                description: event.description || undefined,
                isAvixBooking: isAvixBooking(event),
                call_id: matchedCall?.id,
                call_summary: matchedCall?.summary || undefined,
                call_sentiment: matchedCall?.sentiment,
                call_recording_url: matchedCall?.recording_url || undefined,
                call_duration: matchedCall?.duration,
                call_transcript: matchedCall?.transcript || undefined,
                call_transcript_json: matchedCall?.transcript_json || undefined,
            };
        });

        // Add rate limit headers to successful response
        const response = NextResponse.json({
            events: enrichedEvents,
            count: enrichedEvents.length
        });

        return addRateLimitHeaders(response, rateLimitResult);

    } catch (error) {
        console.error('Calendar API error:', error);

        const errorMessage = error instanceof Error ? error.message : 'CALENDAR_FETCH_ERROR';
        const userMessage = ERROR_MESSAGES[errorMessage] || ERROR_MESSAGES.CALENDAR_FETCH_ERROR;

        let status = 500;
        if (errorMessage === 'OAUTH_TOKEN_REVOKED') status = 401;
        if (errorMessage === 'INSUFFICIENT_PERMISSIONS') status = 403;
        if (errorMessage === 'CALENDAR_NOT_FOUND') status = 404;

        return NextResponse.json({
            events: [],
            error: userMessage,
            errorCode: errorMessage
        }, { status });
    }
}
