'use client';

import { useState, useMemo, useCallback } from 'react';
import { CalendarEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw, Bot } from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================
const WEEKDAYS = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const MAX_EVENTS_VISIBLE = 3;

// ============================================
// TYPES
// ============================================
interface MonthViewProps {
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onDayClick: (date: Date) => void;
    onRefresh: () => void;
    loading?: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get all days to display in the month grid (including prev/next month padding)
function getMonthDays(date: Date): Date[] {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
}

// Group events by day
function groupEventsByDay(events: CalendarEvent[], days: Date[]): Map<string, CalendarEvent[]> {
    const grouped = new Map<string, CalendarEvent[]>();

    days.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        grouped.set(dayKey, []);
    });

    events.forEach(event => {
        const eventDate = new Date(event.start);
        const dayKey = format(eventDate, 'yyyy-MM-dd');
        const existing = grouped.get(dayKey);
        if (existing) {
            existing.push(event);
        }
    });

    return grouped;
}

// ============================================
// EVENT BAR COMPONENT (Stacked)
// ============================================
function EventBar({
    event,
    onClick
}: {
    event: CalendarEvent;
    onClick: () => void;
}) {
    const isAvix = event.isAvixBooking;
    const startTime = format(new Date(event.start), 'HH:mm');

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                'group flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                'cursor-pointer truncate transition-all duration-200',
                'backdrop-blur-sm',

                // Avix AI events - Blue theme
                isAvix && [
                    'bg-blue-950/40',
                    'border-l-2 border-blue-500',
                    'text-blue-100',
                    'hover:bg-blue-900/50',
                ],

                // Regular events - Slate theme
                !isAvix && [
                    'bg-slate-800/50',
                    'border-l-2 border-slate-500',
                    'text-slate-100',
                    'hover:bg-slate-700/50',
                ]
            )}
        >
            {isAvix && <Bot className="w-2.5 h-2.5 flex-shrink-0 text-blue-300" />}
            <span className="truncate">
                <span className="opacity-60 mr-1">{startTime}</span>
                {event.title}
            </span>
        </div>
    );
}

// ============================================
// DAY CELL COMPONENT
// ============================================
function DayCell({
    day,
    currentMonth,
    events,
    onDayClick,
    onEventClick
}: {
    day: Date;
    currentMonth: Date;
    events: CalendarEvent[];
    onDayClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
}) {
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isCurrentDay = isToday(day);
    const visibleEvents = events.slice(0, MAX_EVENTS_VISIBLE);
    const hiddenCount = events.length - MAX_EVENTS_VISIBLE;

    return (
        <div
            onClick={() => onDayClick(day)}
            className={cn(
                'min-h-[100px] p-1.5 border-r border-b border-white/5',
                'cursor-pointer transition-all duration-200',
                'hover:bg-white/[0.03]',
                !isCurrentMonth && 'opacity-30',
                isCurrentDay && 'bg-blue-500/[0.05]'
            )}
        >
            {/* Day Number */}
            <div className="flex justify-end mb-1">
                <span className={cn(
                    'text-sm font-semibold flex items-center justify-center',
                    isCurrentDay
                        ? 'w-7 h-7 rounded-full bg-blue-600 text-white'
                        : isCurrentMonth
                            ? 'text-white/80'
                            : 'text-white/30'
                )}>
                    {format(day, 'd')}
                </span>
            </div>

            {/* Events Stack */}
            <div className="space-y-0.5">
                {visibleEvents.map(event => (
                    <EventBar
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                    />
                ))}

                {/* Show More Indicator */}
                {hiddenCount > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDayClick(day);
                        }}
                        className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 
                                   px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20
                                   transition-all duration-200 w-full text-left"
                    >
                        +{hiddenCount} altri
                    </button>
                )}
            </div>
        </div>
    );
}

// ============================================
// MAIN MONTH VIEW COMPONENT
// ============================================
export function MonthView({ events, onEventClick, onDayClick, onRefresh, loading }: MonthViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get all days for the grid
    const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

    // Group events by day
    const eventsByDay = useMemo(() => groupEventsByDay(events, monthDays), [events, monthDays]);

    // Calculate number of weeks (rows)
    const weeksCount = Math.ceil(monthDays.length / 7);

    // Navigation handlers
    const handlePrevMonth = useCallback(() => {
        setCurrentMonth(prev => subMonths(prev, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentMonth(prev => addMonths(prev, 1));
    }, []);

    const handleToday = useCallback(() => {
        setCurrentMonth(new Date());
    }, []);

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
                        className="px-4 py-2 bg-blue-600 
                                   text-white font-semibold text-sm rounded-xl
                                   border border-blue-500/50 hover:bg-blue-700
                                   transition-all duration-300
                                   shadow-lg shadow-blue-600/25"
                    >
                        Oggi
                    </button>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 rounded-xl bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 rounded-xl bg-white/5 border border-white/10
                                       text-white/70 hover:text-white hover:bg-white/10
                                       transition-all duration-200"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Month/Year Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white ml-2 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: it })}
                    </h2>
                </div>

                {/* Right: Refresh Button */}
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

            {/* ============================================
                CALENDAR GRID CONTAINER
                ============================================ */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 
                            bg-black/20 backdrop-blur-xl
                            shadow-[0_0_60px_rgba(0,0,0,0.4)]">

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-gradient-to-b from-slate-900/95 to-slate-900/90 
                                border-b border-white/10">
                    {WEEKDAYS.map((day, index) => (
                        <div
                            key={day}
                            className={cn(
                                'py-3 text-center text-xs font-semibold uppercase tracking-wider',
                                'text-white/50 border-r border-white/5 last:border-r-0',
                                // Weekend styling
                                (index === 5 || index === 6) && 'text-white/30'
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div
                    className="grid grid-cols-7"
                    style={{
                        gridTemplateRows: `repeat(${weeksCount}, minmax(100px, 1fr))`,
                        height: `calc(100vh - 320px)`
                    }}
                >
                    {monthDays.map((day, index) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = eventsByDay.get(dayKey) || [];

                        return (
                            <DayCell
                                key={dayKey}
                                day={day}
                                currentMonth={currentMonth}
                                events={dayEvents}
                                onDayClick={onDayClick}
                                onEventClick={onEventClick}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
