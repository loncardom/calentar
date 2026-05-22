import { Search, SlidersHorizontal } from 'lucide-react';
import type { EventCategory, EventStatus } from '../types/Event';

export interface FilterState {
  search: string;
  status: 'all' | EventStatus;
  category: 'all' | EventCategory;
  attendee: 'all' | string;
}

interface FiltersProps {
  filters: FilterState;
  categories: EventCategory[];
  statuses: EventStatus[];
  attendees: string[];
  onChange: (filters: FilterState) => void;
}

const labelFor = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function Filters({
  filters,
  categories,
  statuses,
  attendees,
  onChange,
}: FiltersProps) {
  return (
    <section className="filters" aria-label="Event filters">
      <div className="search-field">
        <Search aria-hidden="true" size={18} />
        <label className="sr-only" htmlFor="event-search">
          Search events
        </label>
        <input
          id="event-search"
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search title, place, notes..."
        />
      </div>

      <div className="filter-selects">
        <div className="filter-label">
          <SlidersHorizontal aria-hidden="true" size={17} />
          Filters
        </div>

        <label>
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as FilterState['status'] })
            }
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option value={status} key={status}>
                {labelFor(status)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Category</span>
          <select
            value={filters.category}
            onChange={(event) =>
              onChange({
                ...filters,
                category: event.target.value as FilterState['category'],
              })
            }
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option value={category} key={category}>
                {labelFor(category)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Friend</span>
          <select
            value={filters.attendee}
            onChange={(event) => onChange({ ...filters, attendee: event.target.value })}
          >
            <option value="all">Everyone</option>
            {attendees.map((attendee) => (
              <option value={attendee} key={attendee}>
                {attendee}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
