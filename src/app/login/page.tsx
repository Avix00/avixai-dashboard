import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/auth-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
    // Check if user is already logged in
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    // If logged in, redirect to dashboard
    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="relative">
                            <div className="w-20 h-20 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/avix-logo-login.png"
                                    alt="Avix AI"
                                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]"
                                />
                            </div>
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl font-bold text-white">Avix AI</h1>
                            <p className="text-sm text-white/50">Piattaforma Intelligenza Vocale</p>
                        </div>
                    </div>
                </div>

                {/* Glass Card - Same as Dashboard */}
                <div className="glass-card p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white">Bentornato</h2>
                        <p className="text-white/50 text-sm mt-1">
                            Accedi al tuo dashboard per gestire le chiamate AI
                        </p>
                    </div>

                    <AuthForm />
                </div>

                {/* Footer */}
                <p className="text-center text-white/30 text-xs mt-6">
                    © 2026 Avix AI. Tutti i diritti riservati.
                </p>
            </div>
        </div>
    );
}
