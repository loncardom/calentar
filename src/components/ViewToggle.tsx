import { CalendarDays, LayoutGrid } from 'lucide-react';
import type { EventView } from '../types/Event';

interface ViewToggleProps {
  view: EventView;
  onChange: (view: EventView) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="tablist" aria-label="Choose event view">
      <button
        type="button"
        className={view === 'tiles' ? 'active' : ''}
        onClick={() => onChange('tiles')}
        role="tab"
        aria-selected={view === 'tiles'}
      >
        <LayoutGrid aria-hidden="true" size={18} />
        Tiles
      </button>
      <button
        type="button"
        className={view === 'calendar' ? 'active' : ''}
        onClick={() => onChange('calendar')}
        role="tab"
        aria-selected={view === 'calendar'}
      >
        <CalendarDays aria-hidden="true" size={18} />
        Calendar
      </button>
    </div>
  );
}
