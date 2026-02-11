import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchCalendarEventsRobust } from '@/lib/google-calendar';
import { generateDaySlots, isSlotFree, parseDateToRome, TIMEZONE } from '@/lib/calendar-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Multi-Tenant Context (Get userId from Query Params)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log(`[Retell Check] Request received. UserId: ${userId}`);

    if (!userId) {
        return NextResponse.json(
            { error: "Configuration Error", message: "Missing userId in Webhook URL. Please add ?userId=..." },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        console.log('[Retell Check] Body:', JSON.stringify(body));

        // Retell/LLM might send 'date', 'query', 'when', or 'start_date'
        const rawDate = body.date || body.query || body.when || body.start_date;
        const dateStr = rawDate || (new Date()).toISOString();

        // 2. Get Credentials for THIS specific user
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: settings, error } = await supabase
            .from('settings')
            .select('id, google_refresh_token, google_access_token, google_calendar_id, office_hours_start, office_hours_end')
            .eq('user_id', userId)
            .single();

        if (error || !settings) {
            console.error('[Retell Check] Settings not found for user:', userId);
            return NextResponse.json({ result: "Error: User settings not found. Calendar not connected." });
        }

        const rawRefreshToken = settings.google_refresh_token;
        const refreshToken = rawRefreshToken?.trim();
        const calendarId = (settings.google_calendar_id || 'primary').trim();

        if (!refreshToken) {
            return NextResponse.json({ result: "Error: Calendar not connected." });
        }

        // 3. Logic: Fetch events and calculate slots
        const targetDate = parseDateToRome(dateStr);
        console.log(`[Retell Check] Parsed Date: ${targetDate.toISOString()} from input: ${dateStr}`);

        // Start of day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        // End of day
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`[Retell Check] Time Window: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

        const events = await fetchCalendarEventsRobust({
            refreshToken: refreshToken,
            accessToken: settings.google_access_token || undefined,
            calendarId: calendarId,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            onTokenRefresh: undefined
        });

        console.log(`[Retell Check] Found ${events.length} events from Google.`);
        events.forEach(e => console.log(` - Event: ${e.summary} (${e.start?.dateTime} - ${e.end?.dateTime})`));

        const allSlots = generateDaySlots(targetDate);
        const availableSlots = allSlots.filter(slot => isSlotFree(slot, events));

        const formattedSlots = availableSlots.map(slot =>
            slot.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })
        );

        const responsePayload = {
            result: `Found ${formattedSlots.length} available slots: ${formattedSlots.join(', ')}`,
            slots: formattedSlots,
            date: startOfDay.toLocaleDateString('it-IT')
        };

        console.log(`[Retell Check] Success. ${formattedSlots.length} slots.`);
        return NextResponse.json(responsePayload);

    } catch (error: any) {
        console.error('[Retell Check] Error:', error);
        return NextResponse.json({ result: "Error checking availability." });
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
