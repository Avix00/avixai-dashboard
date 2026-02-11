'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings as SettingsIcon, Check, Link2, Unlink, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Settings } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { useFeatures } from '@/hooks/useFeatures';

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [settings, setSettings] = useState<Partial<Settings>>({
        calendar_connected: false,
        google_calendar_email: null,
    });
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { showGCal, allowCalendarConfig } = useFeatures();

    // Check for OAuth callback messages
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'calendar_connected') {
            setNotification({ type: 'success', message: 'Google Calendar collegato con successo!' });
            // Reload settings to get updated data
            fetchSettings();
        } else if (error) {
            const errorMessages: Record<string, string> = {
                oauth_denied: 'Hai annullato il collegamento a Google',
                no_code: 'Errore durante l\'autenticazione',
                db_error: 'Errore durante il salvataggio',
                callback_error: 'Errore durante la connessione',
            };
            setNotification({ type: 'error', message: errorMessages[error] || 'Errore sconosciuto' });
        }

        // Clear notification after 5 seconds
        if (success || error) {
            setTimeout(() => setNotification(null), 5000);
        }
    }, [searchParams]);

    async function fetchSettings() {
        try {
            // Get valid session first to ensure we query the correct user data
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return;

            const { data, error } = await supabase
                .from('settings')
                .select('calendar_connected, google_calendar_email')
                .eq('user_id', user.id) // CRITICAL: Explicitly match the user ID used in callback
                .maybeSingle(); // Use maybeSingle to handle 0 or 1 row gracefully

            if (error) {
                console.error('Settings fetch error:', error);
                throw error;
            }

            if (data) {
                setSettings(data);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSettings();
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
    }

    async function handleDisconnectGoogle() {
        if (!confirm('Sei sicuro di voler scollegare Google Calendar?')) return;

        setDisconnecting(true);
        try {
            const response = await fetch('/api/auth/google/disconnect', {
                method: 'POST',
            });

            if (response.ok) {
                setSettings(prev => ({
                    ...prev,
                    calendar_connected: false,
                    google_calendar_email: null,
                }));
                setNotification({ type: 'success', message: 'Google Calendar scollegato' });
            } else {
                throw new Error('Failed to disconnect');
            }
        } catch (err) {
            console.error('Error disconnecting:', err);
            setNotification({ type: 'error', message: 'Errore durante lo scollegamento' });
        } finally {
            setDisconnecting(false);
            setTimeout(() => setNotification(null), 3000);
        }
    }

    function handleConnectGoogle() {
        // Redirect to OAuth login
        window.location.href = '/api/auth/google/login';
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Impostazioni</h1>
                    <p className="text-white/50 mt-1">Configura il tuo assistente AI</p>
                </div>
                <div className="glass-card p-8 animate-pulse">
                    <div className="space-y-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-32 bg-white/10 rounded" />
                                <div className="h-12 w-full bg-white/10 rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-in">
            {/* Notification Toast */}
            {notification && (
                <div className={cn(
                    'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right fade-in duration-300',
                    notification.type === 'success'
                        ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
                        : 'bg-red-500/90 text-white border border-red-400/50'
                )}>
                    {notification.message}
                </div>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <SettingsIcon className="w-6 h-6 text-white/50" />
                        Impostazioni
                    </h1>
                    <p className="text-white/50 mt-1">
                        Configura il tuo assistente AI
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Esci
                </button>
            </div>

            {/* Google Calendar Integration Card - Hidden for B2B or if disabled by Admin */}
            {showGCal && allowCalendarConfig && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google Calendar
                    </h3>

                    {settings.calendar_connected ? (
                        // Connected State
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-emerald-400">Calendario Sincronizzato</p>
                                    <p className="text-sm text-white/60">
                                        {settings.google_calendar_email || 'Account collegato'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleDisconnectGoogle}
                                disabled={disconnecting}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                                {disconnecting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Unlink className="w-4 h-4" />
                                )}
                                {disconnecting ? 'Scollegamento...' : 'Scollega Google Calendar'}
                            </button>
                        </div>
                    ) : (
                        // Not Connected State
                        <div className="space-y-4">
                            <p className="text-white/60 text-sm">
                                Collega il tuo Google Calendar per sincronizzare automaticamente gli appuntamenti prenotati tramite Avix AI.
                            </p>

                            <button
                                onClick={handleConnectGoogle}
                                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-white/90 transition-colors shadow-lg"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <Link2 className="w-4 h-4 text-slate-600" />
                                Collega Google Calendar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
