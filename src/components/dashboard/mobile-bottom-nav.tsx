'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Phone,
    History,
    Calendar,
    MoreHorizontal,
    Brain,
    Settings,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const mainNavItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },

    { href: '/dashboard/history', label: 'Storia', icon: History },
    { href: '/dashboard/calendar', label: 'Agenda', icon: Calendar },
];

const moreMenuItems = [
    { href: '/dashboard/insights', label: 'AI Insights', icon: Brain },
    { href: '/dashboard/settings', label: 'Impostazioni', icon: Settings },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);

    // Check if current path is in "more" menu
    const isMoreActive = moreMenuItems.some(item =>
        pathname === item.href || pathname.startsWith(item.href + '/')
    );

    return (
        <>
            {/* More Menu Overlay */}
            {showMore && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Menu Panel */}
            {showMore && (
                <div className="fixed bottom-20 left-4 right-4 z-50 
                                bg-slate-900/95 backdrop-blur-xl 
                                border border-white/10 rounded-2xl
                                shadow-[0_0_60px_rgba(0,0,0,0.5)]
                                p-2 space-y-1">
                    {moreMenuItems.map((item) => {
                        const isActive = pathname === item.href ||
                            pathname.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setShowMore(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                                    'transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <Icon className={cn(
                                    'w-5 h-5',
                                    isActive && 'text-cyan-400'
                                )} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 
                                                    shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50
                           bg-slate-900/90 backdrop-blur-xl
                           border-t border-white/10
                           pb-safe">
                {/* Safe area spacer for iOS */}
                <div className="flex items-center justify-around h-16 px-2">
                    {mainNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center',
                                    'min-w-[60px] py-2 px-3 rounded-xl',
                                    'transition-all duration-200',
                                    isActive
                                        ? 'text-white'
                                        : 'text-white/50 active:text-white/70'
                                )}
                            >
                                <div className={cn(
                                    'relative p-1.5 rounded-xl transition-all duration-200',
                                    isActive && 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30'
                                )}>
                                    <Icon className={cn(
                                        'w-6 h-6 transition-colors',
                                        isActive && 'text-cyan-400'
                                    )} />
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-xl 
                                                        bg-cyan-400/20 blur-lg -z-10" />
                                    )}
                                </div>
                                <span className={cn(
                                    'text-[10px] font-medium mt-1',
                                    isActive ? 'text-white' : 'text-white/50'
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={cn(
                            'flex flex-col items-center justify-center',
                            'min-w-[60px] py-2 px-3 rounded-xl',
                            'transition-all duration-200',
                            (showMore || isMoreActive)
                                ? 'text-white'
                                : 'text-white/50 active:text-white/70'
                        )}
                    >
                        <div className={cn(
                            'relative p-1.5 rounded-xl transition-all duration-200',
                            (showMore || isMoreActive) && 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30'
                        )}>
                            {showMore ? (
                                <X className="w-6 h-6 text-cyan-400" />
                            ) : (
                                <MoreHorizontal className={cn(
                                    'w-6 h-6 transition-colors',
                                    isMoreActive && 'text-cyan-400'
                                )} />
                            )}
                            {(showMore || isMoreActive) && (
                                <div className="absolute inset-0 rounded-xl 
                                                bg-cyan-400/20 blur-lg -z-10" />
                            )}
                        </div>
                        <span className={cn(
                            'text-[10px] font-medium mt-1',
                            (showMore || isMoreActive) ? 'text-white' : 'text-white/50'
                        )}>
                            Altro
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}
