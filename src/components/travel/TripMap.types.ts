import type { TripCenter } from "../../lib/trip-locations";
import type { LocatedPlace } from "../../lib/trip-places";
export type TripMapProps = {
  points: LocatedPlace[];
  center?: TripCenter | null;
  selected: number | null;
  onSelect: (number: number) => void;
  onOpenGoogle: () => void;
};
