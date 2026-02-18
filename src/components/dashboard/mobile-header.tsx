'use client';

import { usePathname } from 'next/navigation';
import { Bell, User, Sparkles } from 'lucide-react';

// Map pathname to page title
const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',

    '/dashboard/history': 'Cronologia',
    '/dashboard/insights': 'AI Insights',
    '/dashboard/calendar': 'Agenda',
    '/dashboard/settings': 'Impostazioni',
};

export function MobileHeader() {
    const pathname = usePathname();

    // Get page title from pathname
    const pageTitle = pageTitles[pathname] || 'Dashboard';

    return (
        <header className="sticky top-0 z-40 
                          bg-slate-950/80 backdrop-blur-xl
                          border-b border-white/5">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        {/* Light Mode Logo */}
                        <img
                            src="/avix-logo-light.png"
                            alt="Avix AI Logo"
                            className="w-full h-full object-contain dark:hidden"
                        />
                        {/* Dark Mode Logo */}
                        <img
                            src="/avix-logo-login.png"
                            alt="Avix AI Logo"
                            className="w-full h-full object-contain hidden dark:block"
                        />
                    </div>
                    <span className="text-lg font-bold text-white">Avix</span>
                </div>

                {/* Page Title */}
                <h1 className="absolute left-1/2 -translate-x-1/2 
                               text-sm font-semibold text-white/80">
                    {pageTitle}
                </h1>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-xl 
                                       bg-white/5 hover:bg-white/10 
                                       transition-colors border border-white/10">
                        <Bell className="w-5 h-5 text-white/70" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 
                                         rounded-full bg-cyan-400" />
                    </button>

                    {/* User */}
                    <button className="p-2 rounded-xl 
                                       bg-white/5 hover:bg-white/10 
                                       transition-colors border border-white/10">
                        <User className="w-5 h-5 text-white/70" />
                    </button>
                </div>
            </div>
        </header>
    );
}
