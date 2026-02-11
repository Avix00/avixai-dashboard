'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 border border-transparent">
                <div className="w-5 h-5" />
                <span className="font-medium">Tema</span>
            </button>
        );
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-text)]/5 border border-[var(--neon-border,rgba(0,212,255,0.3))] group"
        >
            <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                <Sun className={cn(
                    "w-5 h-5 absolute transition-all duration-300",
                    isDark
                        ? "opacity-0 rotate-90 scale-0"
                        : "opacity-100 rotate-0 scale-100 text-amber-400"
                )} />
                <Moon className={cn(
                    "w-5 h-5 absolute transition-all duration-300",
                    isDark
                        ? "opacity-100 rotate-0 scale-100 text-cyan-400"
                        : "opacity-0 -rotate-90 scale-0"
                )} />
            </div>
            <span className="font-medium">{isDark ? 'Tema Scuro' : 'Tema Chiaro'}</span>
        </button>
    );
}
