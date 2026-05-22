import {
  CalendarClock,
  MapPin,
} from 'lucide-react';
import type { SummerEvent } from '../types/Event';
import { getEventDateLabel } from '../utils/dates';
import {
  getCostBadgeLabel,
  getEventEmoji,
  getInitials,
  getLocationLine,
} from '../utils/presentation';

interface EventCardProps {
  event: SummerEvent;
  onSelect: (event: SummerEvent) => void;
  compact?: boolean;
}

export function EventCard({ event, onSelect, compact = false }: EventCardProps) {
  const visibleAttendees = event.attendees.slice(0, 3);
  const overflowCount = event.attendees.length - visibleAttendees.length;

  const handleKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      onSelect(event);
    }
  };

  if (compact) {
    return (
      <article
        className={`tentative-card category-${event.category} status-${event.status}`}
        tabIndex={0}
        role="button"
        aria-label={`Open details for ${event.title}`}
        onClick={() => onSelect(event)}
        onKeyDown={handleKeyDown}
      >
        <div className="tentative-icon" aria-hidden="true">
          {getEventEmoji(event)}
        </div>
        <div>
          <h3>{event.title}</h3>
          <p>
            {getEventDateLabel(event)} · {getCostBadgeLabel(event)}
          </p>
        </div>
      </article>
    );
  }

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
      <div className="card-banner" aria-hidden="true">
        {event.image ? <img src={event.image} alt="" /> : getEventEmoji(event)}
      </div>

      <div className="event-card-body">
        <div className="card-top">
          <h3>{event.title}</h3>
          <span className={`status-dot ${event.status}`} aria-label={event.status} />
        </div>

        <p className="card-date">
          <CalendarClock aria-hidden="true" size={13} />
          {getEventDateLabel(event)}
        </p>
        <p className="card-location">
          <MapPin aria-hidden="true" size={13} />
          {getLocationLine(event)}
        </p>

        <div className="card-tags">
          <span className={`cat-tag tag-${event.category}`}>{event.category}</span>
          {event.tags.slice(0, 1).map((tag) => (
            <span className="soft-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className="card-footer">
          <div className="avatars" aria-label="Attendees">
            {visibleAttendees.map((attendee, index) => (
              <span className={`avatar av-${index % 4}`} key={attendee}>
                {getInitials(attendee)}
              </span>
            ))}
            {overflowCount > 0 ? <span className="avatar av-more">+{overflowCount}</span> : null}
          </div>
          <span className={`cost-badge ${event.costAmount === 0 ? 'free' : ''}`}>
            {getCostBadgeLabel(event)}
          </span>
        </div>
      </div>
    </article>
  );
}
