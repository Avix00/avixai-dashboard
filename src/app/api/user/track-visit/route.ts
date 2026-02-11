import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // Initialize Supabase client inside the handler to avoid build-time errors
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // Get user ID from request body
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Increment visit_count
        const { data, error } = await supabaseAdmin.rpc('increment_visit_count', {
            target_user_id: userId
        });

        if (error) {
            // If RPC doesn't exist, fall back to manual update
            const { data: settings, error: fetchError } = await supabaseAdmin
                .from('settings')
                .select('visit_count')
                .eq('user_id', userId)
                .single();

            if (fetchError) {
                return NextResponse.json({ error: fetchError.message }, { status: 500 });
            }

            const newCount = (settings?.visit_count || 0) + 1;

            const { error: updateError } = await supabaseAdmin
                .from('settings')
                .update({ visit_count: newCount })
                .eq('user_id', userId);

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            return NextResponse.json({ visitCount: newCount });
        }

        return NextResponse.json({ visitCount: data });
    } catch (err) {
        console.error('[track-visit] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
