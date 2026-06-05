import { useMemo, useState } from 'react';
import eventsData from './data/events.json';
import eventOverridesData from './data/eventOverrides.json';
import restaurantsData from './data/restaurants.json';
import { CalendarView } from './components/CalendarView';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { Filters, type FilterState } from './components/Filters';
import type { SummerEvent } from './types/Event';
import type { Restaurant } from './types/Restaurant';
import {
  hasExactDate,
  isPastEvent,
  parseEventDate,
  sortEventsChronologically,
  startOfMonth,
} from './utils/dates';

const eventOverrides = eventOverridesData as Record<string, Partial<SummerEvent>>;
const events = (eventsData as SummerEvent[]).map((event) => ({
  ...event,
  ...(eventOverrides[event.id] ?? {}),
}));
const restaurants = restaurantsData as Restaurant[];

const defaultFilters: FilterState = {
  attendee: 'all',
};

const getRestaurantUrl = (restaurant: Restaurant) => {
  if (restaurant.mapsUrl) {
    return restaurant.mapsUrl;
  }

  const query = encodeURIComponent(`${restaurant.name} ${restaurant.city}`);
  return `https://www.google.com/maps/search/${query}`;
};

function App() {
  const firstDatedEvent = sortEventsChronologically(events).find((event) =>
    hasExactDate(event) && !isPastEvent(event),
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

  const activeEvents = useMemo(
    () => filteredEvents.filter((event) => !isPastEvent(event)),
    [filteredEvents],
  );
  const pastEvents = useMemo(
    () => sortEventsChronologically(filteredEvents.filter((event) => isPastEvent(event))).reverse(),
    [filteredEvents],
  );
  const datedEvents = useMemo(
    () => sortEventsChronologically(activeEvents.filter(hasExactDate)),
    [activeEvents],
  );
  const tentativeEvents = useMemo(
    () => activeEvents.filter((event) => !hasExactDate(event)),
    [activeEvents],
  );
  const calendarEvents = useMemo(
    () => sortEventsChronologically(filteredEvents),
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
            calendarEvents={calendarEvents}
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

          <section className="event-section">
            <div className="section-heading">
              <h2>Restaurants</h2>
              <span>{restaurants.length}</span>
            </div>
            <div className="event-grid tentative-grid">
              {restaurants.map((restaurant) => (
                <a
                  className="tentative-card category-food"
                  href={getRestaurantUrl(restaurant)}
                  target="_blank"
                  rel="noreferrer"
                  key={restaurant.id}
                >
                  <div className="tentative-icon" aria-hidden="true">
                    🍽️
                  </div>
                  <div>
                    <h3>{restaurant.name}</h3>
                    <p>{restaurant.city} · Open in Maps</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="event-section planning-section">
            <div className="section-heading">
              <h2>Past events</h2>
              <span>{pastEvents.length}</span>
            </div>
            {pastEvents.length ? (
              <div className="event-grid tentative-grid">
                {pastEvents.map((event) => (
                  <EventCard
                    event={event}
                    onSelect={setSelectedEvent}
                    key={event.id}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">No past events match these filters.</div>
            )}
          </section>
        </div>
      </main>

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default App;
