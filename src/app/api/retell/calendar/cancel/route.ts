import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getOAuth2CalendarClient, updateStoredAccessToken, fetchCalendarEventsRobust, extractPhoneFromEvent } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Multi-Tenant Context
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log(`[Retell Cancel] Request received. UserId: ${userId}`);

    if (!userId) {
        return NextResponse.json(
            { error: "Configuration Error", message: "Missing userId in Webhook URL." },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        const { phone_number } = body;

        if (!phone_number) {
            return NextResponse.json({ result: "Error: Missing phone number." });
        }

        const searchPhone = phone_number.replace(/\s/g, '');

        // 2. Get Credentials
        const supabase = createServiceRoleClient();
        const { data: settings } = await supabase
            .from('settings')
            .select('id, google_refresh_token, google_access_token, google_calendar_id')
            .eq('user_id', userId)
            .single();

        if (!settings?.google_refresh_token) {
            return NextResponse.json({ result: "Error: Calendar not connected." });
        }

        const refreshToken = settings.google_refresh_token;
        const calendarId = (settings.google_calendar_id || 'primary').trim();

        // 3. Find Future Events
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 60);

        const events = await fetchCalendarEventsRobust({
            refreshToken: refreshToken,
            accessToken: settings.google_access_token || undefined,
            calendarId: calendarId,
            timeMin: now.toISOString(),
            timeMax: future.toISOString(),
            onTokenRefresh: settings.id ? async (newAccessToken) => {
                await updateStoredAccessToken(settings.id, newAccessToken);
            } : undefined,
        });

        // 4. Find User Event
        const userEvent = events.find(event => {
            if (!event.id) return false;
            const extracted = extractPhoneFromEvent({ description: event.description });
            if (extracted && extracted.includes(searchPhone)) return true;
            const rawText = (event.summary + (event.description || '')).replace(/\s/g, '');
            return rawText.includes(searchPhone);
        });

        if (!userEvent || !userEvent.id) {
            return NextResponse.json({ result: "Error: No appointment found for this number." });
        }

        // 5. Delete Event
        const calendar = getOAuth2CalendarClient(refreshToken);
        await calendar.events.delete({
            calendarId,
            eventId: userEvent.id,
        });

        console.log(`[Retell Cancel] Success. Deleted ID: ${userEvent.id}`);
        return NextResponse.json({
            result: "Success: Appointment cancelled."
        });

    } catch (error) {
        console.error('[Retell Cancel] Error:', error);
        return NextResponse.json({ result: "Error cancelling appointment." });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Api-Version',
        },
    });
}
