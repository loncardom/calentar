import { useMemo, useState } from 'react';
import eventsData from './data/events.json';
import { CalendarView } from './components/CalendarView';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { Filters, type FilterState } from './components/Filters';
import type { SummerEvent } from './types/Event';
import {
  hasExactDate,
  parseEventDate,
  sortEventsChronologically,
  startOfMonth,
} from './utils/dates';

const events = eventsData as SummerEvent[];

const defaultFilters: FilterState = {
  attendee: 'all',
};

function App() {
  const firstDatedEvent = sortEventsChronologically(events).find((event) =>
    hasExactDate(event),
  );
  const initialMonth = startOfMonth(parseEventDate(firstDatedEvent?.date ?? null) ?? new Date());

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedEvent, setSelectedEvent] = useState<SummerEvent | null>(null);
  const [monthDate, setMonthDate] = useState<Date>(initialMonth);

  const attendees = useMemo(
    () => Array.from(new Set(events.flatMap((event) => event.attendees))).sort(),
    [],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (filters.attendee !== 'all' && !event.attendees.includes(filters.attendee)) {
          return false;
        }
        return true;
      }),
    [filters],
  );

  const datedEvents = useMemo(
    () => sortEventsChronologically(filteredEvents.filter(hasExactDate)),
    [filteredEvents],
  );
  const tentativeEvents = useMemo(
    () => filteredEvents.filter((event) => !hasExactDate(event)),
    [filteredEvents],
  );

  return (
    <div className="app-shell">
      <main>
        <section className="summary-strip" aria-label="Current selection summary">
          <p>
            Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong>{' '}
            plans.
          </p>
          <Filters filters={filters} attendees={attendees} onChange={setFilters} />
        </section>

        <div className="tiles-view">
          <section className="event-section">
            <div className="section-heading">
              <h2>Dated plans</h2>
              <span>{datedEvents.length}</span>
            </div>
            {datedEvents.length ? (
              <div className="event-grid">
                {datedEvents.map((event) => (
                  <EventCard event={event} onSelect={setSelectedEvent} key={event.id} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No dated events match these filters. Clear a filter or add a date in the JSON.
              </div>
            )}
          </section>

          <CalendarView
            monthDate={monthDate}
            datedEvents={datedEvents}
            onMonthChange={setMonthDate}
            onSelect={setSelectedEvent}
          />

          <section className="event-section planning-section">
            <div className="section-heading">
              <h2>Still planning</h2>
              <span>{tentativeEvents.length}</span>
            </div>
            {tentativeEvents.length ? (
              <div className="event-grid tentative-grid">
                {tentativeEvents.map((event) => (
                  <EventCard
                    event={event}
                    onSelect={setSelectedEvent}
                    key={event.id}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No tentative events match these filters. The planning board is clear.
              </div>
            )}
          </section>
        </div>
      </main>

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default App;
