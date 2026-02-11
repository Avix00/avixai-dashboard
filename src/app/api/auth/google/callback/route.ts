import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// OAuth2 client configuration
function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
}

// GET /api/auth/google/callback - Handle OAuth callback from Google
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // Handle user denial or errors
        if (error) {
            console.error('OAuth error from Google:', error);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=oauth_denied`
            );
        }

        if (!code) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`
            );
        }

        // ============================================
        // CRITICAL: Decode user_id from state parameter
        // ============================================
        let userId: string | null = null;

        if (state) {
            try {
                const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
                userId = stateData.user_id;

                // Optional: Check timestamp to prevent replay attacks (e.g., 10 min max)
                const stateAge = Date.now() - (stateData.timestamp || 0);
                if (stateAge > 10 * 60 * 1000) {
                    console.warn('OAuth state expired');
                    return NextResponse.redirect(
                        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=state_expired`
                    );
                }
            } catch (e) {
                console.error('Failed to decode OAuth state:', e);
                return NextResponse.redirect(
                    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_state`
                );
            }
        }

        if (!userId) {
            console.error('No user_id in OAuth state');
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_user`
            );
        }

        const oauth2Client = getOAuth2Client();

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        // Get user info (email)
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        // Get primary calendar ID (usually the user's email)
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const calendarList = await calendar.calendarList.list();
        const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);
        const calendarId = primaryCalendar?.id || email;

        // CRITICAL: Use SERVICE ROLE to bypass RLS for OAuth token storage
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // ============================================
        // FIXED: Filter by user_id from state parameter
        // ============================================
        const { data: existing, error: fetchError } = await supabase
            .from('settings')
            .select('id, google_refresh_token')
            .eq('user_id', userId)  // <-- CRITICAL FIX
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = "no rows returned" which is fine for first-time setup
            console.error('Error fetching settings:', fetchError);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=db_error`
            );
        }

        // Preserve existing refresh_token if new one not provided
        const refreshTokenToStore = tokens.refresh_token || existing?.google_refresh_token || null;

        if (!refreshTokenToStore) {
            console.warn('No refresh token available - user needs to re-authorize');
        }

        const oauthData = {
            google_refresh_token: refreshTokenToStore,
            google_access_token: tokens.access_token || null,
            google_calendar_email: email,
            google_calendar_id: calendarId,
            calendar_connected: !!refreshTokenToStore,
        };

        if (existing) {
            // Update existing settings (already filtered by user_id)
            const { error: updateError } = await supabase
                .from('settings')
                .update(oauthData)
                .eq('id', existing.id);

            if (updateError) {
                console.error('Error updating settings:', updateError);
                return NextResponse.redirect(
                    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=db_error`
                );
            }
        } else {
            // Insert new settings row WITH user_id
            const { error: insertError } = await supabase
                .from('settings')
                .insert({
                    user_id: userId,  // <-- CRITICAL: Associate with user
                    company_name: 'Avix AI',
                    ai_active: true,
                    ...oauthData,
                });

            if (insertError) {
                console.error('Error inserting settings:', insertError);
                return NextResponse.redirect(
                    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=db_error`
                );
            }
        }

        // Success! Redirect back to settings
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=calendar_connected`
        );

    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_error`
        );
    }
}

