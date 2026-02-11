'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { format, addMinutes } from 'date-fns';
import { X, Calendar, Clock, FileText, Loader2 } from 'lucide-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: Partial<CalendarEvent>) => Promise<void>;
    defaultDate?: Date;
    defaultTime?: string;
}

const DURATIONS = [
    { label: '15 minuti', value: 15 },
    { label: '30 minuti', value: 30 },
    { label: '45 minuti', value: 45 },
    { label: '1 ora', value: 60 },
    { label: '1.5 ore', value: 90 },
    { label: '2 ore', value: 120 },
];

export function CreateEventModal({
    isOpen,
    onClose,
    onSubmit,
    defaultDate,
    defaultTime
}: CreateEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');

    // Initialize form with defaults
    useEffect(() => {
        if (isOpen) {
            const now = defaultDate || new Date();
            setDate(format(now, 'yyyy-MM-dd'));
            setTime(defaultTime || format(now, 'HH:mm'));
            setDuration(60);
            setTitle('');
            setDescription('');
        }
    }, [isOpen, defaultDate, defaultTime]);

    // Auto-focus title input
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                document.getElementById('event-title')?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !date || !time) {
            return;
        }

        setLoading(true);

        try {
            // Parse date and time
            const [hours, minutes] = time.split(':').map(Number);
            const startDate = new Date(date);
            startDate.setHours(hours, minutes, 0, 0);

            const endDate = addMinutes(startDate, duration);

            await onSubmit({
                title: title.trim(),
                start: startDate,
                end: endDate,
                description: description.trim() || undefined,
                isAvixBooking: false,
            });

            onClose();
        } catch (error) {
            console.error('Error creating event:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
                <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-2xl opacity-50" />

                <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 
                                backdrop-blur-xl rounded-2xl border border-white/10
                                shadow-[0_0_60px_rgba(0,0,0,0.6)]
                                p-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Nuovo Evento
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="event-title" className="block text-sm font-medium text-white/70 mb-2">
                                Titolo *
                            </label>
                            <input
                                id="event-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="es. Meeting con cliente"
                                required
                                className="w-full px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white placeholder:text-white/30
                                         focus:outline-none focus:border-blue-500/50 focus:bg-white/10
                                         transition-all duration-200"
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="event-date" className="block text-sm font-medium text-white/70 mb-2">
                                    Data *
                                </label>
                                <input
                                    id="event-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 rounded-xl
                                             bg-white/5 border border-white/10
                                             text-white
                                             focus:outline-none focus:border-blue-500/50 focus:bg-white/10
                                             transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="event-time" className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Ora *
                                </label>
                                <input
                                    id="event-time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 rounded-xl
                                             bg-white/5 border border-white/10
                                             text-white
                                             focus:outline-none focus:border-blue-500/50 focus:bg-white/10
                                             transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="event-duration" className="block text-sm font-medium text-white/70 mb-2">
                                Durata
                            </label>
                            <select
                                id="event-duration"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white
                                         focus:outline-none focus:border-blue-500/50 focus:bg-white/10
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
                            <label htmlFor="event-description" className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Note / Cliente
                            </label>
                            <textarea
                                id="event-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Aggiungi dettagli, nome cliente, telefono..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl
                                         bg-white/5 border border-white/10
                                         text-white placeholder:text-white/30
                                         focus:outline-none focus:border-blue-500/50 focus:bg-white/10
                                         transition-all duration-200 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
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
                                    'bg-blue-600 hover:bg-blue-700',
                                    'text-white shadow-lg shadow-blue-600/25',
                                    'hover:shadow-xl hover:shadow-blue-600/30',
                                    'transition-all duration-300',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                    'flex items-center justify-center gap-2'
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creazione...
                                    </>
                                ) : (
                                    'Crea Evento'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
