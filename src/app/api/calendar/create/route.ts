import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getOAuth2CalendarClient } from '@/lib/google-calendar';
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { sanitizeString } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

// POST /api/calendar/create - Create new calendar event
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResult = checkRateLimit(request, RATE_LIMITS.CALENDAR);
        if (!rateLimitResult.success) {
            console.warn('Rate limit exceeded for calendar create');
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceRoleClient();

        // Get user's OAuth tokens (Filtered by User ID)
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('google_refresh_token, google_calendar_id, calendar_connected')
            .eq('user_id', user.id)
            .single();

        if (settingsError) {
            console.error('Settings fetch error:', settingsError);
            return NextResponse.json({
                error: 'Impostazioni non trovate'
            }, { status: 404 });
        }

        if (!settings?.calendar_connected || !settings?.google_refresh_token) {
            return NextResponse.json({
                error: 'Calendario non connesso. Collegalo nelle Impostazioni.',
                errorCode: 'NOT_CONFIGURED'
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        const { title, start, end, description } = body;

        if (!title || !start || !end) {
            return NextResponse.json(
                { error: 'Campi obbligatori mancanti' },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const safeTitle = sanitizeString(title);
        const safeDescription = description ? sanitizeString(description) : undefined;

        // Create event in Google Calendar
        const calendar = getOAuth2CalendarClient(settings.google_refresh_token);
        const calendarId = settings.google_calendar_id || 'primary';

        const event = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: safeTitle,
                description: safeDescription,
                start: {
                    dateTime: new Date(start).toISOString(),
                    timeZone: 'Europe/Rome',
                },
                end: {
                    dateTime: new Date(end).toISOString(),
                    timeZone: 'Europe/Rome',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 30 },
                    ],
                },
            },
        });

        if (!event.data.id) {
            throw new Error('Failed to create event');
        }

        // Return created event
        return NextResponse.json({
            success: true,
            event: {
                id: event.data.id,
                googleEventId: event.data.id,
                title: event.data.summary || safeTitle,
                start: new Date(event.data.start?.dateTime || start),
                end: new Date(event.data.end?.dateTime || end),
                description: event.data.description || safeDescription,
                isAvixBooking: false,
            }
        });

    } catch (error) {
        console.error('Calendar create error:', error);
        return NextResponse.json({
            error: 'Errore nella creazione dell\'evento'
        }, { status: 500 });
    }
}
