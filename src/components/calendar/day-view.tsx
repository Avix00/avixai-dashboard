'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import {
    format,
    isToday,
    addDays,
    subDays,
    startOfDay,
    isSameDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw, Bot, Clock } from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

// ============================================
// TYPES
// ============================================
interface DayViewProps {
    events: CalendarEvent[];
    selectedDate?: Date;
    onEventClick: (event: CalendarEvent) => void;
    onSlotClick?: (date: Date, hour: number) => void;
    onRefresh: () => void;
    loading?: boolean;
}

// ============================================
// EVENT BLOCK COMPONENT (Vertical)
// ============================================
function EventBlock({
    event,
    onClick
}: {
    event: CalendarEvent;
    onClick: () => void;
}) {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const startHour = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    const top = (startHour * HOUR_HEIGHT) + (startMinutes * HOUR_HEIGHT / 60);

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const height = Math.max((durationMinutes * HOUR_HEIGHT / 60), 30);

    const isAvix = event.isAvixBooking;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                'absolute left-2 right-2 rounded-lg p-3 cursor-pointer',
                'transition-all duration-200 overflow-hidden',
                'backdrop-blur-sm border',

                isAvix && [
                    'bg-gradient-to-br from-cyan-500/30 to-teal-500/20',
                    'border-cyan-500/40',
                    'hover:from-cyan-500/40 hover:to-teal-500/30',
                    'shadow-[0_4px_20px_rgba(34,211,238,0.2)]',
                    'hover:shadow-[0_4px_30px_rgba(34,211,238,0.3)]',
                ],

                !isAvix && [
                    'bg-gradient-to-br from-violet-500/30 to-purple-500/20',
                    'border-violet-500/40',
                    'hover:from-violet-500/40 hover:to-purple-500/30',
                    'shadow-[0_4px_20px_rgba(139,92,246,0.2)]',
                    'hover:shadow-[0_4px_30px_rgba(139,92,246,0.3)]',
                ]
            )}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                minHeight: '30px',
            }}
        >
            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                <Clock className="w-3 h-3" />
                {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
            </div>

            {/* Title */}
            <div className="flex items-center gap-2">
                {isAvix && <Bot className="w-4 h-4 text-cyan-300 flex-shrink-0" />}
                <span className={cn(
                    'font-semibold text-sm truncate',
                    isAvix ? 'text-cyan-100' : 'text-violet-100'
                )}>
                    {event.title}
                </span>
            </div>

            {/* Description (if height allows) */}
            {height > 60 && event.description && (
                <p className="text-xs text-white/50 mt-2 line-clamp-2">
                    {event.description}
                </p>
            )}
        </div>
    );
}

// ============================================
// MAIN DAY VIEW COMPONENT
// ============================================
export function DayView({
    events,
    selectedDate,
    onEventClick,
    onSlotClick,
    onRefresh,
    loading
}: DayViewProps) {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter events for current day
    const dayEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = new Date(event.start);
            return isSameDay(eventDate, currentDate);
        });
    }, [events, currentDate]);

    // Current time indicator position
    const currentTimePosition = useMemo(() => {
        if (!isToday(currentDate)) return null;
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        return (hours * HOUR_HEIGHT) + (minutes * HOUR_HEIGHT / 60);
    }, [currentDate, currentTime]);

    // Navigation handlers
    const handlePrevDay = useCallback(() => {
        setCurrentDate(prev => subDays(prev, 1));
    }, []);

    const handleNextDay = useCallback(() => {
        setCurrentDate(prev => addDays(prev, 1));
    }, []);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handleSlotClick = useCallback((hour: number) => {
        if (onSlotClick) {
            const slotDate = startOfDay(currentDate);
            slotDate.setHours(hour);
            onSlotClick(slotDate, hour);
        }
    }, [currentDate, onSlotClick]);

    const isTodayDate = isToday(currentDate);

    return (
        <div className="flex flex-col h-full">
            {/* ============================================
                HEADER - Navigation & Controls
                ============================================ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4 
                            bg-gradient-to-r from-white/[0.03] to-white/[0.06] 
                            backdrop-blur-xl rounded-2xl border border-white/10
                            shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                {/* Left: Navigation */}
                <div className="flex items-center gap-3">
                    {/* Today Button */}
                    <button
                        onClick={handleToday}
                        className={cn(
                            'px-4 py-2 font-semibold text-sm rounded-xl',
                            'border transition-all duration-300',
                            isTodayDate
                                ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        )}
                    >
                        Oggi
                    </button>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handlePrevDay}
                            className="p-2 rounded-xl bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNextDay}
                            className="p-2 rounded-xl bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Date Title */}
                    <div className="ml-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white capitalize">
                            {format(currentDate, 'EEEE', { locale: it })}
                        </h2>
                        <p className="text-sm text-white/50">
                            {format(currentDate, 'd MMMM yyyy', { locale: it })}
                        </p>
                    </div>
                </div>

                {/* Right: Refresh Button & Event Count */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50">
                        {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventi'}
                    </span>
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                            'bg-white/5 border border-white/10 text-white/70',
                            'hover:bg-white/10 hover:text-white transition-all duration-200',
                            loading && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        <span className="hidden sm:inline">Aggiorna</span>
                    </button>
                </div>
            </div>

            {/* ============================================
                DAY GRID
                ============================================ */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 
                            bg-black/20 backdrop-blur-xl
                            shadow-[0_0_60px_rgba(0,0,0,0.4)]">

                {/* Scrollable Container */}
                <div className="h-full overflow-y-auto">
                    <div className="flex">
                        {/* Time Gutter */}
                        <div className="w-16 flex-shrink-0 bg-slate-900/50 border-r border-white/5">
                            {HOURS.map(hour => (
                                <div
                                    key={hour}
                                    className="h-[60px] flex items-start justify-end pr-2 pt-1
                                               text-xs text-white/40 font-mono"
                                >
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Day Column */}
                        <div className="flex-1 relative">
                            {/* Hour Slots */}
                            {HOURS.map(hour => (
                                <div
                                    key={hour}
                                    onClick={() => handleSlotClick(hour)}
                                    className="h-[60px] border-b border-white/5 
                                               hover:bg-white/[0.02] cursor-pointer
                                               transition-colors duration-150"
                                />
                            ))}

                            {/* Events */}
                            {dayEvents.map(event => (
                                <EventBlock
                                    key={event.id}
                                    event={event}
                                    onClick={() => onEventClick(event)}
                                />
                            ))}

                            {/* Current Time Indicator */}
                            {currentTimePosition !== null && (
                                <div
                                    className="absolute left-0 right-0 z-30 pointer-events-none"
                                    style={{ top: `${currentTimePosition}px` }}
                                >
                                    <div className="relative">
                                        <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-500 
                                                        shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                        <div className="h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
