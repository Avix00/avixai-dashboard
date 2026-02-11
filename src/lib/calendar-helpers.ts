import { calendar_v3 } from 'googleapis';

export const TIMEZONE = 'Europe/Rome';
export const BUSINESS_HOURS_START = 9; // 09:00
export const BUSINESS_HOURS_END = 18;  // 18:00
export const SLOT_DURATION_MINUTES = 30;

/**
 * Standardized error response for AI agents.
 */
export function createCalendarError(code: string, message: string, status = 400) {
    return Response.json(
        { error: code, message },
        { status }
    );
}

/**
 * Helper to parse a date string (ISO or YYYY-MM-DD) into a Date object
 * and ensure it represents the start of the day in Rome time if only date is provided.
 */
export function parseDateToRome(dateStr: string): Date {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
    }
    return date;
}

/**
 * Generate 30-minute slots for a given day within business hours.
 */
export function generateDaySlots(date: Date): Date[] {
    const slots: Date[] = [];
    const startHour = new Date(date);
    startHour.setHours(BUSINESS_HOURS_START, 0, 0, 0);

    const endHour = new Date(date);
    endHour.setHours(BUSINESS_HOURS_END, 0, 0, 0);

    let current = new Date(startHour);
    while (current < endHour) {
        slots.push(new Date(current));
        current.setMinutes(current.getMinutes() + SLOT_DURATION_MINUTES);
    }

    return slots;
}

/**
 * Check if a specific time slot is free given a list of existing events.
 * Note: simplistic check, assumes events don't overlap strangely.
 */
export function isSlotFree(slotStart: Date, events: calendar_v3.Schema$Event[]): boolean {
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION_MINUTES);

    return !events.some(event => {
        if (!event.start?.dateTime || !event.end?.dateTime) return false;

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Check for overlap
        return (slotStart < eventEnd && slotEnd > eventStart);
    });
}
