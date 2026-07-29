import { useMemo, useState } from 'react';
import eventsData from './data/events.json';
import additionalEventsData from './data/additionalEvents.json';
import farmEventsData from './data/farmEvents.json';
import eventOverridesData from './data/eventOverrides.json';
import restaurantsData from './data/restaurants.json';
import { summer2026Events } from './data/summer2026Events';
import { CalendarView } from './components/CalendarView';
import { EventCard } from './components/EventCard';
import { EventMapView } from './components/EventMapView';
import { EventModal } from './components/EventModal';
import { lastUpdatedAt } from './generated/buildInfo';
import type { SummerEvent } from './types/Event';
import type { Restaurant } from './types/Restaurant';
import {
  getCalendarRange,
  hasExactDate,
  isPastEvent,
  sortEventsChronologically,
  startOfDay,
  startOfMonth,
} from './utils/dates';

const eventOverrides = eventOverridesData as Record<string, Partial<SummerEvent>>;
const removedEventIds = new Set(['matisse-ago-impressionist-revolution']);
const events = ([
  ...(eventsData as SummerEvent[]),
  ...(additionalEventsData as SummerEvent[]),
  ...summer2026Events,
  ...(farmEventsData as SummerEvent[]),
])
  .map((event) => ({
    ...event,
    ...(eventOverrides[event.id] ?? {}),
  }))
  .filter((event) => !removedEventIds.has(event.id));
const restaurants = restaurantsData as Restaurant[];

const formatLastUpdatedDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
    timeZoneName: 'short',
  }).format(date);
};

const lastUpdatedLabel = formatLastUpdatedDate(lastUpdatedAt);

const getRestaurantUrl = (restaurant: Restaurant) => {
  if (restaurant.mapsUrl) {
    return restaurant.mapsUrl;
  }

  const query = encodeURIComponent(`${restaurant.name} ${restaurant.city}`);
  return `https://www.google.com/maps/search/${query}`;
};

function App() {
  const today = startOfDay(new Date());
  const firstUpcomingCalendarDate = events.reduce<Date | null>((earliest, event) => {
    const range = getCalendarRange(event);
    if (!range || range.startDate.getTime() < today.getTime()) return earliest;

    if (!earliest || range.startDate.getTime() < earliest.getTime()) {
      return range.startDate;
    }

    return earliest;
  }, null);
  const initialMonth = startOfMonth(firstUpcomingCalendarDate ?? new Date());
  const isMapRoute = window.location.pathname.replace(/\/+$/, '') === '/map';

  const [selectedEvent, setSelectedEvent] = useState<SummerEvent | null>(null);
  const [monthDate, setMonthDate] = useState<Date>(initialMonth);
  const [isPastExpanded, setIsPastExpanded] = useState(false);

  const activeEvents = useMemo(() => events.filter((event) => !isPastEvent(event)), []);
  const pastEvents = useMemo(
    () => sortEventsChronologically(events.filter((event) => isPastEvent(event))).reverse(),
    [],
  );
  const datedEvents = useMemo(
    () => sortEventsChronologically(activeEvents.filter(hasExactDate)),
    [activeEvents],
  );
  const tentativeEvents = useMemo(
    () => activeEvents.filter((event) => !hasExactDate(event)),
    [activeEvents],
  );
  const calendarEvents = useMemo(() => sortEventsChronologically(events), []);

  return (
    <div className="app-shell">
      {isMapRoute ? (
        <EventMapView events={activeEvents} onSelect={setSelectedEvent} />
      ) : (
        <main>
          <div className="tiles-view">
            <div className="view-link-row">
              <a href="/map" className="map-view-link">Open map view</a>
            </div>

            <CalendarView
              monthDate={monthDate}
              calendarEvents={calendarEvents}
              onMonthChange={setMonthDate}
              onSelect={setSelectedEvent}
            />

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
                <div className="empty-state">No dated events yet. Add a date in the JSON.</div>
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
                    <EventCard event={event} onSelect={setSelectedEvent} key={event.id} compact />
                  ))}
                </div>
              ) : (
                <div className="empty-state">No tentative events. The planning board is clear.</div>
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
                <button
                  type="button"
                  className="section-toggle"
                  aria-expanded={isPastExpanded}
                  onClick={() => setIsPastExpanded((expanded) => !expanded)}
                >
                  <span className="toggle-marker" aria-hidden="true">
                    {isPastExpanded ? '−' : '+'}
                  </span>
                  <span className="section-toggle-label">Past events</span>
                </button>
                <span>{pastEvents.length}</span>
              </div>
              {isPastExpanded ? (
                pastEvents.length ? (
                  <div className="event-grid tentative-grid">
                    {pastEvents.map((event) => (
                      <EventCard event={event} onSelect={setSelectedEvent} key={event.id} compact />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No past events.</div>
                )
              ) : null}
            </section>
          </div>
        </main>
      )}

      {lastUpdatedLabel ? (
        <footer className="site-footer" title={`${lastUpdatedAt} · America/Toronto`}>
          Last updated {lastUpdatedLabel} Toronto time
        </footer>
      ) : null}

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

export default App;
