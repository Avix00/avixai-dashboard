'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    isToday,
    differenceInMinutes,
    startOfDay,
    addWeeks,
    subWeeks
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Bot } from 'lucide-react';

// Constants
const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 0;   // 00:00
const END_HOUR = 24;    // 24:00 (full day)
const TOTAL_HOURS = END_HOUR - START_HOUR;

interface WeekViewGridProps {
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

// Calculate event position and height
function getEventStyle(event: CalendarEvent, dayStart: Date): React.CSSProperties {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Minutes from start of day
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();

    // Calculate position
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 30); // Min height 30px

    return {
        top: `${top}px`,
        height: `${height}px`,
    };
}

// Generate hours array
const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

// Generate weekdays
function getWeekDays(date: Date): Date[] {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Event Card Component
function EventCard({
    event,
    style,
    onClick
}: {
    event: CalendarEvent;
    style: React.CSSProperties;
    onClick: () => void;
}) {
    const isAvix = event.isAvixBooking;
    const startTime = format(new Date(event.start), 'HH:mm');
    const endTime = format(new Date(event.end), 'HH:mm');

    return (
        <div
            onClick={onClick}
            style={style}
            className={cn(
                'absolute left-1 right-1 rounded-lg cursor-pointer overflow-hidden',
                'transition-all duration-200 ease-out group',
                'backdrop-blur-sm',

                // Avix AI events - Blue theme
                isAvix && [
                    'bg-blue-950/40',
                    'border-l-4 border-blue-500',
                    'hover:bg-blue-900/50',
                    'shadow-md',
                ],

                // Regular events - Slate theme
                !isAvix && [
                    'bg-slate-800/50',
                    'border-l-4 border-slate-500',
                    'hover:bg-slate-700/50',
                    'shadow-md',
                ]
            )}
        >
            <div className="p-2 h-full flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                    {isAvix && <Bot className="w-3 h-3 text-blue-300 flex-shrink-0" />}
                    <span className={cn(
                        'text-xs font-semibold truncate',
                        isAvix ? 'text-blue-100' : 'text-slate-100'
                    )}>
                        {event.title}
                    </span>
                </div>
                <span className={cn(
                    'text-[10px] font-medium',
                    isAvix ? 'text-blue-300/70' : 'text-slate-300/70'
                )}>
                    {startTime} - {endTime}
                </span>
            </div>
        </div>
    );
}

// Current Time Indicator
function CurrentTimeIndicator() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const minutes = now.getHours() * 60 + now.getMinutes();
    const top = (minutes / 60) * HOUR_HEIGHT;

    return (
        <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${top}px` }}
        >
            {/* Blue dot */}
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            {/* Blue line */}
            <div className="h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
        </div>
    );
}

export function WeekViewGrid({ events, onEventClick, currentDate, onDateChange }: WeekViewGridProps) {
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Group events by day
    const eventsByDay = useMemo(() => {
        const grouped: Record<string, CalendarEvent[]> = {};

        weekDays.forEach(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            grouped[dayKey] = events.filter(event =>
                isSameDay(new Date(event.start), day)
            );
        });

        return grouped;
    }, [events, weekDays]);

    const handlePrevWeek = useCallback(() => {
        onDateChange(subWeeks(currentDate, 1));
    }, [currentDate, onDateChange]);

    const handleNextWeek = useCallback(() => {
        onDateChange(addWeeks(currentDate, 1));
    }, [currentDate, onDateChange]);

    const handleToday = useCallback(() => {
        onDateChange(new Date());
    }, [onDateChange]);

    return (
        <div className="flex flex-col h-full">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4 
                            bg-gradient-to-r from-white/[0.03] to-white/[0.06] 
                            backdrop-blur-xl rounded-2xl border border-white/10
                            shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                {/* Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 bg-blue-600 
                                   text-white font-semibold text-sm rounded-xl
                                   border border-blue-500/50 hover:bg-blue-700
                                   transition-all duration-300
                                   shadow-lg shadow-blue-600/25"
                    >
                        Oggi
                    </button>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={handlePrevWeek}
                            className="p-2 rounded-xl bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNextWeek}
                            className="p-2 rounded-xl bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Week Range Label */}
                    <h2 className="text-lg sm:text-xl font-bold text-white ml-2">
                        {format(weekDays[0], 'd MMM', { locale: it })} - {format(weekDays[6], 'd MMM yyyy', { locale: it })}
                    </h2>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 
                            bg-black/20 backdrop-blur-xl
                            shadow-[0_0_60px_rgba(0,0,0,0.4)]">

                {/* Sticky Header - Day Names */}
                <div className="flex sticky top-0 z-30 bg-gradient-to-b from-slate-900/95 to-slate-900/90 backdrop-blur-xl border-b border-white/10">
                    {/* Time gutter header */}
                    <div className="w-16 sm:w-20 flex-shrink-0 border-r border-white/5 p-2">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">GMT+01</span>
                    </div>

                    {/* Day headers */}
                    {weekDays.map((day, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex-1 text-center py-3 px-1 border-r border-white/5 last:border-r-0',
                                isToday(day) && 'bg-blue-500/10'
                            )}
                        >
                            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">
                                {format(day, 'EEE', { locale: it })}
                            </div>
                            <div className={cn(
                                'text-lg sm:text-xl font-bold',
                                isToday(day)
                                    ? 'text-white bg-blue-600 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto'
                                    : 'text-white/80'
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}                </div>

                {/* Scrollable Time Grid */}
                <div className="overflow-y-auto overflow-x-hidden" style={{ height: 'calc(100vh - 320px)' }}>
                    <div className="relative flex">
                        {/* Time Gutter */}
                        <div className="w-16 sm:w-20 flex-shrink-0 border-r border-white/5">
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    className="relative border-b border-white/5"
                                    style={{ height: HOUR_HEIGHT }}
                                >
                                    <span className="absolute -top-2.5 right-2 text-[11px] font-medium text-white/40">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {weekDays.map((day, dayIndex) => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const dayEvents = eventsByDay[dayKey] || [];
                            const today = isToday(day);

                            return (
                                <div
                                    key={dayIndex}
                                    className={cn(
                                        'flex-1 relative border-r border-white/5 last:border-r-0',
                                        today && 'bg-blue-500/[0.03]'
                                    )}
                                >
                                    {/* Hour lines */}
                                    {hours.map(hour => (
                                        <div
                                            key={hour}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                            style={{ height: HOUR_HEIGHT }}
                                        />
                                    ))}

                                    {/* Current Time Indicator (only for today) */}
                                    {today && <CurrentTimeIndicator />}

                                    {/* Events */}
                                    {dayEvents.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            style={getEventStyle(event, day)}
                                            onClick={() => onEventClick(event)}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
