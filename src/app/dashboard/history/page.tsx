'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Call } from '@/lib/supabase/types';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { CallDetailModal } from '@/components/history/call-detail-modal';
import {
    formatDuration,
    formatPhoneNumber,
    formatDate,
    getStatusColor,
    getStatusLabel,
    getSentimentColor,
    getSentimentLabel,
    cn
} from '@/lib/utils';

// Mini inline audio player component
function QuickAudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-1">
            <audio
                ref={audioRef}
                src={src}
                onEnded={() => setIsPlaying(false)}
            />
            <button
                onClick={handlePlayPause}
                className={cn(
                    'p-2 rounded-lg transition-colors',
                    isPlaying
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                )}
                title={isPlaying ? 'Pausa' : 'Riproduci'}
            >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
        </div>
    );
}

import { useRouter, useSearchParams } from 'next/navigation';

export default function HistoryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sentimentFilter = searchParams.get('sentiment');

    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const pageSize = 10;

    useEffect(() => {
        setPage(0); // Reset page on filter change
        setCalls([]); // Clear calls
        setHasMore(true);
        fetchCalls(0, true);
    }, [sentimentFilter]);

    useEffect(() => {
        if (page > 0) {
            fetchCalls(page, false);
        }
    }, [page]);

    async function fetchCalls(pageIndex: number, isNewFilter: boolean) {
        try {
            setLoading(true);

            let query = supabase
                .from('calls')
                .select('*')
                .order('created_at', { ascending: false })
                .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

            if (sentimentFilter) {
                query = query.eq('sentiment', sentimentFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data.length < pageSize) {
                setHasMore(false);
            }

            if (isNewFilter || pageIndex === 0) {
                setCalls(data || []);
            } else {
                setCalls((prev) => [...prev, ...(data || [])]);
            }
        } catch (err) {
            console.error('Error fetching calls:', err);
        } finally {
            setLoading(false);
        }
    }

    const clearFilter = () => {
        router.push('/dashboard/history');
    };

    function getStatusIcon(status: string) {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'in-progress':
                return <Clock className="w-4 h-4 animate-pulse" />;
            case 'missed':
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
    }



    if (loading && calls.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Cronologia Chiamate</h1>
                    <p className="text-white/50 mt-1">Tutte le chiamate registrate</p>
                </div>
                <TableSkeleton rows={5} />
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Cronologia Chiamate</h1>
                    <p className="text-white/50 mt-1">Tutte le chiamate registrate</p>
                </div>
                <EmptyState
                    title="Nessuna chiamata trovata"
                    description="La cronologia delle chiamate apparirà qui quando saranno disponibili dati."
                />
            </div>
        );
    }

    // Check if we have data for optional columns
    const showTags = calls.some(c => c.tags && c.tags.length > 0);

    return (
        <div className="space-y-6 fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Cronologia Chiamate</h1>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-white/50">Gestione Lead e Contatti</p>
                    {sentimentFilter && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            <span className="text-xs text-cyan-400 font-medium">
                                Filtro: {getSentimentLabel(sentimentFilter)}
                            </span>
                            <button
                                onClick={clearFilter}
                                className="text-cyan-400 hover:text-white transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Stato</th>
                                <th>Contatto</th>
                                <th>Durata</th>
                                <th>Priorità</th>
                                <th>Riepilogo</th>
                                {showTags && <th>Tag</th>}
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calls.map((call) => (
                                <tr key={call.id} className={cn(
                                    'transition-colors',
                                    call.sentiment === 'negative' ? 'bg-red-500/5 hover:bg-red-500/10' : ''
                                )}>
                                    {/* Status - Minimal Dot + Text */}
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'w-2 h-2 rounded-full',
                                                call.status === 'completed' ? 'bg-emerald-400' :
                                                    call.status === 'missed' ? 'bg-red-400' :
                                                        call.status === 'in-progress' ? 'bg-cyan-400' : 'bg-slate-400'
                                            )} />
                                            <span className="text-sm text-[var(--text-muted)]">
                                                {getStatusLabel(call.status)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Phone / Contact - Tech Typography */}
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-gray-400 text-sm">
                                                {formatPhoneNumber(call.customer_number)}
                                            </span>
                                            <span className="font-mono text-xs text-gray-500 mt-1">
                                                {formatDate(call.created_at)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Duration - Tech Typography */}
                                    <td>
                                        <span className="font-mono text-gray-400 text-sm">
                                            {formatDuration(call.duration)}
                                        </span>
                                    </td>



                                    {/* Sentiment - Minimal Dot + Text */}
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'w-2 h-2 rounded-full',
                                                call.sentiment === 'positive' ? 'bg-emerald-400' :
                                                    call.sentiment === 'negative' ? 'bg-red-400' :
                                                        call.sentiment === 'neutral' ? 'bg-amber-400' : 'bg-slate-400'
                                            )} />
                                            <span className={cn(
                                                'text-sm',
                                                call.sentiment === 'negative' ? 'text-red-300 font-medium' : 'text-[var(--text-muted)]'
                                            )}>
                                                {call.sentiment === 'negative' ? 'Urgente' : getSentimentLabel(call.sentiment)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Summary */}
                                    <td className="max-w-xs">
                                        {call.summary ? (
                                            <p className="text-sm text-white/70 truncate" title={call.summary}>
                                                {call.summary}
                                            </p>
                                        ) : (
                                            <span className="text-white/20 text-sm italic">-</span>
                                        )}
                                    </td>

                                    {/* Tags (Conditional) */}
                                    {showTags && (
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {call.tags && call.tags.length > 0 ? (
                                                    call.tags.slice(0, 2).map((tag) => (
                                                        <span key={tag} className="tag">
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-white/20">-</span>
                                                )}
                                                {call.tags && call.tags.length > 2 && (
                                                    <span className="tag">+{call.tags.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                    )}

                                    {/* Actions */}
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {/* Quick Play (if recording exists) */}
                                            {call.recording_url && (
                                                <QuickAudioPlayer src={call.recording_url} />
                                            )}

                                            {/* View Details Button */}
                                            <button
                                                onClick={() => setSelectedCall(call)}
                                                className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                                title="Vedi dettagli"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Load More */}
                {hasMore && (
                    <div className="p-4 border-t border-white/5 flex justify-center">
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loading}
                            className="btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Caricamento...' : 'Carica altre'}
                        </button>
                    </div>
                )}
            </div>

            {/* Call Detail Modal */}
            {selectedCall && (
                <CallDetailModal
                    call={selectedCall}
                    isOpen={!!selectedCall}
                    onClose={() => setSelectedCall(null)}
                />
            )}
        </div>
    );
}
