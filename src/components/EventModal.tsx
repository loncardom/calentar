import {
  CalendarClock,
  CarFront,
  ExternalLink,
  Map,
  MapPin,
  NotebookTabs,
  PiggyBank,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { SummerEvent } from '../types/Event';
import { formatLongDate, formatTimeRange, parseEventDate } from '../utils/dates';
import { getGoogleMapsUrl } from '../utils/maps';
import {
  getCostBadgeLabel,
  getEventEmoji,
  getLocationLine,
  statusLabel,
} from '../utils/presentation';

interface EventModalProps {
  event: SummerEvent | null;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!event) return undefined;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const timeout = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose();
        return;
      }

      if (keyboardEvent.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      previousFocus?.focus();
    };
  }, [event, onClose]);

  if (!event) return null;

  const mapsUrl = getGoogleMapsUrl(event.address, event.locationName, event.city);
  const primaryLink = event.ticketUrl || event.eventUrl;
  const exactDate = parseEventDate(event.date);
  const timeLabel = formatTimeRange(event.startTime, event.endTime) || 'TBD';

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <section
        className={`event-modal category-${event.category} status-${event.status}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        ref={panelRef}
      >
        <div className="modal-banner" aria-hidden="true">
          {getEventEmoji(event)}
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close details"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-title-row">
            <h2 id="event-modal-title">{event.title}</h2>
            <span className={`status-badge ${event.status}`}>
              {statusLabel[event.status]}
            </span>
          </div>

          <p className="modal-description">{event.description}</p>

          <dl className="detail-grid">
            <div>
              <dt>
                <CalendarClock aria-hidden="true" size={13} />
                Date
              </dt>
              <dd>{exactDate ? formatLongDate(exactDate) : event.dateLabel || 'TBD'}</dd>
            </div>
            <div>
              <dt>
                <CalendarClock aria-hidden="true" size={13} />
                Time
              </dt>
              <dd>{timeLabel}</dd>
            </div>
            <div>
              <dt>
                <MapPin aria-hidden="true" size={13} />
                Location
              </dt>
              <dd>
                {getLocationLine(event)}
                {event.address || event.city ? (
                  <span>{[event.address, event.city].filter(Boolean).join(', ')}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>
                <PiggyBank aria-hidden="true" size={13} />
                Cost
              </dt>
              <dd>{event.costLabel || getCostBadgeLabel(event)}</dd>
            </div>
            <div>
              <dt>
                <CarFront aria-hidden="true" size={13} />
                Getting there
              </dt>
              <dd>
                {event.driver ? <strong>{event.driver}</strong> : 'Driver TBD'}
                {event.transportationNotes ? <span>{event.transportationNotes}</span> : null}
              </dd>
            </div>
            <div>
              <dt>
                <UserRound aria-hidden="true" size={13} />
                Organizer
              </dt>
              <dd>{event.organizer || 'TBD'}</dd>
            </div>
          </dl>

          <div className="attendee-block">
            <h3>Attendees</h3>
            <div className="attendee-chips">
              {event.attendees.length
                ? event.attendees.map((attendee) => (
                    <span className="attendee-chip" key={attendee}>
                      {attendee}
                    </span>
                  ))
                : 'TBD'}
            </div>
          </div>

          {event.notes || event.imagePrompt ? (
            <div className="detail-section notes-section">
              <h3>
                <NotebookTabs aria-hidden="true" size={14} />
                Planning notes
              </h3>
              {event.notes ? <p>{event.notes}</p> : null}
              {event.imagePrompt ? (
                <p className="image-prompt">
                  <strong>Image prompt:</strong> {event.imagePrompt}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="tag-row modal-tags">
            <span className={`cat-tag tag-${event.category}`}>{event.category}</span>
            {event.tags.map((tag) => (
              <span className="soft-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="modal-actions">
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="primary-action">
                <Map aria-hidden="true" size={16} />
                Google Maps
              </a>
            ) : null}
            {primaryLink ? (
              <a href={primaryLink} target="_blank" rel="noreferrer" className="secondary-action">
                <ExternalLink aria-hidden="true" size={16} />
                Event link
              </a>
            ) : null}
            {!mapsUrl && !primaryLink ? <span className="no-actions">No links yet</span> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
