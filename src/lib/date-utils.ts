import { format, startOfDay, endOfDay, addDays, subDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";

/**
 * Returns the start and end of a day in UTC milliseconds
 */
export function getDayBounds(date: Date) {
  return {
    start: startOfDay(date).getTime(),
    end: endOfDay(date).getTime(),
  };
}

/**
 * Formats a date for the URL parameter (YYYY-MM-DD)
 */
export function formatDateForUrl(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Parses a date from the URL parameter (YYYY-MM-DD)
 */
export function parseDateFromUrl(dateStr: string | null): Date {
  if (!dateStr) return new Date();
  try {
    return parseISO(dateStr);
  } catch {
    return new Date();
  }
}

/**
 * Transposes current time to a specific date
 */
export function transposeTimeToDate(targetDate: Date): number {
  const now = new Date();
  const result = new Date(targetDate);
  result.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return result.getTime();
}

/**
 * Gets the last 7 days including today
 */
export function getRecentDays(count = 7) {
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    days.push(subDays(new Date(), i));
  }
  return days;
}

/**
 * Generates data for a month view calendar
 */
export function getMonthDays(date: Date) {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return eachDayOfInterval({ start, end });
}
