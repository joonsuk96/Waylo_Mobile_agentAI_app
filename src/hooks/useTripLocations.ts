import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { TripLocations } from "../lib/trip-locations";

export function useTripLocations(id: string) {
  const { getToken } = useAuth();
  const [locations, setLocations] = useState<TripLocations | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function load(first: boolean) {
      try {
        const token = await getToken();
        const data = await apiRequest<{ locations: TripLocations | null }>(
          `/api/trips/${encodeURIComponent(id)}/locations`,
          token,
          {
            method: first ? "POST" : "GET",
            ...(first ? { body: JSON.stringify({ retry: revision > 0 }) } : {}),
            signal: controller.signal,
          },
        );
        if (!alive) return;
        setLocations(data.locations);
        setError("");
        if (
          data.locations?.status === "pending" ||
          data.locations?.status === "resolving"
        )
          timer = setTimeout(() => void load(false), 2500);
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error ? e.message : "지도 위치를 불러오지 못했어요.",
          );
      }
    }
    void load(true);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [getToken, id, revision]);
  return { locations, error, reload: () => setRevision((n) => n + 1) };
}
