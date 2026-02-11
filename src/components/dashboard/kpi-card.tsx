import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    accentColor?: 'cyan' | 'violet' | 'emerald' | 'amber';
}

const accentColors = {
    cyan: {
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
    },
    violet: {
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400',
        glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    },
    emerald: {
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    },
    amber: {
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    },
};

export function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    accentColor = 'cyan'
}: KPICardProps) {
    const colors = accentColors[accentColor];

    return (
        <div className={cn(
            'glass-card glass-card-hover p-8',
            colors.glow
        )}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--text-muted)] tracking-wide uppercase">{title}</p>
                    <p className="text-4xl font-light text-[var(--text-primary)] tracking-tight" style={{ letterSpacing: '0.02em' }}>{value}</p>
                    {subtitle && (
                        <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium',
                            trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-[var(--text-muted)]">vs settimana scorsa</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    colors.iconBg
                )}>
                    <Icon className={cn('w-6 h-6', colors.iconColor)} strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
}
