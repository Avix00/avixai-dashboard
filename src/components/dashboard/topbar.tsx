'use client';

import { User } from 'lucide-react';
import { useFeatures } from '@/hooks/useFeatures';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState, useRef } from 'react';

export function Topbar() {
    const { isSuperAdmin, companyName, displayName, visitCount } = useFeatures();
    const [email, setEmail] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const trackVisitCalled = useRef(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email || 'No Email');
            setUserId(data.user?.id || null);
        });
    }, []);

    // Track visit on mount (once per session)
    useEffect(() => {
        if (userId && !trackVisitCalled.current) {
            trackVisitCalled.current = true;
            fetch('/api/user/track-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            }).catch(console.error);
        }
    }, [userId]);

    // Capitalize first letter of name
    const formatName = (name: string) => {
        if (!name) return '';
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    // Dynamic greeting based on visit count
    const greeting = visitCount <= 1
        ? 'Benvenuto nella tua dashboard,'
        : 'Bentornato nel tuo centro di controllo,';

    const formattedName = formatName(displayName || '');

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <div>
                <h2 className="text-lg font-semibold text-white/90">
                    {greeting} {formattedName && <span className="font-bold">{formattedName}</span>}
                </h2>
                <p className="text-sm text-white/50">
                    Monitora le tue chiamate AI in tempo reale
                </p>
            </div>

            <div className="flex items-center gap-4">
                {/* User Profile */}
                <button className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-900 to-blue-950 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-white/90 leading-tight">
                            {companyName || 'Utente'}
                        </span>
                        <span className="text-[10px] text-white/50 leading-tight">
                            {email}
                        </span>

                    </div>
                </button>
            </div>
        </header>
    );
}
