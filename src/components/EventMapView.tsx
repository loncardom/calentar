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

interface TtcLine {
  id: string;
  name: string;
  color: string;
  points: Coordinate[];
}

type LeafletApi = any;
type Coordinate = [number, number];
type CsvRecord = Record<string, string>;

type ZipFile = {
  file: (path: string) => { async: (type: 'string') => Promise<string> } | null;
};

type JSZipConstructor = {
  loadAsync: (data: ArrayBuffer) => Promise<ZipFile>;
};

const eventLocations = eventLocationsData as Record<string, EventLocation>;
const leafletCssId = 'leaflet-css';
const leafletScriptId = 'leaflet-js';
const jsZipScriptId = 'jszip-js';
const leafletCssUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const leafletScriptUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const jsZipScriptUrl = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const ttcDatasetApiUrl = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=ttc-routes-and-schedules';
const fallbackTtcGtfsUrls = [
  'https://opendata.toronto.ca/ttc/ttc-routes-and-schedules/ttc-routes-and-schedules.zip',
  'https://opendata.toronto.ca/ttc/routes-and-schedules/ttc-routes-and-schedules.zip',
];

const ttcLineColors: Record<string, string> = {
  '1': '#f8c300',
  '2': '#009b3a',
  '3': '#0083c9',
  '4': '#a05eb5',
};

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

const loadScript = (id: string, src: string) => new Promise<void>((resolve, reject) => {
  const existingScript = document.getElementById(id) as HTMLScriptElement | null;
  if (existingScript) {
    if (existingScript.dataset.loaded === 'true') {
      resolve();
      return;
    }

    existingScript.addEventListener('load', () => resolve(), { once: true });
    existingScript.addEventListener('error', reject, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.onload = () => {
    script.dataset.loaded = 'true';
    resolve();
  };
  script.onerror = reject;
  document.body.appendChild(script);
});

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

  loadScript(leafletScriptId, leafletScriptUrl)
    .then(() => resolve(window.L))
    .catch(reject);
});

const ensureJSZip = () => {
  if (window.JSZip) return Promise.resolve(window.JSZip);

  return loadScript(jsZipScriptId, jsZipScriptUrl).then(() => window.JSZip);
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let currentValue = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && isQuoted && nextCharacter === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (character === ',' && !isQuoted) {
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);
  return values;
};

const parseCsv = (content: string): CsvRecord[] => {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? '');

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = values[index] ?? '';
      return record;
    }, {});
  });
};

const getTtcGtfsUrl = async () => {
  try {
    const packageResponse = await fetch(ttcDatasetApiUrl);
    if (!packageResponse.ok) throw new Error('TTC package request failed');

    const packageJson = await packageResponse.json();
    const resources = packageJson?.result?.resources ?? [];
    const zipResource = resources.find((resource: { format?: string; url?: string; name?: string }) => {
      const resourceText = `${resource.format ?? ''} ${resource.url ?? ''} ${resource.name ?? ''}`;
      return /zip|gtfs|schedule/i.test(resourceText);
    });

    if (zipResource?.url) return zipResource.url as string;
  } catch {
    // Try the historical static file locations below.
  }

  return fallbackTtcGtfsUrls[0];
};

const simplifyCoordinates = (points: Coordinate[]) => {
  if (points.length <= 450) return points;

  const step = Math.ceil(points.length / 450);
  return points.filter((_, index) => index === 0 || index === points.length - 1 || index % step === 0);
};

const parseTtcLinesFromGtfs = async (gtfsData: ArrayBuffer, JSZip: JSZipConstructor): Promise<TtcLine[]> => {
  const zip = await JSZip.loadAsync(gtfsData);
  const routesFile = zip.file('routes.txt');
  const tripsFile = zip.file('trips.txt');
  const shapesFile = zip.file('shapes.txt');

  if (!routesFile || !tripsFile || !shapesFile) throw new Error('Missing GTFS shape files');

  const [routes, trips, shapes] = await Promise.all([
    routesFile.async('string').then(parseCsv),
    tripsFile.async('string').then(parseCsv),
    shapesFile.async('string').then(parseCsv),
  ]);

  const routeShortNameById = new Map<string, string>();
  routes.forEach((route) => {
    const shortName = route.route_short_name?.trim();
    if (shortName && ttcLineColors[shortName]) routeShortNameById.set(route.route_id, shortName);
  });

  const shapeIdsByLine = new Map<string, Set<string>>();
  trips.forEach((trip) => {
    const line = routeShortNameById.get(trip.route_id);
    if (!line || !trip.shape_id) return;

    const shapeIds = shapeIdsByLine.get(line) ?? new Set<string>();
    shapeIds.add(trip.shape_id);
    shapeIdsByLine.set(line, shapeIds);
  });

  const lineByShapeId = new Map<string, string>();
  shapeIdsByLine.forEach((shapeIds, line) => {
    shapeIds.forEach((shapeId) => lineByShapeId.set(shapeId, line));
  });

  const pointGroups = new Map<string, Array<{ sequence: number; point: Coordinate }>>();
  shapes.forEach((shape) => {
    const line = lineByShapeId.get(shape.shape_id);
    if (!line) return;

    const lat = Number(shape.shape_pt_lat);
    const lng = Number(shape.shape_pt_lon);
    const sequence = Number(shape.shape_pt_sequence);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(sequence)) return;

    const key = `${line}:${shape.shape_id}`;
    const group = pointGroups.get(key) ?? [];
    group.push({ sequence, point: [lat, lng] });
    pointGroups.set(key, group);
  });

  const lines: TtcLine[] = [];
  pointGroups.forEach((group, key) => {
    const [line, shapeId] = key.split(':');
    const points = simplifyCoordinates(
      group.sort((a, b) => a.sequence - b.sequence).map(({ point }) => point),
    );

    if (points.length < 2) return;

    lines.push({
      id: `${line}-${shapeId}`,
      name: `TTC Line ${line}`,
      color: ttcLineColors[line],
      points,
    });
  });

  return lines;
};

const loadTtcLines = async () => {
  const JSZip = await ensureJSZip();
  if (!JSZip) throw new Error('JSZip failed to load');

  const gtfsUrl = await getTtcGtfsUrl();
  const urlsToTry = [gtfsUrl, ...fallbackTtcGtfsUrls.filter((url) => url !== gtfsUrl)];
  let lastError: unknown = null;

  for (const url of urlsToTry) {
    try {
      const gtfsResponse = await fetch(url);
      if (!gtfsResponse.ok) throw new Error('TTC GTFS request failed');

      return parseTtcLinesFromGtfs(await gtfsResponse.arrayBuffer(), JSZip);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Unable to load TTC GTFS');
};

export function EventMapView({ events, onSelect }: EventMapViewProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletApi | null>(null);
  const transitLayerRef = useRef<LeafletApi | null>(null);
  const markerLayerRef = useRef<LeafletApi | null>(null);
  const homeBaseLayerRef = useRef<LeafletApi | null>(null);
  const onSelectRef = useRef(onSelect);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [ttcLines, setTtcLines] = useState<TtcLine[]>([]);
  const [ttcStatus, setTtcStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

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
    if (!isMapReady || ttcStatus !== 'idle') return undefined;

    let isMounted = true;
    setTtcStatus('loading');

    loadTtcLines()
      .then((lines) => {
        if (!isMounted) return;

        setTtcLines(lines);
        setTtcStatus(lines.length ? 'ready' : 'error');
      })
      .catch(() => {
        if (isMounted) setTtcStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [isMapReady, ttcStatus]);

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

      mapRef.current.createPane('ttc-line-pane');
      mapRef.current.getPane('ttc-line-pane').style.zIndex = '430';
      mapRef.current.createPane('event-marker-pane');
      mapRef.current.getPane('event-marker-pane').style.zIndex = '620';
      mapRef.current.createPane('homebase-marker-pane');
      mapRef.current.getPane('homebase-marker-pane').style.zIndex = '680';

      transitLayerRef.current = L.layerGroup().addTo(mapRef.current);
      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
      homeBaseLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    if (!mapRef.current || !markerLayerRef.current || !homeBaseLayerRef.current || !transitLayerRef.current) {
      return undefined;
    }

    const map = mapRef.current;
    const transitLayer = transitLayerRef.current;
    const markerLayer = markerLayerRef.current;
    const homeBaseLayer = homeBaseLayerRef.current;
    transitLayer.clearLayers();
    markerLayer.clearLayers();
    homeBaseLayer.clearLayers();

    const bounds: Coordinate[] = [];

    ttcLines.forEach((line) => {
      L.polyline(line.points, {
        pane: 'ttc-line-pane',
        color: line.color,
        weight: 4,
        opacity: 0.75,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(transitLayer);
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
        pane: 'event-marker-pane',
        zIndexOffset: 200,
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

    homeBases.forEach((homeBase) => {
      const markerHtml = `
        <div class="homebase-map-pin homebase-${homeBase.id}" aria-hidden="true">
          <span class="homebase-map-pin-icon">⌂</span>
        </div>
      `;

      L.marker(homeBase.coordinates, {
        interactive: false,
        pane: 'homebase-marker-pane',
        zIndexOffset: 1000,
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

    if (bounds.length) {
      map.fitBounds(bounds, {
        maxZoom: 11,
        padding: [30, 30],
      });
    }

    window.setTimeout(() => map.invalidateSize(), 0);

    return undefined;
  }, [isMapReady, mappedEvents, ttcLines]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = null;
    transitLayerRef.current = null;
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
            {ttcStatus === 'loading' ? ' · loading TTC shapes' : ''}
            {ttcStatus === 'ready' ? ` · ${ttcLines.length} TTC shapes` : ''}
            {ttcStatus === 'error' ? ' · TTC shapes unavailable' : ''}
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
          {ttcStatus === 'ready' ? (
            <>
              <span><b className="legend-line legend-line-1" />TTC 1</span>
              <span><b className="legend-line legend-line-2" />TTC 2</span>
              <span><b className="legend-line legend-line-3" />TTC 3</span>
              <span><b className="legend-line legend-line-4" />TTC 4</span>
            </>
          ) : null}
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
    JSZip?: JSZipConstructor;
  }
}
