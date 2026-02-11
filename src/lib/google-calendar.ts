import { google, calendar_v3 } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Create OAuth2 client
function createOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
}

// Get OAuth2 client with user's stored tokens (auto-refreshes)
export function getOAuth2CalendarClient(refreshToken: string): calendar_v3.Calendar {
    const oauth2Client = createOAuth2Client();

    // Set the refresh token - googleapis will auto-refresh access tokens
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Robust calendar client that handles token refresh explicitly
export async function getCalendarClientWithRefresh(
    refreshToken: string,
    accessToken?: string | null
): Promise<{ calendar: calendar_v3.Calendar; newAccessToken?: string }> {
    const oauth2Client = createOAuth2Client();

    // Set both tokens if available
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
        access_token: accessToken || undefined,
    });

    // Try to refresh the token explicitly to ensure it's valid
    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        return {
            calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
            newAccessToken: credentials.access_token || undefined,
        };
    } catch (error) {
        console.error('Token refresh failed:', error);
        throw new Error('TOKEN_REFRESH_FAILED');
    }
}

// Fetch calendar events with automatic token refresh and retry
export async function fetchCalendarEventsRobust(options: {
    refreshToken: string;
    accessToken?: string | null;
    calendarId: string;
    timeMin: string;
    timeMax: string;
    onTokenRefresh?: (newAccessToken: string) => Promise<void>;
}): Promise<calendar_v3.Schema$Event[]> {
    const { refreshToken, accessToken, calendarId, timeMin, timeMax, onTokenRefresh } = options;

    try {
        // Get client with fresh token
        const { calendar, newAccessToken } = await getCalendarClientWithRefresh(refreshToken, accessToken);

        // If we got a new access token, save it
        if (newAccessToken && onTokenRefresh) {
            await onTokenRefresh(newAccessToken);
        }

        // Fetch events
        const response = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: 'Europe/Rome',
            maxResults: 250,
        });

        return response.data.items || [];

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Categorize errors for better handling
        if (errorMessage.includes('invalid_grant') || errorMessage.includes('TOKEN_REFRESH_FAILED')) {
            throw new Error('OAUTH_TOKEN_REVOKED');
        }
        if (errorMessage.includes('insufficient') || errorMessage.includes('403')) {
            throw new Error('INSUFFICIENT_PERMISSIONS');
        }
        if (errorMessage.includes('notFound') || errorMessage.includes('404')) {
            throw new Error('CALENDAR_NOT_FOUND');
        }

        throw new Error('CALENDAR_FETCH_ERROR');
    }
}

// Helper to update access token in Supabase
export async function updateStoredAccessToken(settingsId: string, newAccessToken: string) {
    // Use service role for server-side updates
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase
        .from('settings')
        .update({ google_access_token: newAccessToken })
        .eq('id', settingsId);
}

// Extract phone number from event description or attendee info
export function extractPhoneFromEvent(event: {
    description?: string | null;
    attendees?: Array<{ email?: string | null; displayName?: string | null }> | null;
}): string | null {
    // Try to find phone in description
    if (event.description) {
        // Match Italian phone formats: +39..., 3..., 0...
        const phoneMatch = event.description.match(/(\+39\s?)?[03]\d{2}[\s.-]?\d{6,7}/);
        if (phoneMatch) {
            return phoneMatch[0].replace(/[\s.-]/g, '');
        }
    }
    return null;
}

// Check if event was booked by Avix AI
export function isAvixBooking(event: {
    description?: string | null;
    creator?: { email?: string | null } | null;
    organizer?: { email?: string | null } | null;
}): boolean {
    const avixIndicators = ['avix', 'ai booking', 'prenotazione automatica', 'bot'];
    const description = event.description?.toLowerCase() || '';

    // Check description for Avix indicators
    if (avixIndicators.some(indicator => description.includes(indicator))) {
        return true;
    }

    // Check if organizer/creator is Avix service account
    const creatorEmail = event.creator?.email || event.organizer?.email || '';
    if (creatorEmail.includes('avix') || creatorEmail.includes('service')) {
        return true;
    }

    return false;
}

// Get attendee name from event
export function getAttendeeName(event: {
    summary?: string | null;
    attendees?: Array<{ email?: string | null; displayName?: string | null }> | null;
}): string {
    // Try attendees first
    if (event.attendees && event.attendees.length > 0) {
        const attendee = event.attendees.find(a => a.displayName || a.email);
        if (attendee?.displayName) return attendee.displayName;
        if (attendee?.email) return attendee.email.split('@')[0];
    }

    // Fallback to summary
    return event.summary || 'Cliente';
}

// Get attendee email
export function getAttendeeEmail(event: {
    attendees?: Array<{ email?: string | null }> | null;
}): string | null {
    if (event.attendees && event.attendees.length > 0) {
        const attendee = event.attendees.find(a => a.email);
        return attendee?.email || null;
    }
    return null;
}
