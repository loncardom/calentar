export type EventStatus = 'confirmed' | 'planning' | 'idea' | 'cancelled';

export type EventCategory =
  | 'movie'
  | 'show'
  | 'trip'
  | 'outdoor'
  | 'food'
  | 'other';

export interface SummerEvent {
  id: string;
  title: string;
  status: EventStatus;
  category: EventCategory;
  date: string | null;
  calendarStartDate?: string | null;
  calendarEndDate?: string | null;
  startTime: string | null;
  endTime: string | null;
  dateLabel: string | null;
  locationName: string;
  address: string | null;
  city: string | null;
  description: string;
  attendees: string[];
  organizer: string | null;
  driver: string | null;
  transportationNotes: string | null;
  costLabel: string | null;
  costAmount: number | null;
  currency: string | null;
  ticketUrl: string | null;
  eventUrl: string | null;
  image: string | null;
  imagePrompt: string | null;
  notes: string | null;
}

export type EventView = 'tiles' | 'calendar';
