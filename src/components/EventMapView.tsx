import { useEffect, useMemo, useRef, useState } from 'react';
import eventLocationsData from '../data/eventLocations.json';
import type { SummerEvent } from '../types/Event';
import { getEventDateLabel, isPastEvent, sortEventsChronologically } from '../utils/dates';
import {
  getEventEmoji,
  getLocationLine,
} from '../utils/presentation';

interface EventMapViewProps {
  events: SummerEvent[];
  onSelect: (event: SummerEvent) => void;
}

interface EventLocation {
  lat: number;
  lng: number;
}

type LeafletApi = any;
type Coordinate = [number, number];

const eventLocations = eventLocationsData as Record<string, EventLocation>;
const leafletCssId = 'leaflet-css';
const leafletScriptId = 'leaflet-js';
const leafletCssUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const leafletScriptUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const homeBases: Array<{ id: string; label: string; coordinates: Coordinate }> = [
  {
    id: 'erin-mills-town-centre',
    label: 'Erin Mills Town Centre homebase',
    coordinates: [43.5584, -79.7115],
  },
  {
    id: 'bloor-yonge',
    label: 'Bloor-Yonge homebase',
    coordinates: [43.671, -79.386],
  },
];

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case "'":
        return '&#39;';
      case '"':
        return '&quot;';
      default:
        return character;
    }
  });

const getCompactDateLabel = (event: SummerEvent) => {
  const eventDate = event.date ?? event.calendarStartDate;

  if (!eventDate) return 'TBD';

  const date = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const ensureLeaflet = () => new Promise<LeafletApi>((resolve, reject) => {
  if (window.L) {
    resolve(window.L);
    return;
  }

  if (!document.getElementById(leafletCssId)) {
    const link = document.createElement('link');
    link.id = leafletCssId;
    link.rel = 'stylesheet';
    link.href = leafletCssUrl;
    document.head.appendChild(link);
  }

  const existingScript = document.getElementById(leafletScriptId) as HTMLScriptElement | null;
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.L), { once: true });
    existingScript.addEventListener('error', reject, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = leafletScriptId;
  script.src = leafletScriptUrl;
  script.async = true;
  script.onload = () => resolve(window.L);
  script.onerror = reject;
  document.body.appendChild(script);
});

export function EventMapView({ events, onSelect }: EventMapViewProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletApi | null>(null);
  const markerLayerRef = useRef<LeafletApi | null>(null);
  const homeBaseLayerRef = useRef<LeafletApi | null>(null);
  const onSelectRef = useRef(onSelect);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mappedEvents = useMemo(
    () => sortEventsChronologically(events.filter((event) => !isPastEvent(event) && eventLocations[event.id])),
    [events],
  );
  const skippedCount = events.length - mappedEvents.length;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let isMounted = true;

    ensureLeaflet()
      .then(() => {
        if (isMounted) setIsMapReady(true);
      })
      .catch(() => {
        if (isMounted) setMapError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapElementRef.current || !window.L) return undefined;

    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map(mapElementRef.current, {
        scrollWheelZoom: false,
      }).setView([43.65, -79.38], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      homeBaseLayerRef.current = L.layerGroup().addTo(mapRef.current);
      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    if (!mapRef.current || !markerLayerRef.current || !homeBaseLayerRef.current) {
      return undefined;
    }

    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    const homeBaseLayer = homeBaseLayerRef.current;
    markerLayer.clearLayers();
    homeBaseLayer.clearLayers();

    const bounds: Coordinate[] = [];

    homeBases.forEach((homeBase) => {
      const markerHtml = `
        <div class="homebase-map-pin homebase-${homeBase.id}" aria-hidden="true">
          <span class="homebase-map-pin-icon">⌂</span>
        </div>
      `;

      L.marker(homeBase.coordinates, {
        interactive: false,
        title: homeBase.label,
        icon: L.divIcon({
          className: 'homebase-map-marker-shell',
          html: markerHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(homeBaseLayer);

      bounds.push(homeBase.coordinates);
    });

    mappedEvents.forEach((event) => {
      const coordinates = eventLocations[event.id];
      const coordinatePair: Coordinate = [coordinates.lat, coordinates.lng];
      const compactDate = getCompactDateLabel(event);
      const markerHtml = `
        <div class="event-map-pin category-${event.category} status-${event.status}">
          <span class="event-map-pin-emoji">${escapeHtml(getEventEmoji(event))}</span>
          <span class="event-map-pin-date">${escapeHtml(compactDate)}</span>
        </div>
      `;

      const marker = L.marker(coordinatePair, {
        icon: L.divIcon({
          className: 'event-map-marker-shell',
          html: markerHtml,
          iconSize: [72, 34],
          iconAnchor: [36, 34],
        }),
      }).addTo(markerLayer);

      marker.on('click', (leafletEvent: { originalEvent?: MouseEvent }) => {
        leafletEvent.originalEvent?.preventDefault();
        onSelectRef.current(event);
      });
      bounds.push(coordinatePair);
    });

    if (bounds.length) {
      map.fitBounds(bounds, {
        maxZoom: 11,
        padding: [30, 30],
      });
    }

    window.setTimeout(() => map.invalidateSize(), 0);

    return undefined;
  }, [isMapReady, mappedEvents]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = null;
    markerLayerRef.current = null;
    homeBaseLayerRef.current = null;
  }, []);

  return (
    <main className="map-page">
      <header className="map-page-header">
        <a href="/" className="map-back-link">← Plans</a>
        <div>
          <p className="eyebrow">Event map</p>
          <h1>Mapped plans</h1>
          <p>
            {mappedEvents.length} upcoming event locations shown
            {skippedCount > 0 ? ` · ${skippedCount} past or unmapped events hidden` : ''}
          </p>
        </div>
      </header>

      <section className="map-shell" aria-label="Event location map">
        {mapError ? (
          <div className="map-empty-state">Map could not load. Check the network connection.</div>
        ) : null}
        {!mapError && !isMapReady ? <div className="map-empty-state">Loading map…</div> : null}
        <div className="event-map" ref={mapElementRef} />
        <div className="map-legend" aria-label="Map legend">
          <span><b className="legend-homebase" />Homebase</span>
        </div>
      </section>

      <section className="map-event-list" aria-label="Mapped events">
        {mappedEvents.map((event) => (
          <button
            type="button"
            className={`map-event-row category-${event.category} status-${event.status}`}
            onClick={() => onSelect(event)}
            key={event.id}
          >
            <span aria-hidden="true">{getEventEmoji(event)}</span>
            <span>
              <strong>{event.title}</strong>
              <small>
                {getEventDateLabel(event)} · {getLocationLine(event)}
              </small>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}

declare global {
  interface Window {
    L?: LeafletApi;
  }
}
