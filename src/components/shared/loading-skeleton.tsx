import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div className={cn('skeleton', className)} style={style} />
    );
}

export function KPICardSkeleton() {
    return (
        <div className="glass-card p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="glass-card p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="h-[300px] flex items-end gap-2 pb-4">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                        <Skeleton
                            className="w-full rounded-t-lg"
                            style={{ height: `${30 + Math.random() * 60}%` }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="glass-card p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}
