import { useMemo, useState } from 'react';
import { CalendarCheck, PartyPopper, Sparkles, UsersRound } from 'lucide-react';
import eventsData from './data/events.json';
import { CalendarView } from './components/CalendarView';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { Filters, type FilterState } from './components/Filters';
import { ViewToggle } from './components/ViewToggle';
import type { EventCategory, EventStatus, EventView, SummerEvent } from './types/Event';
import {
  hasExactDate,
  parseEventDate,
  sortEventsChronologically,
  startOfMonth,
} from './utils/dates';

const events = eventsData as SummerEvent[];

const defaultFilters: FilterState = {
  search: '',
  status: 'all',
  category: 'all',
  attendee: 'all',
};

const matchesSearch = (event: SummerEvent, search: string): boolean => {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [
    event.title,
    event.locationName,
    event.address,
    event.city,
    event.description,
    event.notes,
    event.dateLabel,
    event.transportationNotes,
    ...event.attendees,
    ...event.tags,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

function App() {
  const firstDatedEvent = sortEventsChronologically(events).find((event) =>
    hasExactDate(event),
  );
  const initialMonth = startOfMonth(parseEventDate(firstDatedEvent?.date ?? null) ?? new Date());

  const [view, setView] = useState<EventView>('tiles');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedEvent, setSelectedEvent] = useState<SummerEvent | null>(null);
  const [monthDate, setMonthDate] = useState<Date>(initialMonth);

  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category))).sort() as EventCategory[],
    [],
  );
  const statuses = useMemo(
    () => Array.from(new Set(events.map((event) => event.status))).sort() as EventStatus[],
    [],
  );
  const attendees = useMemo(
    () => Array.from(new Set(events.flatMap((event) => event.attendees))).sort(),
    [],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (filters.status !== 'all' && event.status !== filters.status) return false;
        if (filters.category !== 'all' && event.category !== filters.category) return false;
        if (filters.attendee !== 'all' && !event.attendees.includes(filters.attendee)) {
          return false;
        }
        return matchesSearch(event, filters.search);
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
  const confirmedCount = events.filter((event) => event.status === 'confirmed').length;
  const attendeeCount = attendees.length;
  const nextEvent = datedEvents[0];

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles aria-hidden="true" size={18} />
            Summer 2026
          </div>
          <h1>Friend summer plans</h1>
          <p>
            A shared snapshot of what is booked, what is tentative, who is coming,
            how rides work, and what still needs a decision.
          </p>

          <div className="hero-actions">
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        <div className="hero-dashboard" aria-label="Plan summary">
          <div>
            <CalendarCheck aria-hidden="true" size={22} />
            <span>{events.length}</span>
            <small>Total plans</small>
          </div>
          <div>
            <PartyPopper aria-hidden="true" size={22} />
            <span>{confirmedCount}</span>
            <small>Confirmed</small>
          </div>
          <div>
            <UsersRound aria-hidden="true" size={22} />
            <span>{attendeeCount}</span>
            <small>Friends</small>
          </div>
        </div>
      </header>

      <main>
        <Filters
          filters={filters}
          categories={categories}
          statuses={statuses}
          attendees={attendees}
          onChange={setFilters}
        />

        <section className="summary-strip" aria-label="Current selection summary">
          <p>
            Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong>{' '}
            plans.
          </p>
          {nextEvent ? (
            <p>
              Next up: <strong>{nextEvent.title}</strong>
            </p>
          ) : (
            <p>No dated plans match the current filters.</p>
          )}
        </section>

        {view === 'tiles' ? (
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
        ) : (
          <CalendarView
            monthDate={monthDate}
            datedEvents={datedEvents}
            tentativeEvents={tentativeEvents}
            onMonthChange={setMonthDate}
            onSelect={setSelectedEvent}
          />
        )}
      </main>

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default App;
