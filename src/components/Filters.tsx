export interface FilterState {
  attendee: 'all' | string;
}

interface FiltersProps {
  filters: FilterState;
  attendees: string[];
  onChange: (filters: FilterState) => void;
}

export function Filters({ filters, attendees, onChange }: FiltersProps) {
  return (
    <section className="filters" aria-label="Event filters">
      <div className="filter-selects">
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
