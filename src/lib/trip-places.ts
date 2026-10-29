import type { Itinerary } from "./trip-contract";
export type TripPlace = Itinerary["days"][number]["activities"][number] & {
  number: number;
  day: number;
  date: string;
};
export type LocatedPlace = TripPlace & { latitude: number; longitude: number };
export const dayColors = [
  "#2563EB",
  "#159881",
  "#8B65D5",
  "#D68628",
  "#D35B83",
];
export function dayColor(day: number) {
  return dayColors[(day - 1) % dayColors.length];
}
export function tripPlaces(itinerary: Itinerary): TripPlace[] {
  let number = 0;
  return itinerary.days.flatMap((day) =>
    day.activities.map((a) => ({
      ...a,
      number: ++number,
      day: day.day,
      date: day.date,
    })),
  );
}
export function hasCoordinates(p: TripPlace): p is LocatedPlace {
  return (
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180 &&
    !(p.latitude === 0 && p.longitude === 0)
  );
}
export function groupPlaces(points: LocatedPlace[]) {
  const groups = new Map<string, LocatedPlace[]>();
  for (const p of points) {
    const key = `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups.values()];
}
export function mapRegion(points: LocatedPlace[]) {
  if (!points.length) return null;
  const first = points[0].longitude;
  const lngs = points.map((p) => {
    let x = p.longitude;
    while (x - first > 180) x -= 360;
    while (x - first < -180) x += 360;
    return x;
  });
  const lats = points.map((p) => p.latitude),
    minLat = Math.min(...lats),
    maxLat = Math.max(...lats),
    minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (((minLng + maxLng) / 2 + 540) % 360) - 180,
    latitudeDelta: Math.max(0.018, (maxLat - minLat) * 1.35),
    longitudeDelta: Math.max(0.018, (maxLng - minLng) * 1.35),
  };
}
export function googleMapsUrl(
  place: TripPlace | undefined,
  destination: string,
) {
  const query =
    place && hasCoordinates(place)
      ? `${place.latitude},${place.longitude}`
      : place
        ? `${place.name} ${place.location} ${destination}`
        : destination;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
