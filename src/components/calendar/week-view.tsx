'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    isToday,
    addWeeks,
    subWeeks,
    addMinutes,
    differenceInMinutes
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw, Bot, GripVertical } from 'lucide-react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';

// ============================================
// CONSTANTS
// ============================================
const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_IN_WEEK = 7;
const HEADER_HEIGHT = 80;
const TIME_GUTTER_WIDTH = 70;

// ============================================
// TYPES
// ============================================
interface WeekViewProps {
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
    onRefresh: () => void;
    loading?: boolean;
}

interface EventPosition {
    top: number;
    height: number;
    dayIndex: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getWeekDays(date: Date): Date[] {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
}

function calculateEventPosition(event: CalendarEvent, weekDays: Date[]): EventPosition | null {
    const eventStart = new Date(event.start);
    const dayIndex = weekDays.findIndex(day => isSameDay(day, eventStart));
    if (dayIndex === -1) return null;

    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const eventEnd = new Date(event.end);
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
    const durationMinutes = Math.max(endMinutes - startMinutes, 30);

    return {
        top: startMinutes,
        height: durationMinutes,
        dayIndex
    };
}

// ============================================
// CURRENT TIME INDICATOR
// ============================================
function CurrentTimeIndicator({ weekDays }: { weekDays: Date[] }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const todayIndex = weekDays.findIndex(day => isToday(day));
    if (todayIndex === -1) return null;

    const minutes = now.getHours() * 60 + now.getMinutes();
    const columnWidth = `calc((100% - ${TIME_GUTTER_WIDTH}px) / ${DAYS_IN_WEEK})`;
    const left = `calc(${TIME_GUTTER_WIDTH}px + (${columnWidth} * ${todayIndex}))`;

    return (
        <div
            className="absolute z-30 pointer-events-none"
            style={{ top: `${minutes}px`, left, width: columnWidth }}
        >
            <div className="absolute w-3 h-3 rounded-full bg-blue-500 -left-1.5 -top-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
            <div className="h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        </div>
    );
}

// ============================================
// TIME GUTTER DOT
// ============================================
function TimeGutterCurrentDot() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const minutes = now.getHours() * 60 + now.getMinutes();

    return (
        <div
            className="absolute right-0 w-2 h-2 rounded-full bg-blue-500 z-20 shadow-[0_0_6px_rgba(59,130,246,0.8)]"
            style={{ top: `${minutes - 4}px` }}
        />
    );
}

// ============================================
// DRAGGABLE EVENT CARD
// ============================================
function DraggableEventCard({
    event,
    position,
    onClick,
    isDragging
}: {
    event: CalendarEvent;
    position: EventPosition;
    onClick: () => void;
    isDragging?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: event.id,
        data: { event, position }
    });

    const isAvix = event.isAvixBooking;
    const startTime = format(new Date(event.start), 'HH:mm');
    const endTime = format(new Date(event.end), 'HH:mm');

    const columnWidth = `calc((100% - ${TIME_GUTTER_WIDTH}px) / ${DAYS_IN_WEEK})`;
    const left = `calc(${TIME_GUTTER_WIDTH}px + (${columnWidth} * ${position.dayIndex}) + 4px)`;
    const width = `calc(${columnWidth} - 8px)`;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) onClick();
            }}
            className={cn(
                'absolute rounded-lg cursor-grab overflow-hidden',
                'transition-shadow duration-200 ease-out group',
                'backdrop-blur-md touch-none',
                isDragging && 'opacity-50 cursor-grabbing',
                isAvix && [
                    'bg-blue-950/40 backdrop-blur-sm',
                    'border-l-4 border-blue-500',
                    'shadow-lg',
                ],
                !isAvix && [
                    'bg-slate-800/50 backdrop-blur-sm',
                    'border-l-4 border-slate-500',
                    'shadow-md',
                ]
            )}
            style={{
                top: `${position.top}px`,
                height: `${Math.max(position.height, 30)}px`,
                left,
                width,
                ...style
            }}
            {...listeners}
            {...attributes}
        >
            <div className="p-2 h-full flex flex-col overflow-hidden relative">
                {/* Drag Handle */}
                <div className="absolute top-1 right-1 opacity-30 group-hover:opacity-70 transition-opacity">
                    <GripVertical className="w-3 h-3 text-white" />
                </div>

                {/* Title */}
                <div className="flex items-center gap-1.5">
                    {isAvix && <Bot className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />}
                    <span className={cn('text-xs font-bold truncate', isAvix ? 'text-blue-50' : 'text-slate-100')}>
                        {event.title}
                    </span>
                </div>

                {/* Time */}
                {position.height >= 45 && (
                    <span className={cn('text-[10px] font-semibold mt-0.5', isAvix ? 'text-blue-200/80' : 'text-slate-300/80')}>
                        {startTime} - {endTime}
                    </span>
                )}

                {/* Attendee */}
                {position.height >= 70 && event.attendeeName && (
                    <span className={cn('text-[10px] mt-1 truncate', isAvix ? 'text-blue-300/60' : 'text-slate-400/60')}>
                        {event.attendeeName}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// DROPPABLE HOUR SLOT
// ============================================
function DroppableHourSlot({
    dayIndex,
    hour,
    onClick
}: {
    dayIndex: number;
    hour: number;
    onClick: () => void;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `slot-${dayIndex}-${hour}`,
        data: { dayIndex, hour }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'border-b border-white/5 transition-colors cursor-pointer',
                isOver ? 'bg-blue-500/20' : 'hover:bg-white/[0.02]'
            )}
            style={{ height: `${HOUR_HEIGHT}px` }}
            onClick={onClick}
        />
    );
}

// ============================================
// DRAG OVERLAY (preview while dragging)
// ============================================
function DragPreview({ event }: { event: CalendarEvent }) {
    const isAvix = event.isAvixBooking;

    return (
        <div className={cn(
            'rounded-lg p-2 cursor-grabbing shadow-2xl',
            'backdrop-blur-xl border',
            isAvix
                ? 'bg-blue-500/60 border-blue-400'
                : 'bg-violet-500/60 border-violet-400',
            'shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
        )}>
            <div className="flex items-center gap-1.5">
                {isAvix && <Bot className="w-3.5 h-3.5 text-white" />}
                <span className="text-xs font-bold text-white">{event.title}</span>
            </div>
        </div>
    );
}

// ============================================
// MAIN WEEK VIEW COMPONENT
// ============================================
export function WeekView({ events, onEventClick, onEventDrop, onRefresh, loading }: WeekViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Configure sensors for mouse and touch
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: { distance: 8 }
    });
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: { delay: 200, tolerance: 5 }
    });
    const sensors = useSensors(mouseSensor, touchSensor);

    // Event positions
    const eventPositions = useMemo(() => {
        const positions: Array<{ event: CalendarEvent; position: EventPosition }> = [];
        events.forEach(event => {
            const position = calculateEventPosition(event, weekDays);
            if (position) positions.push({ event, position });
        });
        return positions;
    }, [events, weekDays]);

    // Scroll to current time on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            scrollContainerRef.current.scrollTop = Math.max(0, currentMinutes - 120);
        }
    }, []);

    // Navigation handlers
    const handlePrevWeek = useCallback(() => setCurrentDate(prev => subWeeks(prev, 1)), []);
    const handleNextWeek = useCallback(() => setCurrentDate(prev => addWeeks(prev, 1)), []);
    const handleToday = useCallback(() => setCurrentDate(new Date()), []);

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        const draggedEvent = eventPositions.find(ep => ep.event.id === event.active.id)?.event;
        if (draggedEvent) setActiveEvent(draggedEvent);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveEvent(null);

        if (!event.over || !onEventDrop) return;

        const { dayIndex, hour } = event.over.data.current as { dayIndex: number; hour: number };
        const draggedEvent = eventPositions.find(ep => ep.event.id === event.active.id)?.event;

        if (!draggedEvent) return;

        // Calculate new times
        const newStartDate = new Date(weekDays[dayIndex]);
        newStartDate.setHours(hour, 0, 0, 0);

        const originalDuration = differenceInMinutes(
            new Date(draggedEvent.end),
            new Date(draggedEvent.start)
        );
        const newEndDate = addMinutes(newStartDate, originalDuration);

        onEventDrop(draggedEvent.googleEventId || draggedEvent.id, newStartDate, newEndDate);
    };

    const handleSlotClick = (dayIndex: number, hour: number) => {
        const day = weekDays[dayIndex];
        const clickedTime = new Date(day);
        clickedTime.setHours(hour, 0, 0, 0);
        console.log('Create event at:', format(clickedTime, 'EEEE d MMMM yyyy HH:mm', { locale: it }));
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4 
                                bg-gradient-to-r from-white/[0.03] to-white/[0.06] 
                                backdrop-blur-xl rounded-2xl border border-white/10
                                shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 
                                       text-cyan-300 font-semibold text-sm rounded-xl
                                       border border-cyan-500/30 hover:border-cyan-400/50
                                       transition-all duration-300
                                       shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                        >
                            Oggi
                        </button>
                        <div className="flex items-center gap-1">
                            <button onClick={handlePrevWeek} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handleNextWeek} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white ml-2">
                            {format(weekDays[0], 'd MMM', { locale: it })} - {format(weekDays[6], 'd MMM yyyy', { locale: it })}
                        </h2>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                            'bg-white/5 border border-white/10 text-white/70',
                            'hover:bg-white/10 hover:text-white transition-all',
                            loading && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        <span className="hidden sm:inline">Aggiorna</span>
                    </button>
                </div>

                {/* CALENDAR GRID */}
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                    {/* STICKY HEADER */}
                    <div className="sticky top-0 z-40 flex bg-gradient-to-b from-slate-900/98 to-slate-900/95 backdrop-blur-xl border-b border-white/10" style={{ height: `${HEADER_HEIGHT}px` }}>
                        <div className="flex-shrink-0 flex items-end justify-center pb-2 border-r border-white/5" style={{ width: `${TIME_GUTTER_WIDTH}px` }}>
                            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">GMT+01</span>
                        </div>
                        {weekDays.map((day, index) => (
                            <div key={index} className={cn('flex-1 flex flex-col items-center justify-center py-3 border-r border-white/5 last:border-r-0', isToday(day) && 'bg-blue-500/10')}>
                                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1">{format(day, 'EEE', { locale: it })}</span>
                                <span className={cn('text-xl sm:text-2xl font-bold flex items-center justify-center', isToday(day) ? 'w-10 h-10 rounded-full bg-blue-600 text-white' : 'text-white/80')}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* SCROLLABLE TIME GRID */}
                    <div ref={scrollContainerRef} className="overflow-y-auto overflow-x-hidden relative" style={{ height: `calc(100vh - 280px)` }}>
                        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                            {/* Time Gutter */}
                            <div className="absolute left-0 top-0 bottom-0 bg-black/30 border-r border-white/5" style={{ width: `${TIME_GUTTER_WIDTH}px` }}>
                                {HOURS.map(hour => (
                                    <div key={hour} className="relative border-b border-white/5 flex items-start justify-end pr-3" style={{ height: `${HOUR_HEIGHT}px` }}>
                                        <span className="text-[11px] font-medium text-white/40 -mt-2">{hour.toString().padStart(2, '0')}:00</span>
                                    </div>
                                ))}
                                {weekDays.some(day => isToday(day)) && <TimeGutterCurrentDot />}
                            </div>

                            {/* Day Columns with Droppable Slots */}
                            {weekDays.map((day, dayIndex) => {
                                const columnWidth = `calc((100% - ${TIME_GUTTER_WIDTH}px) / ${DAYS_IN_WEEK})`;
                                const left = `calc(${TIME_GUTTER_WIDTH}px + (${columnWidth} * ${dayIndex}))`;

                                return (
                                    <div key={dayIndex} className={cn('absolute top-0 bottom-0 border-r border-white/5 last:border-r-0', isToday(day) && 'bg-blue-500/[0.03]')} style={{ left, width: columnWidth }}>
                                        {HOURS.map(hour => (
                                            <DroppableHourSlot
                                                key={hour}
                                                dayIndex={dayIndex}
                                                hour={hour}
                                                onClick={() => handleSlotClick(dayIndex, hour)}
                                            />
                                        ))}
                                    </div>
                                );
                            })}

                            {/* Current Time Indicator */}
                            <CurrentTimeIndicator weekDays={weekDays} />

                            {/* Draggable Events */}
                            {eventPositions.map(({ event, position }) => (
                                <DraggableEventCard
                                    key={event.id}
                                    event={event}
                                    position={position}
                                    onClick={() => onEventClick(event)}
                                    isDragging={activeEvent?.id === event.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeEvent && <DragPreview event={activeEvent} />}
            </DragOverlay>
        </DndContext>
    );
}
