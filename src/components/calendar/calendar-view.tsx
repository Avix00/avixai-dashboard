'use client';

import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarEvent } from '@/lib/supabase/types';
import { EventPill } from './event-pill';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, List, LayoutGrid } from 'lucide-react';

// Setup date-fns localizer for react-big-calendar
const locales = { it };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onRangeChange: (range: { start: Date; end: Date }) => void;
  loading?: boolean;
}

// Custom Toolbar Component with Deep Glassmorphism
function CustomToolbar({ label, onNavigate, onView, view }: ToolbarProps<CalendarEvent, object>) {
  const viewOptions = [
    { key: Views.MONTH, label: 'Mese', icon: LayoutGrid },
    { key: Views.WEEK, label: 'Settimana', icon: CalendarIcon },
    { key: Views.DAY, label: 'Giorno', icon: Clock },
    { key: Views.AGENDA, label: 'Agenda', icon: List },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 
                        bg-gradient-to-r from-white/[0.03] to-white/[0.06] 
                        backdrop-blur-xl rounded-2xl border border-white/10
                        shadow-[0_0_30px_rgba(0,0,0,0.3)]">
      {/* Left Side - Navigation */}
      <div className="flex items-center gap-3">
        {/* Today Button */}
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 
                               text-cyan-300 font-semibold text-sm rounded-xl
                               border border-cyan-500/30 hover:border-cyan-400/50
                               hover:from-cyan-500/30 hover:to-violet-500/30
                               transition-all duration-300
                               shadow-[0_0_15px_rgba(34,211,238,0.15)]
                               hover:shadow-[0_0_25px_rgba(34,211,238,0.25)]"
        >
          Oggi
        </button>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 rounded-xl bg-white/5 border border-white/10
                                   text-white/70 hover:text-white hover:bg-white/10
                                   transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-xl bg-white/5 border border-white/10
                                   text-white/70 hover:text-white hover:bg-white/10
                                   transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Month/Year Label */}
        <h2 className="text-xl sm:text-2xl font-bold text-white capitalize ml-2
                               bg-gradient-to-r from-white via-white/90 to-white/70 
                               bg-clip-text text-transparent">
          {label}
        </h2>
      </div>

      {/* Right Side - View Switcher */}
      <div className="flex items-center gap-1 p-1.5 
                            bg-black/30 backdrop-blur-md rounded-xl 
                            border border-white/10">
        {viewOptions.map(({ key, label: viewLabel, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onView(key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
              view === key
                ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-white shadow-[0_0_20px_rgba(34,211,238,0.2)] border border-cyan-500/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{viewLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CalendarView({ events, onEventClick, onRangeChange, loading }: CalendarViewProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Custom event component
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => (
    <EventPill event={event} />
  ), []);

  // Handle navigation and range changes
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
    const start = startOfMonth(newDate);
    const end = endOfMonth(addMonths(newDate, 1));
    onRangeChange({ start, end });
  }, [onRangeChange]);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Custom toolbar messages in Italian
  const messages = useMemo(() => ({
    today: 'Oggi',
    previous: 'Precedente',
    next: 'Successivo',
    month: 'Mese',
    week: 'Settimana',
    day: 'Giorno',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Ora',
    event: 'Evento',
    noEventsInRange: 'Nessun evento in questo periodo',
    showMore: (total: number) => `+${total} altri`,
  }), []);

  // Format for month header
  const formats = useMemo(() => ({
    monthHeaderFormat: 'MMMM yyyy',
    weekdayFormat: 'EEE',
    dayHeaderFormat: 'EEEE d MMMM',
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'd MMM', { locale: it })} - ${format(end, 'd MMM yyyy', { locale: it })}`,
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
  }), []);

  return (
    <div className={cn(
      'relative calendar-container rounded-2xl overflow-hidden',
      'bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40',
      'backdrop-blur-xl border border-white/10',
      'shadow-[0_0_60px_rgba(0,0,0,0.4),0_0_100px_rgba(34,211,238,0.05)]',
      'p-4 sm:p-6',
      loading && 'opacity-60'
    )}>
      {/* Ambient Glow Effects */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Calendar */}
      <div className="relative z-10">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          view={view}
          date={date}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={onEventClick}
          messages={messages}
          formats={formats}
          culture="it"
          components={{
            event: EventComponent,
            toolbar: CustomToolbar,
          }}
          style={{ height: 700 }}
          popup
          selectable={false}
        />
      </div>

      {/* Custom CSS for Deep Glassmorphism */}
      <style jsx global>{`
                /* ============================================
                   BASE CALENDAR STYLES
                   ============================================ */
                .calendar-container .rbc-calendar {
                    background: transparent;
                    font-family: inherit;
                }

                /* ============================================
                   HEADERS - Weekday Names
                   ============================================ */
                .calendar-container .rbc-header {
                    background: linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
                    border: none;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 1rem 0.5rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    font-size: 0.7rem;
                    letter-spacing: 0.1em;
                }

                .calendar-container .rbc-header + .rbc-header {
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                }

                /* ============================================
                   MONTH VIEW - Grid
                   ============================================ */
                .calendar-container .rbc-month-view {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(10px);
                }

                .calendar-container .rbc-month-row {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    min-height: 100px;
                }

                .calendar-container .rbc-month-row:last-child {
                    border-bottom: none;
                }

                .calendar-container .rbc-day-bg {
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s ease;
                }

                .calendar-container .rbc-day-bg:first-child {
                    border-left: none;
                }

                .calendar-container .rbc-day-bg:hover {
                    background: rgba(255, 255, 255, 0.03);
                }

                /* Days from other months */
                .calendar-container .rbc-off-range-bg {
                    background: rgba(0, 0, 0, 0.3);
                }

                .calendar-container .rbc-off-range {
                    color: rgba(255, 255, 255, 0.25);
                }

                /* TODAY - Highlighted Cell */
                .calendar-container .rbc-today {
                    background: linear-gradient(135deg, 
                        rgba(34, 211, 238, 0.08) 0%, 
                        rgba(139, 92, 246, 0.05) 100%);
                }

                /* ============================================
                   DATE CELLS - Day Numbers
                   ============================================ */
                .calendar-container .rbc-date-cell {
                    color: rgba(255, 255, 255, 0.8);
                    padding: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    text-align: right;
                }

                .calendar-container .rbc-date-cell.rbc-now {
                    font-weight: 700;
                }

                .calendar-container .rbc-date-cell.rbc-now > a {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%);
                    border-radius: 50%;
                    color: white !important;
                    text-decoration: none;
                    box-shadow: 0 0 20px rgba(34, 211, 238, 0.4),
                                0 0 40px rgba(139, 92, 246, 0.2);
                    animation: pulse-glow 2s ease-in-out infinite alternate;
                }

                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 15px rgba(34, 211, 238, 0.3), 0 0 30px rgba(139, 92, 246, 0.15); }
                    100% { box-shadow: 0 0 25px rgba(34, 211, 238, 0.5), 0 0 50px rgba(139, 92, 246, 0.25); }
                }

                /* ============================================
                   EVENTS - General Styling
                   ============================================ */
                .calendar-container .rbc-event {
                    background: transparent;
                    border: none;
                    padding: 0;
                    margin: 1px 2px;
                }

                .calendar-container .rbc-event:focus {
                    outline: none;
                }

                .calendar-container .rbc-event-content {
                    overflow: visible;
                }

                .calendar-container .rbc-row-segment {
                    padding: 0 2px;
                }

                /* Show More Indicator */
                .calendar-container .rbc-show-more {
                    color: #22d3ee;
                    font-size: 0.75rem;
                    font-weight: 600;
                    background: rgba(34, 211, 238, 0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin: 2px 4px;
                    transition: all 0.2s;
                }

                .calendar-container .rbc-show-more:hover {
                    background: rgba(34, 211, 238, 0.2);
                    box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
                }

                /* ============================================
                   EVENT POPUP / OVERLAY
                   ============================================ */
                .calendar-container .rbc-overlay {
                    background: rgba(2, 6, 23, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 1rem;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5),
                                0 0 30px rgba(34, 211, 238, 0.1);
                    padding: 0.75rem;
                    min-width: 200px;
                }

                .calendar-container .rbc-overlay-header {
                    color: white;
                    font-weight: 700;
                    font-size: 0.875rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.5rem 0.75rem;
                    margin: -0.75rem -0.75rem 0.5rem -0.75rem;
                    background: linear-gradient(to right, rgba(34, 211, 238, 0.1), transparent);
                    border-radius: 1rem 1rem 0 0;
                }

                /* ============================================
                   WEEK / DAY VIEW - Time Grid
                   ============================================ */
                .calendar-container .rbc-time-view {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.2);
                }

                .calendar-container .rbc-time-header {
                    background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .calendar-container .rbc-time-header-content {
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                }

                .calendar-container .rbc-allday-cell {
                    background: rgba(255, 255, 255, 0.02);
                }

                .calendar-container .rbc-time-content {
                    border-top: none;
                }

                /* Time Gutter - Hours Column */
                .calendar-container .rbc-time-gutter {
                    background: rgba(0, 0, 0, 0.3);
                }

                .calendar-container .rbc-timeslot-group {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    min-height: 50px;
                }

                .calendar-container .rbc-time-slot {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.7rem;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                }

                .calendar-container .rbc-label {
                    padding: 0 8px;
                }

                /* Day Column Slots */
                .calendar-container .rbc-day-slot .rbc-time-slot {
                    border-top: 1px solid rgba(255, 255, 255, 0.03);
                }

                .calendar-container .rbc-day-slot .rbc-events-container {
                    margin-right: 0;
                }

                /* Time-based Events in Week/Day View */
                .calendar-container .rbc-time-view .rbc-event {
                    background: linear-gradient(135deg, 
                        rgba(139, 92, 246, 0.3) 0%, 
                        rgba(34, 211, 238, 0.2) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.4);
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
                    backdrop-filter: blur(4px);
                    padding: 4px 8px;
                    transition: all 0.2s ease;
                }

                .calendar-container .rbc-time-view .rbc-event:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3),
                                0 0 30px rgba(34, 211, 238, 0.15);
                }

                .calendar-container .rbc-time-view .rbc-event-label {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.65rem;
                    font-weight: 500;
                }

                .calendar-container .rbc-time-view .rbc-event-content {
                    color: white;
                    font-weight: 600;
                    font-size: 0.8rem;
                }

                /* CURRENT TIME INDICATOR - Glowing Line */
                .calendar-container .rbc-current-time-indicator {
                    background: linear-gradient(to right, 
                        transparent 0%, 
                        #22d3ee 20%, 
                        #22d3ee 80%, 
                        transparent 100%);
                    height: 2px;
                    box-shadow: 0 0 10px #22d3ee,
                                0 0 20px rgba(34, 211, 238, 0.5),
                                0 0 40px rgba(34, 211, 238, 0.3);
                    position: relative;
                }

                .calendar-container .rbc-current-time-indicator::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: -4px;
                    width: 10px;
                    height: 10px;
                    background: #22d3ee;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #22d3ee,
                                0 0 20px #22d3ee;
                }

                /* ============================================
                   AGENDA VIEW - List Style
                   ============================================ */
                .calendar-container .rbc-agenda-view {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.2);
                }

                .calendar-container .rbc-agenda-view table {
                    border: none;
                }

                .calendar-container .rbc-agenda-view thead {
                    display: none;
                }

                .calendar-container .rbc-agenda-date-cell {
                    color: white;
                    font-weight: 600;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    background: linear-gradient(to right, rgba(34, 211, 238, 0.05), transparent);
                    white-space: nowrap;
                    vertical-align: top;
                }

                .calendar-container .rbc-agenda-time-cell {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.85rem;
                    padding: 1rem 0.75rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    white-space: nowrap;
                    vertical-align: top;
                }

                .calendar-container .rbc-agenda-event-cell {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    color: white;
                    font-weight: 500;
                }

                .calendar-container .rbc-agenda-empty {
                    color: rgba(255, 255, 255, 0.4);
                    text-align: center;
                    padding: 3rem;
                    font-size: 0.9rem;
                }

                /* ============================================
                   SCROLLBAR STYLING
                   ============================================ */
                .calendar-container .rbc-time-content::-webkit-scrollbar {
                    width: 6px;
                }

                .calendar-container .rbc-time-content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 3px;
                }

                .calendar-container .rbc-time-content::-webkit-scrollbar-thumb {
                    background: rgba(34, 211, 238, 0.3);
                    border-radius: 3px;
                }

                .calendar-container .rbc-time-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(34, 211, 238, 0.5);
                }
            `}</style>
    </div>
  );
}
