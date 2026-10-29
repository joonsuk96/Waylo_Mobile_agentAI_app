import type { TripCenter } from "../lib/trip-locations";
type Result = {
  latitude: number;
  longitude: number;
  placeId: string;
  center: TripCenter;
  coarse: boolean;
};
// Shared queue keeps this personal development app gentle on the public demo.
let queue: Promise<unknown> = Promise.resolve();
export function geocode(
  query: string,
  bias?: TripCenter,
): Promise<Result | null> {
  const run = queue.then(async () => {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set(
      "q",
      bias
        ? query
        : query.replace(/대한민국|한국|South Korea/gi, " ").trim() || query,
    );
    url.searchParams.set("limit", "5");
    if (bias) {
      url.searchParams.set("lat", String(bias.latitude));
      url.searchParams.set("lon", String(bias.longitude));
    }
    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Waylo-Local-Trip-Planner/1.0" },
      });
    } catch {
      throw Error(
        "무료 장소 검색 연결이 지연됐어요. 잠시 후 다시 시도해 주세요.",
      );
    }
    if (!response.ok)
      throw Error("무료 장소 검색을 일시적으로 사용할 수 없어요.");
    const body = await response.json();
    const features = [...(body.features ?? [])];
    if (!bias)
      features.sort(
        (a, b) =>
          Number(
            ["city", "town", "country", "state"].includes(
              b.properties?.osm_value,
            ),
          ) -
          Number(
            ["city", "town", "country", "state"].includes(
              a.properties?.osm_value,
            ),
          ),
      );
    for (const feature of features) {
      const [longitude, latitude] = feature.geometry?.coordinates ?? [];
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      )
        continue;
      // Location bias alone is soft. Reject remote namesakes instead of placing wrong pins.
      if (bias) {
        const dlat = ((latitude - bias.latitude) * Math.PI) / 180,
          dlon = ((longitude - bias.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dlat / 2) ** 2 +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((bias.latitude * Math.PI) / 180) *
            Math.sin(dlon / 2) ** 2;
        if (
          6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) >
          150
        )
          continue;
      }
      const p = feature.properties ?? {};
      const coarse =
        ["city", "state", "country", "county", "district", "locality"].includes(
          p.type,
        ) ||
        ["city", "town", "village", "state", "country", "suburb"].includes(
          p.osm_value,
        ) ||
        p.osm_key === "boundary";
      if (bias && coarse) continue;
      return {
        latitude,
        longitude,
        placeId: String(p.osm_type ?? "") + String(p.osm_id ?? ""),
        coarse,
        center: {
          latitude,
          longitude,
          latitudeDelta: 0.22,
          longitudeDelta: 0.22,
        },
      };
    }
    return null;
  });
  queue = run
    .catch(() => {})
    .then(() => new Promise((resolve) => setTimeout(resolve, 1200)));
  return run;
}
