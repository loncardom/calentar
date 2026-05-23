import friendsData from '../data/friends.json';
import type { SummerEvent } from '../types/Event';

interface Friend {
  name: string;
  initials: string;
}

const friends = friendsData as Friend[];
const friendInitialsByName = new Map(
  friends.map((friend) => [friend.name.toLowerCase(), friend.initials.toUpperCase()]),
);

export const statusLabel: Record<SummerEvent['status'], string> = {
  confirmed: 'Confirmed',
  planning: 'Planning',
  idea: 'Idea',
  cancelled: 'Cancelled',
};

export const getEventEmoji = (event: SummerEvent): string => {
  const title = event.title.toLowerCase();

  if (title.includes('dune') || title.includes('smile')) return '🎬';
  if (title.includes('penn')) return '🎩';
  if (title.includes('trash dash') || title.includes('island')) return '🛶';
  if (title.includes('elora') || title.includes('tubing')) return '🌊';
  if (title.includes('skydiv')) return '🪂';
  if (title.includes('bee')) return '🐝';
  if (title.includes('target')) return '🎯';
  if (title.includes('gliding')) return '🛩️';

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
  const friendInitials = friendInitialsByName.get(name.trim().toLowerCase());
  if (friendInitials) return friendInitials;

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
