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
  const searchable = `${event.title} ${event.category}`.toLowerCase();

  if (searchable.includes('skydiv')) return 'S';
  if (searchable.includes('beach')) return 'B';
  if (searchable.includes('cottage') || searchable.includes('lake')) return 'L';
  if (searchable.includes('dinner') || searchable.includes('brunch') || searchable.includes('food')) {
    return 'F';
  }
  if (searchable.includes('penn') || searchable.includes('magic')) return 'M';
  if (searchable.includes('concert')) return 'C';

  const categoryEmoji: Record<SummerEvent['category'], string> = {
    movie: 'M',
    show: 'S',
    trip: 'T',
    outdoor: 'O',
    food: 'F',
    other: 'O',
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
