// utils/haversine.ts

export interface LocationInput {
  lat: number;
  lng: number;
}

// convert degrees to radians
function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Haversine formula to calculate straight-line distance in km
export function haversineDistance(
  from: LocationInput,
  to: LocationInput,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
