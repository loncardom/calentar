import {
  CalendarClock,
  CarFront,
  ExternalLink,
  MapPin,
  PiggyBank,
  UsersRound,
} from 'lucide-react';
import type { SummerEvent } from '../types/Event';
import { getEventDateLabel } from '../utils/dates';

interface EventCardProps {
  event: SummerEvent;
  onSelect: (event: SummerEvent) => void;
  compact?: boolean;
}

const categoryIcon: Record<SummerEvent['category'], string> = {
  movie: 'Cinema',
  show: 'Stage',
  trip: 'Escape',
  outdoor: 'Sun',
  food: 'Table',
  other: 'Plan',
};

const statusLabel: Record<SummerEvent['status'], string> = {
  confirmed: 'Confirmed',
  planning: 'Planning',
  idea: 'Idea',
  cancelled: 'Cancelled',
};

export function EventCard({ event, onSelect, compact = false }: EventCardProps) {
  const hasLink = Boolean(event.ticketUrl || event.eventUrl);
  const location = [event.locationName, event.city].filter(Boolean).join(' · ');

  const handleKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      onSelect(event);
    }
  };

  return (
    <article
      className={`event-card category-${event.category} status-${event.status} ${
        compact ? 'compact' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Open details for ${event.title}`}
      onClick={() => onSelect(event)}
      onKeyDown={handleKeyDown}
    >
      <div className="event-visual" aria-hidden="true">
        {event.image ? <img src={event.image} alt="" /> : <div className="visual-art" />}
        <span>{categoryIcon[event.category]}</span>
      </div>

      <div className="event-card-body">
        <div className="card-heading-row">
          <span className={`status-pill ${event.status}`}>
            {statusLabel[event.status]}
          </span>
          <span className="category-pill">{event.category}</span>
        </div>

        <h3>{event.title}</h3>
        <p className="description">{event.description}</p>

        <dl className="event-facts">
          <div>
            <dt>
              <CalendarClock aria-hidden="true" size={16} />
              When
            </dt>
            <dd>{getEventDateLabel(event)}</dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" size={16} />
              Where
            </dt>
            <dd>
              {location || event.locationName || 'Location TBD'}
              {event.address ? <span>{event.address}</span> : null}
            </dd>
          </div>
          <div>
            <dt>
              <UsersRound aria-hidden="true" size={16} />
              Going
            </dt>
            <dd>{event.attendees.length ? event.attendees.join(', ') : 'TBD'}</dd>
          </div>
          <div>
            <dt>
              <PiggyBank aria-hidden="true" size={16} />
              Cost
            </dt>
            <dd>{event.costLabel || 'Cost TBD'}</dd>
          </div>
          {event.driver || event.transportationNotes ? (
            <div>
              <dt>
                <CarFront aria-hidden="true" size={16} />
                Ride
              </dt>
              <dd>{event.driver || event.transportationNotes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="tag-row" aria-label="Tags">
          {event.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {hasLink ? (
          <a
            className="card-link"
            href={event.ticketUrl || event.eventUrl || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            Open link
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        ) : null}
      </div>
    </article>
  );
}
