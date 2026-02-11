'use client';

import { useState } from 'react';
import { X, Calendar, Clock, User, Phone, Bot, Trash2, Loader2 } from 'lucide-react';
import { CalendarEvent } from '@/lib/supabase/types';
import { AudioPlayer } from './audio-player';
import { formatDuration, getSentimentColor, getSentimentLabel, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface EventModalProps {
    event: CalendarEvent | null;
    onClose: () => void;
    onDelete: (eventId: string) => Promise<void>;
}

export function EventModal({ event, onClose, onDelete }: EventModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!event) return null;

    const handleDelete = async () => {
        if (!confirm('Sei sicuro di voler cancellare questo appuntamento?')) return;

        setIsDeleting(true);
        try {
            await onDelete(event.googleEventId);
            onClose();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Errore nella cancellazione');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass-card w-full max-w-lg p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="pr-10">
                    <div className="flex items-center gap-2 mb-2">
                        {event.isAvixBooking && (
                            <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                Prenotato da Avix AI
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        Appuntamento con {event.attendeeName}
                    </h2>
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/70">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>
                            {format(event.start, "EEEE d MMMM yyyy", { locale: it })}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-white/70">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>
                            {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                        </span>
                    </div>

                    {event.attendeeEmail && (
                        <div className="flex items-center gap-3 text-white/70">
                            <User className="w-4 h-4 text-violet-400" />
                            <span>{event.attendeeEmail}</span>
                        </div>
                    )}

                    {event.attendeePhone && (
                        <div className="flex items-center gap-3 text-white/70">
                            <Phone className="w-4 h-4 text-violet-400" />
                            <span>{event.attendeePhone}</span>
                        </div>
                    )}
                </div>

                {/* Linked Call Section */}
                {event.call_id ? (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                            Origine Prenotazione
                        </h3>

                        {/* Call Summary */}
                        {event.call_summary && (
                            <div className="glass-card p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/50">Riepilogo AI</span>
                                    {event.call_sentiment && (
                                        <span className={cn(
                                            'text-xs font-medium',
                                            getSentimentColor(event.call_sentiment)
                                        )}>
                                            {getSentimentLabel(event.call_sentiment)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-white/80">{event.call_summary}</p>
                                {event.call_duration && (
                                    <p className="text-xs text-white/50">
                                        Durata chiamata: {formatDuration(event.call_duration)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Audio Player */}
                        {event.call_recording_url && (
                            <AudioPlayer
                                src={event.call_recording_url}
                                title="Registrazione della chiamata"
                            />
                        )}
                    </div>
                ) : (
                    <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-white/40 italic">
                            Nessuna chiamata collegata a questo appuntamento
                        </p>
                    </div>
                )}

                {/* Delete Button */}
                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full py-3 px-4 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {isDeleting ? 'Cancellazione...' : 'Cancella Appuntamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
