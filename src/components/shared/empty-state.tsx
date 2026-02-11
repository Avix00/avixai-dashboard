import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export function EmptyState({
    title = 'In attesa di dati...',
    description = 'Non ci sono ancora dati da visualizzare.',
    icon
}: EmptyStateProps) {
    return (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--text-muted)]/10 flex items-center justify-center mb-4">
                {icon || <Inbox className="w-8 h-8 text-[var(--text-muted)]" />}
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
        </div>
    );
}
