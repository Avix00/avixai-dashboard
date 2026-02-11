'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { X, Calendar, Clock, FileText, Loader2, Trash2, Bot, MessageSquare } from 'lucide-react';
import { TranscriptChat } from '@/components/shared/transcript-chat';

interface EditEventModalProps {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventId: string, data: Partial<CalendarEvent>) => Promise<void>;
    onDelete: (eventId: string) => Promise<void>;
}

const DURATIONS = [
    { label: '15 minuti', value: 15 },
    { label: '30 minuti', value: 30 },
    { label: '45 minuti', value: 45 },
    { label: '1 ora', value: 60 },
    { label: '1.5 ore', value: 90 },
    { label: '2 ore', value: 120 },
    { label: '3 ore', value: 180 },
];

export function EditEventModal({
    event,
    isOpen,
    onClose,
    onSave,
    onDelete
}: EditEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');

    // Initialize form with event data
    useEffect(() => {
        if (isOpen && event) {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            const durationMins = differenceInMinutes(endDate, startDate);

            setTitle(event.title || '');
            setDate(format(startDate, 'yyyy-MM-dd'));
            setTime(format(startDate, 'HH:mm'));
            setDuration(durationMins > 0 ? durationMins : 60);
            setDescription(event.description || '');
        }
    }, [isOpen, event]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!event || !title.trim() || !date || !time) {
            return;
        }

        setLoading(true);

        try {
            const [hours, minutes] = time.split(':').map(Number);
            const startDate = new Date(date);
            startDate.setHours(hours, minutes, 0, 0);

            const endDate = addMinutes(startDate, duration);

            await onSave(event.googleEventId || event.id, {
                title: title.trim(),
                start: startDate,
                end: endDate,
                description: description.trim() || undefined,
            });

            onClose();
        } catch (error) {
            console.error('Error updating event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event) return;

        setDeleting(true);
        try {
            await onDelete(event.googleEventId || event.id);
            onClose();
        } catch (error) {
            console.error('Error deleting event:', error);
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md">
                {/* Ambient Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50" />

                <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 
                                backdrop-blur-xl rounded-2xl border border-white/10
                                shadow-[0_0_60px_rgba(0,0,0,0.6),0_0_100px_rgba(139,92,246,0.1)]
                                p-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-violet-400" />
                            Modifica Evento
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="edit-title" className="block text-sm font-medium text-white/70 mb-2">
                                Titolo *
                            </label>
                            <input
                                id="edit-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="es. Meeting con cliente"
                                required
                                className="w-full px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white placeholder:text-white/30
                                         focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                                         transition-all duration-200"
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="edit-date" className="block text-sm font-medium text-white/70 mb-2">
                                    Data *
                                </label>
                                <input
                                    id="edit-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 rounded-xl
                                             bg-white/5 border border-white/10
                                             text-white
                                             focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                                             transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-time" className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Ora *
                                </label>
                                <input
                                    id="edit-time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 rounded-xl
                                             bg-white/5 border border-white/10
                                             text-white
                                             focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                                             transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="edit-duration" className="block text-sm font-medium text-white/70 mb-2">
                                Durata
                            </label>
                            <select
                                id="edit-duration"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white
                                         focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                                         transition-all duration-200"
                            >
                                {DURATIONS.map(d => (
                                    <option key={d.value} value={d.value} className="bg-slate-900">
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="edit-description" className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Note / Cliente
                            </label>
                            <textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Aggiungi dettagli..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white placeholder:text-white/30
                                         focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                                         transition-all duration-200 resize-none"
                            />
                        </div>

                        {/* AI Transcript Section (for AI-booked events) */}
                        {event.isAvixBooking && (event.call_transcript_json || event.call_transcript) && (
                            <div className="border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                                             bg-gradient-to-r from-cyan-500/10 to-teal-500/10
                                             border border-cyan-500/20 hover:border-cyan-500/40
                                             transition-all duration-200 group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-cyan-400" />
                                        <span className="text-sm font-medium text-cyan-300">
                                            Conversazione con AI
                                        </span>
                                    </div>
                                    <MessageSquare className={cn(
                                        'w-4 h-4 text-cyan-400 transition-transform',
                                        showTranscript && 'rotate-180'
                                    )} />
                                </button>

                                {showTranscript && (
                                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                        <TranscriptChat
                                            transcriptJson={event.call_transcript_json}
                                            transcriptText={event.call_transcript}
                                            maxHeight="250px"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            {/* Delete Button */}
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className={cn(
                                    'px-4 py-2.5 rounded-xl font-medium',
                                    'bg-red-500/10 border border-red-500/30',
                                    'text-red-400 hover:text-red-300 hover:bg-red-500/20',
                                    'transition-all duration-200',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                    'flex items-center gap-2'
                                )}
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white/70 hover:text-white hover:bg-white/10
                                         font-medium transition-all duration-200"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !title.trim()}
                                className={cn(
                                    'flex-1 px-4 py-2.5 rounded-xl font-medium',
                                    'bg-gradient-to-r from-violet-500 to-cyan-500',
                                    'text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]',
                                    'hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]',
                                    'transition-all duration-300',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                    'flex items-center justify-center gap-2'
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Salvataggio...
                                    </>
                                ) : (
                                    'Salva'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
