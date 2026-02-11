'use client';

import { CalendarEvent } from '@/lib/supabase/types';
import { Bot, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventPillProps {
    event: CalendarEvent;
}

export function EventPill({ event }: EventPillProps) {
    const isAvix = event.isAvixBooking;

    return (
        <div
            className={cn(
                // Base styles
                'group relative px-2.5 py-1.5 rounded-lg text-xs font-semibold',
                'flex items-center gap-1.5 cursor-pointer',
                'transition-all duration-300 ease-out',
                'backdrop-blur-sm',
                'overflow-hidden',

                // Avix AI Bookings - Cyan/Teal Theme
                isAvix && [
                    'bg-gradient-to-r from-cyan-500/25 to-teal-500/20',
                    'text-cyan-200',
                    'border border-cyan-400/30',
                    'shadow-[0_2px_10px_rgba(0,212,255,0.15)]',
                    'hover:from-cyan-500/35 hover:to-teal-500/30',
                    'hover:border-cyan-400/50',
                    'hover:shadow-[0_4px_20px_rgba(0,212,255,0.25)]',
                    'hover:translate-y-[-1px]',
                ],

                // Regular Events - Blue Theme (was Violet/Purple)
                !isAvix && [
                    'bg-gradient-to-r from-blue-600/25 to-blue-800/20',
                    'text-blue-100',
                    'border border-blue-500/30',
                    'shadow-[0_2px_10px_rgba(0,102,255,0.15)]',
                    'hover:from-blue-600/35 hover:to-blue-800/30',
                    'hover:border-blue-500/50',
                    'hover:shadow-[0_4px_20px_rgba(0,102,255,0.25)]',
                    'hover:translate-y-[-1px]',
                ]
            )}
        >
            {/* Glow effect on hover */}
            <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg',
                isAvix
                    ? 'bg-gradient-to-r from-cyan-400/10 via-transparent to-teal-400/10'
                    : 'bg-gradient-to-r from-blue-400/10 via-transparent to-blue-600/10'
            )} />

            {/* Icon */}
            {isAvix ? (
                <Bot className={cn(
                    'w-3.5 h-3.5 flex-shrink-0 relative z-10',
                    'text-cyan-300',
                    'drop-shadow-[0_0_3px_rgba(0,212,255,0.5)]'
                )} />
            ) : (
                <Clock className={cn(
                    'w-3 h-3 flex-shrink-0 relative z-10 opacity-70',
                    'text-blue-300'
                )} />
            )}

            {/* Event Title */}
            <span className="truncate relative z-10 leading-tight">
                {event.title}
            </span>

            {/* Time indicator for longer events in week/day view */}
            {event.start && (
                <span className={cn(
                    'hidden sm:inline-block ml-auto text-[10px] font-medium relative z-10',
                    isAvix ? 'text-cyan-400/70' : 'text-blue-400/70'
                )}>
                    {format(new Date(event.start), 'HH:mm')}
                </span>
            )}
        </div>
    );
}
