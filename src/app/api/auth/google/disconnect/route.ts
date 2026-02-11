import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/auth/google/disconnect - Clear OAuth tokens
export async function POST(request: NextRequest) {
    try {
        // ============================================
        // Get authenticated user
        // ============================================
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

        const { data: { user }, error: authError } = await authSupabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role to update settings
        const supabase = createServiceRoleClient();

        // Get user's settings (filtered by user_id)
        const { data: existing } = await supabase
            .from('settings')
            .select('id')
            .eq('user_id', user.id)  // <-- CRITICAL: Filter by user
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }

        // Clear OAuth data for this user only
        const { error } = await supabase
            .from('settings')
            .update({
                google_refresh_token: null,
                google_access_token: null,
                google_calendar_email: null,
                calendar_connected: false,
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Error disconnecting Google:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

