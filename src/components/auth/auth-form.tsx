'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthForm() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setError('Email o password non corretti');
                } else {
                    setError(error.message);
                }
                return;
            }

            // Success - redirect to dashboard with full page reload
            // This ensures the auth cookie is properly set before middleware checks
            window.location.href = '/dashboard';

        } catch (err) {
            console.error('Auth error:', err);
            setError('Si è verificato un errore. Riprova.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">
                    Email
                </label>
                <div className="relative">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="nome@azienda.com"
                        className={cn(
                            'w-full pl-12 pr-4 py-3.5 rounded-xl',
                            'bg-white/[0.03] backdrop-blur-sm',
                            'border border-white/10',
                            'text-white placeholder:text-white/30',
                            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
                            'transition-all duration-300'
                        )}
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className={cn(
                            'w-full pl-12 pr-12 py-3.5 rounded-xl',
                            'bg-white/[0.03] backdrop-blur-sm',
                            'border border-white/10',
                            'text-white placeholder:text-white/30',
                            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
                            'transition-all duration-300'
                        )}
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
                <button
                    type="button"
                    className="text-sm text-cyan-400/80 hover:text-cyan-400 transition-colors"
                >
                    Password dimenticata?
                </button>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className={cn(
                    'w-full py-4 rounded-xl font-semibold text-white',
                    'bg-gradient-to-r from-cyan-500 to-blue-600',
                    'hover:from-cyan-400 hover:to-blue-500',
                    'shadow-lg shadow-blue-500/25',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-black',
                    'transition-all duration-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'relative overflow-hidden group'
                )}
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />

                <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Accesso in corso...
                        </>
                    ) : (
                        'Accedi'
                    )}
                </span>
            </button>

            {/* Invite Only Notice */}
            <div className="text-center pt-2">
                <p className="text-white/30 text-xs italic">
                    Accesso riservato su invito.
                </p>
            </div>
        </form>
    );
}
