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
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
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

const closeAnimationMs = 220;
const dragActivationThreshold = 6;
const dragDismissThreshold = 80;

export function EventModal({ event, onClose }: EventModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const modalHistoryEntryRef = useRef<string | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const hasActiveDragRef = useRef(false);
  const suppressBannerClickRef = useRef(false);
  const [renderedEvent, setRenderedEvent] = useState<SummerEvent | null>(event);
  const [isClosing, setIsClosing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragDismissing, setIsDragDismissing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (event) {
      setRenderedEvent(event);
      setIsClosing(false);
      setIsDragging(false);
      setIsDragDismissing(false);
      setDragOffset(0);
      dragStartYRef.current = null;
      dragPointerIdRef.current = null;
      hasActiveDragRef.current = false;
      suppressBannerClickRef.current = false;
      return undefined;
    }

    if (!renderedEvent) return undefined;

    setIsClosing(true);
    const timeout = window.setTimeout(() => {
      setRenderedEvent(null);
      setIsClosing(false);
      setIsDragging(false);
      setIsDragDismissing(false);
      setDragOffset(0);
      dragStartYRef.current = null;
      dragPointerIdRef.current = null;
      hasActiveDragRef.current = false;
      suppressBannerClickRef.current = false;
    }, closeAnimationMs);

    return () => window.clearTimeout(timeout);
  }, [event, renderedEvent]);

  useEffect(() => {
    if (!event) return undefined;

    const modalHistoryEntry = `event-modal-${event.id}`;
    modalHistoryEntryRef.current = modalHistoryEntry;
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        modalHistoryEntry,
      },
      '',
      window.location.href,
    );

    const handlePopState = () => {
      if (modalHistoryEntryRef.current !== modalHistoryEntry) return;

      modalHistoryEntryRef.current = null;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      if (
        modalHistoryEntryRef.current === modalHistoryEntry &&
        window.history.state?.modalHistoryEntry === modalHistoryEntry
      ) {
        modalHistoryEntryRef.current = null;
        window.history.back();
      }
    };
  }, [event]);

  useEffect(() => {
    if (!renderedEvent) return undefined;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const timeout = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        setIsDragDismissing(false);
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
  }, [renderedEvent, onClose]);

  if (!renderedEvent) return null;

  const mapsUrl = getGoogleMapsUrl(renderedEvent.address, renderedEvent.locationName, renderedEvent.city);
  const primaryLink = renderedEvent.ticketUrl || renderedEvent.eventUrl;
  const exactDate = parseEventDate(renderedEvent.date);
  const timeLabel = formatTimeRange(renderedEvent.startTime, renderedEvent.endTime) || 'TBD';
  const modalStyle = { '--sheet-drag-y': `${dragOffset}px` } as CSSProperties;

  const closeNormally = () => {
    setIsDragDismissing(false);
    onClose();
  };

  const resetDrag = () => {
    dragStartYRef.current = null;
    dragPointerIdRef.current = null;
    hasActiveDragRef.current = false;
    setIsDragging(false);
    setIsDragDismissing(false);
    setDragOffset(0);
  };

  const shouldIgnoreDragTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && target.closest('.modal-close');

  const handleDragPointerDown = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    if (pointerEvent.button !== 0 || shouldIgnoreDragTarget(pointerEvent.target)) return;

    dragStartYRef.current = pointerEvent.clientY;
    dragPointerIdRef.current = pointerEvent.pointerId;
    hasActiveDragRef.current = false;
    setIsDragDismissing(false);
    setDragOffset(0);
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    pointerEvent.stopPropagation();
  };

  const handleDragPointerMove = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    if (
      dragPointerIdRef.current !== pointerEvent.pointerId ||
      dragStartYRef.current === null
    ) {
      return;
    }

    const rawOffset = pointerEvent.clientY - dragStartYRef.current;
    const nextOffset = Math.max(0, rawOffset);

    if (!hasActiveDragRef.current) {
      if (rawOffset < dragActivationThreshold) return;

      hasActiveDragRef.current = true;
      suppressBannerClickRef.current = true;
      setIsDragging(true);
    }

    setDragOffset(nextOffset);
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
  };

  const handleDragPointerUp = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    if (
      dragPointerIdRef.current !== pointerEvent.pointerId ||
      dragStartYRef.current === null
    ) {
      return;
    }

    const nextOffset = Math.max(0, pointerEvent.clientY - dragStartYRef.current);
    const wasDragging = hasActiveDragRef.current;

    dragStartYRef.current = null;
    dragPointerIdRef.current = null;
    hasActiveDragRef.current = false;

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }

    pointerEvent.stopPropagation();

    if (!wasDragging) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    if (nextOffset >= dragDismissThreshold) {
      setIsDragging(false);
      setIsDragDismissing(true);
      setDragOffset(Math.max(window.innerHeight, nextOffset + 420));
      onClose();
      return;
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  const handleDragPointerCancel = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }

    resetDrag();
  };

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'closing' : ''} ${isDragDismissing ? 'drag-dismissing' : ''}`}
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) closeNormally();
      }}
    >
      <section
        className={`event-modal category-${renderedEvent.category} status-${renderedEvent.status} ${isDragging ? 'dragging' : ''} ${isDragDismissing ? 'drag-dismissing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        ref={panelRef}
        style={modalStyle}
      >
        <div
          className="modal-banner"
          onClick={(mouseEvent) => {
            mouseEvent.stopPropagation();

            if (suppressBannerClickRef.current) {
              mouseEvent.preventDefault();
              suppressBannerClickRef.current = false;
            }
          }}
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerCancel}
        >
          <span className="sheet-drag-indicator" aria-hidden="true" />
          <span className="modal-banner-emoji" aria-hidden="true">
            {getEventEmoji(renderedEvent)}
          </span>
          <button
            type="button"
            className="modal-close"
            onClick={closeNormally}
            ref={closeButtonRef}
            aria-label="Close details"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-title-row">
            <h2 id="event-modal-title">{renderedEvent.title}</h2>
            <span className={`status-badge ${renderedEvent.status}`}>
              {statusLabel[renderedEvent.status]}
            </span>
          </div>

          <p className="modal-description">{renderedEvent.description}</p>

          <dl className="detail-grid">
            <div>
              <dt>
                <CalendarClock aria-hidden="true" size={13} />
                Date
              </dt>
              <dd>{exactDate ? formatLongDate(exactDate) : renderedEvent.dateLabel || 'TBD'}</dd>
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
                {getLocationLine(renderedEvent)}
                {renderedEvent.address || renderedEvent.city ? (
                  <span>{[renderedEvent.address, renderedEvent.city].filter(Boolean).join(', ')}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>
                <PiggyBank aria-hidden="true" size={13} />
                Cost
              </dt>
              <dd>{renderedEvent.costLabel || getCostBadgeLabel(renderedEvent)}</dd>
            </div>
            <div>
              <dt>
                <CarFront aria-hidden="true" size={13} />
                Getting there
              </dt>
              <dd>
                {renderedEvent.driver ? <strong>{renderedEvent.driver}</strong> : 'Driver TBD'}
                {renderedEvent.transportationNotes ? <span>{renderedEvent.transportationNotes}</span> : null}
              </dd>
            </div>
            <div>
              <dt>
                <UserRound aria-hidden="true" size={13} />
                Organizer
              </dt>
              <dd>{renderedEvent.organizer || 'TBD'}</dd>
            </div>
          </dl>

          <div className="attendee-block">
            <h3>Attendees</h3>
            <div className="attendee-chips">
              {renderedEvent.attendees.length
                ? renderedEvent.attendees.map((attendee) => (
                    <span className="attendee-chip" key={attendee}>
                      {attendee}
                    </span>
                  ))
                : 'TBD'}
            </div>
          </div>

          {renderedEvent.notes || renderedEvent.imagePrompt ? (
            <div className="detail-section notes-section">
              <h3>
                <NotebookTabs aria-hidden="true" size={14} />
                Planning notes
              </h3>
              {renderedEvent.notes ? <p>{renderedEvent.notes}</p> : null}
              {renderedEvent.imagePrompt ? (
                <p className="image-prompt">
                  <strong>Image prompt:</strong> {renderedEvent.imagePrompt}
                </p>
              ) : null}
            </div>
          ) : null}

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
