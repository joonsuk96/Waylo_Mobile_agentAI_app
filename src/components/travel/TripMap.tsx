import type { TripMapProps } from "./TripMap.types";
import TripMapFallback from "./TripMapFallback";
// Web preview opens Google Maps externally; native builds use TripMap.native.tsx.
export default function TripMap(props: TripMapProps) {
  return (
    <TripMapFallback
      onOpenGoogle={props.onOpenGoogle}
      empty={!props.points.length}
    />
  );
}
