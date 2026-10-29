export type TripCenter = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
export type TripLocationPoint = {
  number: number;
  latitude: number;
  longitude: number;
  placeId: string;
};
export type TripLocations = {
  status: "pending" | "resolving" | "ready" | "partial" | "failed";
  center: TripCenter | null;
  points: TripLocationPoint[];
  unresolved: number;
  error: string | null;
};
