export const getGoogleMapsUrl = (
  address: string | null,
  locationName?: string | null,
  city?: string | null,
): string | null => {
  const query = [locationName, address, city].filter(Boolean).join(', ');
  if (!query.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
