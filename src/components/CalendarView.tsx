import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SummerEvent } from '../types/Event';
import {
  addMonths,
  buildMonthGrid,
  formatMonthYear,
  getCalendarRange,
  hasExactDate,
  isSameDay,
} from '../utils/dates';
import type { CalendarDay } from '../utils/dates';
import { getEventEmoji } from '../utils/presentation';

interface CalendarViewProps {
  monthDate: Date;
  calendarEvents: SummerEvent[];
  onMonthChange: (date: Date) => void;
  onSelect: (event: SummerEvent) => void;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarSegment {
  event: SummerEvent;
  startColumn: number;
  span: number;
  lane: number;
  showLabel: boolean;
}

type UnplacedSegment = Omit<CalendarSegment, 'lane' | 'showLabel'>;

const compareEventStartTime = (a: SummerEvent, b: SummerEvent): number =>
  (a.startTime ?? '').localeCompare(b.startTime ?? '');

function buildWeekSegment(event: SummerEvent, week: CalendarDay[]): UnplacedSegment | null {
  const range = getCalendarRange(event);
  const weekStart = week[0]?.date;
  const weekEnd = week[6]?.date;

  if (!range || !weekStart || !weekEnd) return null;
  if (range.endDate < weekStart || range.startDate > weekEnd) return null;

  const startDate = range.startDate < weekStart ? weekStart : range.startDate;
  const endDate = range.endDate > weekEnd ? weekEnd : range.endDate;
  const startColumn = week.findIndex((day) => isSameDay(day.date, startDate)) + 1;
  const endColumn = week.findIndex((day) => isSameDay(day.date, endDate)) + 1;

  if (!startColumn || !endColumn) return null;

  return {
    event,
    startColumn,
    span: endColumn - startColumn + 1,
  };
}

function buildWeekSegments(
  calendarEvents: SummerEvent[],
  weeks: CalendarDay[][],
): CalendarSegment[][] {
  const segments = weeks.map((week) => {
    const occupiedThrough: number[] = [];
    const weekSegments = calendarEvents
      .map((event) => buildWeekSegment(event, week))
      .filter((segment): segment is UnplacedSegment => segment !== null)
      .sort(
        (a, b) =>
          a.startColumn - b.startColumn ||
          compareEventStartTime(a.event, b.event) ||
          b.span - a.span ||
          Number(hasExactDate(b.event)) - Number(hasExactDate(a.event)),
      );

    return weekSegments.map((segment) => {
      let lane = occupiedThrough.findIndex((lastColumn) => lastColumn < segment.startColumn);
      if (lane === -1) {
        lane = occupiedThrough.length;
      }
      occupiedThrough[lane] = segment.startColumn + segment.span - 1;

      return { ...segment, lane, showLabel: false };
    });
  });

  const labelSegments = new Map<string, CalendarSegment>();
  segments.flat().forEach((segment) => {
    const current = labelSegments.get(segment.event.id);
    if (!current || segment.span > current.span) {
      labelSegments.set(segment.event.id, segment);
    }
  });

  return segments.map((weekSegments) =>
    weekSegments.map((segment) => ({
      ...segment,
      showLabel: labelSegments.get(segment.event.id) === segment,
    })),
  );
}

export function CalendarView({
  monthDate,
  calendarEvents,
  onMonthChange,
  onSelect,
}: CalendarViewProps) {
  const days = buildMonthGrid(monthDate);
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const weekSegments = buildWeekSegments(calendarEvents, weeks);

  return (
    <section className="calendar-layout" aria-label="Calendar view">
      <div className="calendar-shell">
        <div className="calendar-toolbar">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            onClick={() => onMonthChange(addMonths(monthDate, -1))}
          >
            <ChevronLeft aria-hidden="true" size={22} />
          </button>
          <div className="calendar-heading">
            <h2>{formatMonthYear(monthDate)}</h2>
            <p>Dashed plans are tentative windows</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(monthDate, 1))}
          >
            <ChevronRight aria-hidden="true" size={22} />
          </button>
        </div>

        <div className="month-grid">
          {weekDays.map((day) => (
            <div className="weekday-row" key={day}>
              {day}
            </div>
          ))}
          {weeks.map((week, weekIndex) => (
            <div className="calendar-week" key={week[0].date.toISOString()}>
              {week.map((day, dayIndex) => {
                const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

                return (
                  <div
                    className={`calendar-day ${day.isCurrentMonth ? '' : 'muted'} ${day.isToday ? 'today' : ''}`}
                    key={key}
                    style={{ gridColumn: dayIndex + 1 }}
                  >
                    <span className="day-number">{day.dayNumber}</span>
                  </div>
                );
              })}
              <div className="week-events">
                {weekSegments[weekIndex].map((segment) => (
                  <button
                    type="button"
                    className={`calendar-event category-${segment.event.category} ${
                      hasExactDate(segment.event) ? '' : 'tentative'
                    }`}
                    aria-label={`Open details for ${segment.event.title}`}
                    onClick={() => onSelect(segment.event)}
                    key={segment.event.id}
                    style={{
                      gridColumn: `${segment.startColumn} / span ${segment.span}`,
                      gridRow: segment.lane + 1,
                    }}
                  >
                    {segment.showLabel ? (
                      <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-all' }}>
                        {getEventEmoji(segment.event)} {segment.event.title}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
