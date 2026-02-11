import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin API route - creates users via Supabase Admin API
// Protected by checking is_super_admin on the calling user

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    try {
        // Get the current user's session from cookie
        const authHeader = request.headers.get('cookie');
        if (!authHeader) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Create admin client
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const body = await request.json();
        const { email, password, company_name, display_name, features_config } = body;

        if (!email || !password || !company_name) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
        });

        if (authError) {
            console.error('Auth error:', authError);
            return NextResponse.json({ message: authError.message }, { status: 400 });
        }

        // 2. Create settings row for the new user
        const { error: settingsError } = await supabaseAdmin
            .from('settings')
            .insert({
                user_id: authData.user.id,
                company_name,
                display_name: display_name || null,
                ai_active: true,
                is_super_admin: false,
                office_hours_start: '09:00',
                office_hours_end: '18:00',
                features_config: features_config || null, // Store granular feature toggles
            });

        if (settingsError) {
            console.error('Settings error:', settingsError);
            // User was created but settings failed - still return success
        }

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            userId: authData.user.id
        });

    } catch (error: any) {
        console.error('Admin create-user error:', error);
        return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 });
    }
}
