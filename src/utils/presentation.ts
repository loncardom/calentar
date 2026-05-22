import type { SummerEvent } from '../types/Event';

export const statusLabel: Record<SummerEvent['status'], string> = {
  confirmed: 'Confirmed',
  planning: 'Planning',
  idea: 'Idea',
  cancelled: 'Cancelled',
};

export const getEventEmoji = (event: SummerEvent): string => {
  const searchable = `${event.title} ${event.tags.join(' ')} ${event.category}`.toLowerCase();

  if (searchable.includes('skydiv')) return '🪂';
  if (searchable.includes('beach')) return '🏖️';
  if (searchable.includes('cottage') || searchable.includes('lake')) return '🌲';
  if (searchable.includes('dinner') || searchable.includes('brunch') || searchable.includes('food')) {
    return '🍜';
  }
  if (searchable.includes('penn') || searchable.includes('magic')) return '🎩';
  if (searchable.includes('concert')) return '🎶';

  const categoryEmoji: Record<SummerEvent['category'], string> = {
    movie: '🎬',
    show: '🎭',
    trip: '🚗',
    outdoor: '☀️',
    food: '🍽️',
    other: '✨',
  };

  return categoryEmoji[event.category];
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getCostBadgeLabel = (event: SummerEvent): string => {
  if (event.costAmount === 0) return 'Free';
  if (event.costAmount && event.currency === 'CAD') return `~$${event.costAmount}`;
  if (event.costAmount && event.currency) return `~${event.currency} ${event.costAmount}`;
  return event.costLabel || 'TBD';
};

export const getLocationLine = (event: SummerEvent): string =>
  [event.locationName, event.city].filter(Boolean).join(', ') ||
  event.locationName ||
  'Location TBD';
