import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for API routes
// Using untyped client to avoid strict type issues with Supabase generics
export function createServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseAnonKey);
}

// Server-side Supabase client with SERVICE ROLE (bypasses RLS)
// Use this for API routes that need to access data on behalf of authenticated users
// The service role key should NEVER be exposed to the client
export function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}
