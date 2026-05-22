import type { SummerEvent } from '../types/Event';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const parseEventDate = (value: string | null): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const hasExactDate = (event: SummerEvent): boolean =>
  parseEventDate(event.date) !== null;

export const sortEventsChronologically = (events: SummerEvent[]): SummerEvent[] =>
  [...events].sort((a, b) => {
    const dateA = parseEventDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const dateB = parseEventDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (dateA !== dateB) return dateA - dateB;
    return (a.startTime ?? '').localeCompare(b.startTime ?? '');
  });

export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);

export const formatLongDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

export const formatMonthYear = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);

export const formatTime = (time: string | null): string | null => {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2026, 0, 1, hours, minutes));
};

export const formatTimeRange = (
  startTime: string | null,
  endTime: string | null,
): string | null => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start && end) return `${start} - ${end}`;
  return start ?? end;
};

export const getEventDateLabel = (event: SummerEvent, long = false): string => {
  const exactDate = parseEventDate(event.date);
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const dateLabel = event.dateLabel?.trim();

  if (!exactDate) {
    return [dateLabel || 'Date TBD', timeRange].filter(Boolean).join(' · ');
  }

  const label = dateLabel || (long ? formatLongDate(exactDate) : formatDate(exactDate));
  return [label, timeRange].filter(Boolean).join(' · ');
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const buildMonthGrid = (monthDate: Date): CalendarDay[] => {
  const monthStart = startOfMonth(monthDate);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const today = new Date();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: isSameDay(date, today),
    };
  });
};

export const eventsOnDay = (events: SummerEvent[], date: Date): SummerEvent[] =>
  events.filter((event) => {
    const eventDate = parseEventDate(event.date);
    return eventDate ? isSameDay(eventDate, date) : false;
  });
