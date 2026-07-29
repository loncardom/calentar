import type { SummerEvent } from '../types/Event';

const topsCalendarUrl = 'https://www.topictureshow.com/2026-calendar';

const festivalEvents: SummerEvent[] = [
  {
    id: 'toronto-korean-festival-2026',
    title: 'Toronto Korean Festival 2026',
    status: 'planning',
    category: 'food',
    date: null,
    calendarStartDate: '2026-08-21',
    calendarEndDate: '2026-08-23',
    startTime: null,
    endTime: null,
    dateLabel: 'August 21-23',
    locationName: 'Mel Lastman Square',
    address: '5100 Yonge Street',
    city: 'Toronto, ON',
    description: "Toronto's major Korean cultural festival with K-food, K-pop, traditional performances, a hanbok fashion show, K-beauty, contests, and vendors.",
    attendees: ['Dom'],
    organizer: 'Toronto Korean Festival',
    driver: null,
    transportationNotes: 'Mel Lastman Square is beside North York Centre Station. TTC is likely easier than driving.',
    costLabel: 'Free admission; food and merchandise extra',
    costAmount: 0,
    currency: 'CAD',
    ticketUrl: null,
    eventUrl: 'https://torontokfest.ca/',
    image: null,
    imagePrompt: 'A lively Korean cultural festival at Mel Lastman Square with K-pop performances, Korean food stalls, hanbok, crowds, and summer city energy.',
    notes: 'Official 2026 dates are Friday, August 21 through Sunday, August 23 at Mel Lastman Square. The schedule includes K-pop idol concerts, Korean traditional performances, a hanbok fashion show, contests, and a K-beauty pavilion.',
  },
  {
    id: 'toronto-taiwanfest-2026',
    title: 'Toronto TAIWANfest 2026',
    status: 'planning',
    category: 'food',
    date: null,
    calendarStartDate: '2026-08-28',
    calendarEndDate: '2026-08-30',
    startTime: null,
    endTime: null,
    dateLabel: 'August 28-30',
    locationName: 'Harbourfront Centre',
    address: '235 Queens Quay West',
    city: 'Toronto, ON',
    description: 'A free cultural festival connecting Taiwan, Canada, and Scotland through live music, food, films, talks, exhibitions, workshops, and Indigenous cultural programming.',
    attendees: ['Dom'],
    organizer: 'Asian-Canadian Special Events Association and Arts for Canadians Tomorrow Society',
    driver: null,
    transportationNotes: 'Take the 509 or 510 streetcar to Harbourfront Centre. Waterfront parking is limited and expensive.',
    costLabel: 'Free admission; some reserved programs may require registration',
    costAmount: 0,
    currency: 'CAD',
    ticketUrl: null,
    eventUrl: 'https://torontotaiwanfest.ca/',
    image: null,
    imagePrompt: 'A waterfront Taiwan cultural festival at Harbourfront Centre with music, Indigenous performances, Taiwanese food, art installations, and crowds by Lake Ontario.',
    notes: 'Official 2026 dates are Friday, August 28 through Sunday, August 30 at Harbourfront Centre. The 2026 theme is Islands in the Wind, presented as a dialogue with Scotland.',
  },
  {
    id: 'toronto-buskerfest-2026',
    title: 'Toronto International BuskerFest 2026',
    status: 'planning',
    category: 'show',
    date: null,
    calendarStartDate: '2026-09-04',
    calendarEndDate: '2026-09-07',
    startTime: null,
    endTime: null,
    dateLabel: 'September 4-7',
    locationName: 'Woodbine Park',
    address: '1695 Queen Street East',
    city: 'Toronto, ON',
    description: 'Four days of international street performers, circus acts, acrobatics, comedy, fire shows, musicians, food trucks, vendors, and family activities.',
    attendees: ['Dom'],
    organizer: 'Epilepsy Toronto',
    driver: null,
    transportationNotes: 'Woodbine Park is served by the 501 Queen streetcar and nearby bus routes. Expect heavy crowds and limited parking.',
    costLabel: 'Admission by donation to Epilepsy Toronto',
    costAmount: 0,
    currency: 'CAD',
    ticketUrl: 'https://torontobuskerfest.com/',
    eventUrl: 'https://torontobuskerfest.com/',
    image: null,
    imagePrompt: 'A colourful international busker festival in Woodbine Park with acrobats, fire performers, musicians, circus acts, food trucks, and a cheering crowd.',
    notes: 'Official hours: Friday September 4 from 4 PM-11 PM; Saturday September 5 from noon-11 PM; Sunday September 6 from noon-10 PM; Monday September 7 from noon-7 PM.',
  },
];

type TopsScreening = {
  id: string;
  title: string;
  date: string;
  locationName: string;
  address: string;
};

const topsScreenings: TopsScreening[] = [
  { id: 'speed', title: 'Speed', date: '2026-07-30', locationName: 'Corktown Common', address: '155 Bayview Avenue' },
  { id: 'titanic', title: 'Titanic', date: '2026-08-02', locationName: 'Christie Pits Park', address: '750 Bloor Street West' },
  { id: 'wildhood', title: 'Wildhood', date: '2026-08-06', locationName: 'Corktown Common', address: '155 Bayview Avenue' },
  { id: 'thelma-and-louise', title: 'Thelma & Louise', date: '2026-08-09', locationName: 'Christie Pits Park', address: '750 Bloor Street West' },
  { id: 'the-queen-of-my-dreams', title: 'The Queen of My Dreams', date: '2026-08-13', locationName: 'Bell Manor Park', address: '1 Bayside Lane' },
  { id: 'the-princess-bride', title: 'The Princess Bride', date: '2026-08-14', locationName: 'Bell Manor Park', address: '1 Bayside Lane' },
  { id: 'paddington', title: 'Paddington', date: '2026-08-15', locationName: 'Bell Manor Park', address: '1 Bayside Lane' },
  { id: 'faces-places', title: 'Faces Places', date: '2026-08-16', locationName: 'Christie Pits Park', address: '750 Bloor Street West' },
  { id: 'gentlemen-prefer-blondes', title: 'Gentlemen Prefer Blondes', date: '2026-08-22', locationName: 'Christie Pits Park', address: '750 Bloor Street West' },
  { id: 'closing-night', title: 'Closing Night — Audience Choice Film', date: '2026-08-23', locationName: 'Christie Pits Park', address: '750 Bloor Street West' },
];

const topsEvents: SummerEvent[] = topsScreenings.map((screening) => {
  const isBellManor = screening.locationName === 'Bell Manor Park';
  const isClosingNight = screening.id === 'closing-night';

  return {
    id: `tops-${screening.id}-2026`,
    title: `TOPS: ${screening.title}`,
    status: 'planning',
    category: 'movie',
    date: screening.date,
    calendarStartDate: null,
    calendarEndDate: null,
    startTime: isBellManor ? '20:30' : null,
    endTime: null,
    dateLabel: null,
    locationName: screening.locationName,
    address: screening.address,
    city: 'Toronto, ON',
    description: `Free outdoor screening of ${screening.title} as part of Toronto Outdoor Picture Show's 2026 Going Places season.`,
    attendees: ['Dom'],
    organizer: 'Toronto Outdoor Picture Show',
    driver: null,
    transportationNotes: 'Bring a blanket or chairs. Use TTC where possible; park parking is limited.',
    costLabel: 'Free / pay what you can; food available for purchase',
    costAmount: 0,
    currency: 'CAD',
    ticketUrl: null,
    eventUrl: topsCalendarUrl,
    image: null,
    imagePrompt: `An outdoor summer movie screening of ${screening.title} in ${screening.locationName}, with a large screen, blankets, park lawn, Toronto scenery, and a relaxed evening crowd.`,
    notes: isBellManor
      ? 'Showtime is approximately 8:30 PM, with food and family arts activities beginning at 6 PM.'
      : isClosingNight
        ? 'Audience-choice closing night; the selected feature film was not yet announced. Food is available from 6 PM and the film starts at sundown.'
        : 'Food is available before the screening and the film starts at sundown. Bring a blanket or chairs; no ticket is required.',
  };
});

export const summer2026Events: SummerEvent[] = [...festivalEvents, ...topsEvents];
