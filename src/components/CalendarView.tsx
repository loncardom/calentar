import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SummerEvent } from '../types/Event';
import {
  addMonths,
  buildMonthGrid,
  eventsOnDay,
  formatMonthYear,
  hasExactDate,
} from '../utils/dates';
import { getEventEmoji } from '../utils/presentation';

interface CalendarViewProps {
  monthDate: Date;
  calendarEvents: SummerEvent[];
  onMonthChange: (date: Date) => void;
  onSelect: (event: SummerEvent) => void;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ monthDate, calendarEvents, onMonthChange, onSelect }: CalendarViewProps) {
  const days = buildMonthGrid(monthDate);

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
          {days.map((day) => {
            const dayEvents = eventsOnDay(calendarEvents, day.date);
            const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

            return (
              <div
                className={`calendar-day ${day.isCurrentMonth ? '' : 'muted'} ${day.isToday ? 'today' : ''}`}
                key={key}
              >
                <span className="day-number">{day.dayNumber}</span>
                <div className="day-events">
                  {dayEvents.map((event) => (
                    <button
                      type="button"
                      className={`calendar-event category-${event.category} ${
                        hasExactDate(event) ? '' : 'tentative'
                      }`}
                      onClick={() => onSelect(event)}
                      key={event.id}
                    >
                      <span>
                        {getEventEmoji(event)} {event.title}
                      </span>
                      <small>{event.startTime || event.dateLabel || 'All day'}</small>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
