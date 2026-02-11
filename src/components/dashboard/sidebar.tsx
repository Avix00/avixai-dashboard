'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    Brain,
    Calendar,
    Settings,
    Shield,
    LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatures } from '@/hooks/useFeatures';
import { SupportModal } from '@/components/support/support-modal';
import { useState } from 'react';

const allNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAgenda: false },
    { href: '/dashboard/history', label: 'Cronologia', icon: History, requiresAgenda: false },
    { href: '/dashboard/insights', label: 'AI Insights', icon: Brain, requiresAgenda: false },
    { href: '/dashboard/calendar', label: 'Agenda', icon: Calendar, requiresAgenda: true },
];

export function Sidebar() {
    const pathname = usePathname();
    const { showAgenda, showHistory, showInsights, isSuperAdmin } = useFeatures();
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    // Filter navigation items based on feature flags
    const navItems = [
        allNavItems[0], // Dashboard always visible
        ...(showHistory ? [allNavItems[1]] : []), // Cronologia
        ...(showInsights ? [allNavItems[2]] : []), // AI Insights
        ...(showAgenda ? [allNavItems[3]] : []), // Agenda
        ...(isSuperAdmin ? [{
            href: '/admin',
            label: 'Admin Panel',
            icon: Shield,
            requiresAgenda: false
        }] : [])
    ];

    const isSettingsActive = pathname === '/dashboard/settings';

    return (
        <aside className="glass-sidebar fixed left-0 top-0 h-full w-64 flex flex-col z-50">
            {/* Logo */}
            <div className="p-4 border-b border-[var(--sidebar-border)]">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        {/* Light Mode Logo */}
                        <img
                            src="/avix-logo-light.png"
                            alt="Avix AI Logo"
                            className="w-full h-full object-contain dark:hidden"
                        />
                        {/* Dark Mode Logo */}
                        <img
                            src="/avix-logo-new.png"
                            alt="Avix AI Logo"
                            className="w-full h-full object-contain hidden dark:block"
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--sidebar-text)]">Avix AI</h1>
                        <p className="text-xs text-[var(--sidebar-text-muted)]">Intelligenza Vocale</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                                'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-text)]/5',
                                isActive && 'nav-active text-[var(--sidebar-text)]'
                            )}
                        >
                            <Icon className={cn(
                                'w-5 h-5 transition-colors',
                                isActive && 'text-blue-500'
                            )} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>


            {/* Footer */}
            <div className="p-4 border-t border-[var(--sidebar-border)] space-y-2">
                {/* Supporto */}
                <button
                    onClick={() => setIsSupportOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-text)]/5 group"
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <LifeBuoy className="w-5 h-5 transition-colors group-hover:text-blue-500" />
                    </div>
                    <span className="font-medium">Supporto</span>
                </button>

                {/* Impostazioni */}
                <Link
                    href="/dashboard/settings"
                    className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                        'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-text)]/5',
                        isSettingsActive && 'nav-active text-[var(--sidebar-text)]'
                    )}
                >
                    <Settings className={cn(
                        'w-5 h-5 transition-colors',
                        isSettingsActive && 'text-blue-500'
                    )} />
                    <span className="font-medium">Impostazioni</span>
                    {isSettingsActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    )}
                </Link>
            </div>

            <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </aside>
    );
}
