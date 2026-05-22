import {
  CalendarClock,
  CarFront,
  ExternalLink,
  Map,
  MapPin,
  NotebookTabs,
  PiggyBank,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { SummerEvent } from '../types/Event';
import { getEventDateLabel } from '../utils/dates';
import { getGoogleMapsUrl } from '../utils/maps';

interface EventModalProps {
  event: SummerEvent | null;
  onClose: () => void;
}

const statusLabel: Record<SummerEvent['status'], string> = {
  confirmed: 'Confirmed',
  planning: 'Planning',
  idea: 'Idea',
  cancelled: 'Cancelled',
};

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

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <section
        className={`event-modal category-${event.category}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        ref={panelRef}
      >
        <button
          type="button"
          className="icon-button close-button"
          onClick={onClose}
          ref={closeButtonRef}
          aria-label="Close details"
        >
          <X aria-hidden="true" size={22} />
        </button>

        <div className="modal-visual" aria-hidden="true">
          <div className="visual-art" />
        </div>

        <div className="modal-content">
          <div className="modal-kicker">
            <span className={`status-pill ${event.status}`}>
              {statusLabel[event.status]}
            </span>
            <span className="category-pill">{event.category}</span>
          </div>

          <h2 id="event-modal-title">{event.title}</h2>
          <p className="modal-description">{event.description}</p>

          <div className="modal-actions">
            {primaryLink ? (
              <a href={primaryLink} target="_blank" rel="noreferrer" className="primary-action">
                <ExternalLink aria-hidden="true" size={18} />
                Event link
              </a>
            ) : null}
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="secondary-action">
                <Map aria-hidden="true" size={18} />
                Google Maps
              </a>
            ) : null}
          </div>

          <dl className="detail-grid">
            <div>
              <dt>
                <CalendarClock aria-hidden="true" size={18} />
                Date and time
              </dt>
              <dd>{getEventDateLabel(event, true)}</dd>
            </div>
            <div>
              <dt>
                <MapPin aria-hidden="true" size={18} />
                Location
              </dt>
              <dd>
                {event.locationName || 'Location TBD'}
                {event.address || event.city ? (
                  <span>{[event.address, event.city].filter(Boolean).join(', ')}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>
                <UsersRound aria-hidden="true" size={18} />
                Attending
              </dt>
              <dd>{event.attendees.length ? event.attendees.join(', ') : 'TBD'}</dd>
            </div>
            <div>
              <dt>
                <UserRound aria-hidden="true" size={18} />
                Organizer
              </dt>
              <dd>{event.organizer || 'TBD'}</dd>
            </div>
            <div>
              <dt>
                <CarFront aria-hidden="true" size={18} />
                Transportation
              </dt>
              <dd>
                {event.driver ? <strong>{event.driver}</strong> : 'Driver TBD'}
                {event.transportationNotes ? <span>{event.transportationNotes}</span> : null}
              </dd>
            </div>
            <div>
              <dt>
                <PiggyBank aria-hidden="true" size={18} />
                Cost
              </dt>
              <dd>
                {event.costLabel || 'Cost TBD'}
                {event.costAmount !== null && event.currency ? (
                  <span>
                    Budget marker: {event.currency} {event.costAmount}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>

          <div className="detail-section">
            <h3>
              <Sparkles aria-hidden="true" size={18} />
              Tags
            </h3>
            <div className="tag-row">
              {event.tags.length ? event.tags.map((tag) => <span key={tag}>{tag}</span>) : 'No tags yet'}
            </div>
          </div>

          {event.notes || event.imagePrompt ? (
            <div className="detail-section notes-section">
              <h3>
                <NotebookTabs aria-hidden="true" size={18} />
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
        </div>
      </section>
    </div>
  );
}
