'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client-side operations
// Uses @supabase/ssr to store auth tokens in cookies (required for middleware)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Export for realtime subscriptions
export { supabaseUrl, supabaseAnonKey };
