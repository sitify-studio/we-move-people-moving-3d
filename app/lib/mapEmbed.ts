import type { Site } from '@/app/lib/types';

function parseCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatAddressQuery(business?: Site['business']): string {
  if (!business?.address) return '';
  const { street, city, state, zipCode, country } = business.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ').trim();
}

/** Google Maps embed URL from coordinates or business address. */
export function getMapEmbedSrc(business?: Site['business']): string | null {
  if (!business) return null;

  const coords = business.coordinates as
    | { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown }
    | undefined;

  const lat = parseCoord(coords?.latitude ?? coords?.lat);
  const lng = parseCoord(coords?.longitude ?? coords?.lng);

  if (lat != null && lng != null) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }

  const addressQuery = formatAddressQuery(business);
  if (!addressQuery) return null;

  return `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&z=15&output=embed`;
}

export function hasMapEmbedSource(business?: Site['business']): boolean {
  return getMapEmbedSrc(business) != null;
}
