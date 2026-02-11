'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { Calendar as CalendarIcon, Loader2, LayoutGrid, Clock, CalendarDays, Plus, Bot } from 'lucide-react';
import { CalendarEvent, CalendarEventResponse } from '@/lib/supabase/types';
import { WeekView } from '@/components/calendar/week-view';
import { MonthView } from '@/components/calendar/month-view';
import { DayView } from '@/components/calendar/day-view';
import { CreateEventModal } from '@/components/calendar/create-event-modal';
import { EditEventModal } from '@/components/calendar/edit-event-modal';
import { EmptyState } from '@/components/shared/empty-state';
import { startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek, addWeeks, startOfDay, endOfDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [createModalDefaults, setCreateModalDefaults] = useState<{ date?: Date; time?: string }>({});
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [dateRange, setDateRange] = useState({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }),
    });

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/calendar?timeMin=${dateRange.start.toISOString()}&timeMax=${dateRange.end.toISOString()}`
            );

            const data: CalendarEventResponse = await response.json();

            if (data.error) {
                setError(data.error);
                setEvents([]);
            } else {
                const parsedEvents = data.events.map(event => ({
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end),
                }));
                setEvents(parsedEvents);
            }
        } catch (err) {
            console.error('Error fetching calendar events:', err);
            setError('Errore nel caricamento del calendario');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Event handlers
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = async (eventId: string) => {
        const response = await fetch(`/api/calendar/${eventId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete event');
        }

        await fetchEvents();
    };

    const handleUpdateEvent = async (eventId: string, data: Partial<CalendarEvent>) => {
        const response = await fetch(`/api/calendar/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update event');
        }

        await fetchEvents();
    };

    const handleDayClick = (date: Date) => {
        setCreateModalDefaults({ date });
        setIsCreateModalOpen(true);
    };

    const handleSlotClick = (date: Date, hour: number) => {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        setCreateModalDefaults({ date, time });
        setIsCreateModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setCreateModalDefaults({});
        setIsCreateModalOpen(true);
    };

    const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
        // Optimistic UI update
        const tempEvent: CalendarEvent = {
            id: `temp-${Date.now()}`,
            googleEventId: '',
            title: eventData.title || '',
            start: eventData.start || new Date(),
            end: eventData.end || new Date(),
            description: eventData.description,
            isAvixBooking: false,
        };

        setEvents(prev => [...prev, tempEvent]);

        try {
            const response = await fetch('/api/calendar/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                throw new Error('Failed to create event');
            }

            await fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            setEvents(prev => prev.filter(e => e.id !== tempEvent.id));
            throw error;
        }
    };

    // Drag & drop handler for moving events
    const handleEventDrop = async (eventId: string, newStart: Date, newEnd: Date) => {
        // Find the event
        const event = events.find(e => e.id === eventId || e.googleEventId === eventId);
        if (!event) return;

        // Optimistic update
        setEvents(prev => prev.map(e =>
            (e.id === eventId || e.googleEventId === eventId)
                ? { ...e, start: newStart, end: newEnd }
                : e
        ));

        try {
            await handleUpdateEvent(event.googleEventId || event.id, {
                start: newStart,
                end: newEnd,
            });
        } catch (error) {
            console.error('Error moving event:', error);
            // Revert on error
            await fetchEvents();
        }
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        const now = new Date();

        if (mode === 'day') {
            const start = startOfDay(now);
            const end = endOfDay(addDays(now, 7));
            setDateRange({ start, end });
        } else if (mode === 'week') {
            const start = startOfWeek(now, { weekStartsOn: 1 });
            const end = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
            setDateRange({ start, end });
        } else {
            const start = startOfMonth(now);
            const end = endOfMonth(addMonths(now, 1));
            setDateRange({ start, end });
        }
    };

    const handleRefresh = useCallback(() => {
        fetchEvents();
    }, [fetchEvents]);

    return (
        <div className="space-y-4 fade-in h-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CalendarIcon className="w-6 h-6 text-blue-400" />
                        Smart Agenda
                    </h1>
                    <p className="text-white/50 mt-1 mb-4">
                        Calendario sincronizzato con Google Calendar
                    </p>

                    {/* AI Value Summary */}
                    {events.length > 0 && (
                        <div className="hidden sm:flex items-center gap-4 py-3 px-4 rounded-xl bg-blue-950/30 border border-blue-500/20 backdrop-blur-sm">
                            <div className="flex -space-x-2">
                                {events.filter(e => e.isAvixBooking).slice(0, 3).map(e => (
                                    <div key={e.id} className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs">
                                        <Bot size={14} />
                                    </div>
                                ))}
                                {events.filter(e => e.isAvixBooking).length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xs">
                                        +{events.filter(e => e.isAvixBooking).length - 3}
                                    </div>
                                )}
                            </div>
                            <div className="text-sm">
                                <span className="text-blue-400 font-bold">
                                    {events.filter(e => e.isAvixBooking).length} Appuntamenti AI
                                </span>
                                <span className="text-white/50 mx-1">in questa vista</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Create Event Button */}
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                                   bg-blue-600 hover:bg-blue-700
                                   text-white shadow-lg shadow-blue-600/25
                                   hover:shadow-xl hover:shadow-blue-600/30
                                   transition-all duration-300"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Evento</span>
                    </button>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-black/30 backdrop-blur-md rounded-xl border border-white/10">
                        <button
                            onClick={() => handleViewModeChange('day')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                                viewMode === 'day'
                                    ? 'bg-blue-600/15 text-white border border-blue-500/40'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            )}
                        >
                            <CalendarDays className="w-4 h-4" />
                            <span className="hidden sm:inline">Giorno</span>
                        </button>
                        <button
                            onClick={() => handleViewModeChange('week')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                                viewMode === 'week'
                                    ? 'bg-blue-600/15 text-white border border-blue-500/40'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            <span className="hidden sm:inline">Settimana</span>
                        </button>
                        <button
                            onClick={() => handleViewModeChange('month')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                                viewMode === 'month'
                                    ? 'bg-blue-600/15 text-white border border-blue-500/40'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline">Mese</span>
                        </button>
                    </div>

                    {loading && (
                        <div className="flex items-center gap-2 text-white/50">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm hidden sm:inline">Caricamento...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Error State */}
            {error && !loading && (
                <div className="glass-card p-4 border-l-4 border-yellow-500">
                    <p className="text-yellow-400 font-medium">⚠️ {error}</p>
                    <p className="text-white/50 text-sm mt-1">
                        Verifica le impostazioni del calendario nelle Impostazioni.
                    </p>
                </div>
            )}

            {/* Calendar Views */}
            {!error && (
                <>
                    {viewMode === 'day' ? (
                        <DayView
                            events={events}
                            onEventClick={handleEventClick}
                            onSlotClick={handleSlotClick}
                            onRefresh={handleRefresh}
                            loading={loading}
                        />
                    ) : viewMode === 'week' ? (
                        <WeekView
                            events={events}
                            onEventClick={handleEventClick}
                            onEventDrop={handleEventDrop}
                            onRefresh={handleRefresh}
                            loading={loading}
                        />
                    ) : (
                        <MonthView
                            events={events}
                            onEventClick={handleEventClick}
                            onDayClick={handleDayClick}
                            onRefresh={handleRefresh}
                            loading={loading}
                        />
                    )}
                </>
            )}

            {/* Create Event Modal */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateEvent}
                defaultDate={createModalDefaults.date}
                defaultTime={createModalDefaults.time}
            />

            {/* Edit Event Modal */}
            <EditEventModal
                event={selectedEvent}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleUpdateEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    );
}
