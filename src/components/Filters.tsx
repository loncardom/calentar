import type { EventStatus } from '../types/Event';

export interface FilterState {
  status: 'all' | EventStatus;
  attendee: 'all' | string;
}

interface FiltersProps {
  filters: FilterState;
  statuses: EventStatus[];
  attendees: string[];
  onChange: (filters: FilterState) => void;
}

const labelFor = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function Filters({ filters, statuses, attendees, onChange }: FiltersProps) {
  return (
    <section className="filters" aria-label="Event filters">
      <div className="filter-selects">
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
