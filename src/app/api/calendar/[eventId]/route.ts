import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getOAuth2CalendarClient } from '@/lib/google-calendar';
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { eventIdSchema, validateInput, sanitizeString, SECURITY_ERRORS } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

// Helper function to get authenticated user
async function getAuthenticatedUser() {
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
    return authSupabase.auth.getUser();
}

// DELETE /api/calendar/[eventId] - Delete event from Google Calendar
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        // ============================================
        // SECURITY: Rate Limiting
        // ============================================
        const rateLimitResult = checkRateLimit(request, RATE_LIMITS.CALENDAR);
        if (!rateLimitResult.success) {
            console.warn('Rate limit exceeded for calendar delete');
            return createRateLimitResponse(rateLimitResult);
        }

        const { eventId } = await params;

        // ============================================
        // SECURITY: Validate eventId format
        // ============================================
        const validation = validateInput(eventIdSchema, eventId);
        if (!validation.success) {
            console.warn('Invalid eventId format:', validation.error);
            return NextResponse.json(
                { error: SECURITY_ERRORS.INVALID_INPUT.message },
                { status: SECURITY_ERRORS.INVALID_INPUT.status }
            );
        }

        // 1. Get Authenticated User
        const { data: { user }, error: userError } = await getAuthenticatedUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceRoleClient();

        // Get OAuth tokens and calendar settings (Filtered by User ID)
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('google_refresh_token, google_calendar_id, calendar_connected')
            .eq('user_id', user.id)
            .single();

        if (settingsError || !settings?.calendar_connected || !settings?.google_refresh_token) {
            return NextResponse.json({
                error: 'Calendario non connesso'
            }, { status: 400 });
        }

        // Check Google credentials
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({
                error: 'Credenziali Google OAuth non configurate'
            }, { status: 500 });
        }

        const calendar = getOAuth2CalendarClient(settings.google_refresh_token);
        const calendarId = settings.google_calendar_id || 'primary';

        // Delete the event
        await calendar.events.delete({
            calendarId,
            eventId: validation.data,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json({
            error: 'Errore nella cancellazione dell\'evento'
        }, { status: 500 });
    }
}

// PATCH /api/calendar/[eventId] - Update event in Google Calendar
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        // Rate limiting
        const rateLimitResult = checkRateLimit(request, RATE_LIMITS.CALENDAR);
        if (!rateLimitResult.success) {
            console.warn('Rate limit exceeded for calendar update');
            return createRateLimitResponse(rateLimitResult);
        }

        const { eventId } = await params;

        // Validate eventId
        const validation = validateInput(eventIdSchema, eventId);
        if (!validation.success) {
            console.warn('Invalid eventId format:', validation.error);
            return NextResponse.json(
                { error: SECURITY_ERRORS.INVALID_INPUT.message },
                { status: SECURITY_ERRORS.INVALID_INPUT.status }
            );
        }

        // 1. Get Authenticated User
        const { data: { user }, error: userError } = await getAuthenticatedUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServiceRoleClient();

        // Get OAuth tokens (Filtered by User ID)
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('google_refresh_token, google_calendar_id, calendar_connected')
            .eq('user_id', user.id)
            .single();

        if (settingsError || !settings?.calendar_connected || !settings?.google_refresh_token) {
            return NextResponse.json({
                error: 'Calendario non connesso'
            }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        const { title, start, end, description } = body;

        // Sanitize inputs
        const safeTitle = title ? sanitizeString(title) : undefined;
        const safeDescription = description ? sanitizeString(description) : undefined;

        const calendar = getOAuth2CalendarClient(settings.google_refresh_token);
        const calendarId = settings.google_calendar_id || 'primary';

        // Build update payload
        const updatePayload: Record<string, unknown> = {};
        if (safeTitle) updatePayload.summary = safeTitle;
        if (safeDescription !== undefined) updatePayload.description = safeDescription;
        if (start) {
            updatePayload.start = {
                dateTime: new Date(start).toISOString(),
                timeZone: 'Europe/Rome',
            };
        }
        if (end) {
            updatePayload.end = {
                dateTime: new Date(end).toISOString(),
                timeZone: 'Europe/Rome',
            };
        }

        // Update the event
        const updatedEvent = await calendar.events.patch({
            calendarId,
            eventId: validation.data,
            requestBody: updatePayload,
        });

        return NextResponse.json({
            success: true,
            event: {
                id: updatedEvent.data.id,
                title: updatedEvent.data.summary,
                start: updatedEvent.data.start?.dateTime,
                end: updatedEvent.data.end?.dateTime,
                description: updatedEvent.data.description,
            }
        });

    } catch (error) {
        console.error('Update event error:', error);
        return NextResponse.json({
            error: 'Errore nell\'aggiornamento dell\'evento'
        }, { status: 500 });
    }
}
