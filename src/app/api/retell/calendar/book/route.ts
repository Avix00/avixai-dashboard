import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOAuth2CalendarClient } from '@/lib/google-calendar';
import { parseDateToRome, TIMEZONE } from '@/lib/calendar-helpers';

export const dynamic = 'force-dynamic';

/**
 * Normalize phone number - SIMPLIFIED for Webhook robustness
 * Just cleaning basic noise, leaving the rest to the webhook/n8n
 */
function normalizePhoneForBooking(phone: string | undefined | null): string | null {
    if (!phone) return null;

    // Remove spaces, dashes, parentheses
    let cleaned = String(phone).replace(/[\s\-\(\)]/g, '');

    // If it has reasonable length (e.g., > 6 chars), accept it
    // We don't enforce strict length or prefix here anymore to avoid blocking
    if (cleaned.length < 6) return null;

    return cleaned;
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log(`[Retell Book] ========== NEW BOOKING REQUEST (WEBHOOK MODE) ==========`);
    console.log(`[Retell Book] UserId: ${userId}`);

    if (!userId) {
        return NextResponse.json(
            { error: "Configuration Error", message: "Missing userId in Webhook URL." },
            { status: 400 }
        );
    }

    try {
        let body = await request.json();
        console.log('[Retell Book] RAW Body:', JSON.stringify(body));

        // RETELL WRAPPER DETECTION
        if (body.args && typeof body.args === 'object') body = body.args;
        else if (body.parameters && typeof body.parameters === 'object') body = body.parameters;
        else if (body.call?.args && typeof body.call.args === 'object') body = body.call.args;
        else if (body.argument && typeof body.argument === 'object') body = body.argument;

        console.log('[Retell Book] UNWRAPPED Body:', JSON.stringify(body));

        // Extract parameters (looking for multiple variations)
        const rawPhone = body.phone || body.customer_phone || body.phone_number ||
            body.phoneNumber || body.customerPhone || body.telefono ||
            body.numero || body.mobile || body.cell || null;

        const rawName = body.name || body.customer_name || body.customerName ||
            body.nome || body.cliente || 'Cliente';

        const rawEmail = body.email || body.customer_email || body.customerEmail ||
            body.mail || null;

        let { date, time, summary } = body;

        // Extract date/time from ISO string if needed
        if (time && time.includes('T')) {
            try {
                const parts = time.split('T');
                if (!date) date = parts[0];
                const timePart = parts[1];
                if (timePart.includes(':')) {
                    const subParts = timePart.split(':');
                    time = `${subParts[0]}:${subParts[1]}`;
                }
            } catch (e) {
                console.error('[Retell Book] ISO parse error (ignored):', e);
            }
        }

        // Basic Normalization
        const customer_phone = normalizePhoneForBooking(rawPhone);
        const customer_name = rawName;

        console.log(`[Retell Book] Processing: Name=${customer_name}, Phone=${customer_phone}, Date=${date}, Time=${time}`);

        // Validation - lenient
        if (!date || !time) {
            return NextResponse.json({ result: "Error: Missing date or time." });
        }

        // We pass the phone even if "invalid" validation-wise, but if null, we complain
        if (!customer_phone) {
            console.warn('[Retell Book] Phone missing or too short, but proceeding if possible (or returning error if strict)');
            // Return error to AI so it asks again
            return NextResponse.json({ result: "Error: Missing phone number." });
        }

        // Fetch User Settings
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: settings } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!settings?.google_refresh_token) {
            return NextResponse.json({ result: "Error: Calendar not connected." });
        }

        // Construct DateTime
        const startDateTime = parseDateToRome(date);
        const [hours, minutes] = time.split(':').map(Number);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + 30);

        // Create Event
        const calendar = getOAuth2CalendarClient(settings.google_refresh_token);
        const description = `Prenotazione AI Retell\nCliente: ${customer_name}\nTelefono: ${customer_phone}\nEmail: ${rawEmail || '-'}\nNote: ${summary || '-'}`;

        // Helper
        const formatLocalDateTime = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        await calendar.events.insert({
            calendarId: settings.google_calendar_id || 'primary',
            requestBody: {
                summary: `${customer_name} (AI)`,
                description: description,
                start: { dateTime: formatLocalDateTime(startDateTime), timeZone: TIMEZONE },
                end: { dateTime: formatLocalDateTime(endDateTime), timeZone: TIMEZONE },
            }
        });

        const successMsg = `Appuntamento prenotato per ${date} alle ${time}.`;
        console.log('[Retell Book] Google Calendar Event Created!');
        console.log('[Retell Book] SUCCESS:', successMsg);

        return NextResponse.json({
            result: "Success: Appuntamento confermato!",
            details: successMsg
        });

    } catch (error: unknown) {
        console.error('[Retell Book] EXCEPTION:', error);
        // Generic error to Retell
        return NextResponse.json({ result: "Error: Si è verificato un errore durante la prenotazione." });
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
