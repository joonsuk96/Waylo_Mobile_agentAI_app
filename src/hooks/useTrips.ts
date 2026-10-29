import { useAuth } from "@clerk/expo";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import type { Trip } from "../lib/trip-contract";

export function useTrips() {
  const { getToken, userId, isLoaded } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const loaded = useRef(false);
  const owner = useRef<string | null | undefined>(undefined);
  const tokenGetter = useRef(getToken);
  useEffect(() => {
    tokenGetter.current = getToken;
  }, [getToken]);
  // Clerk can replace getToken when its session refreshes. Keep that out of
  // the focus callback dependencies so a token refresh cannot refetch the list.
  const reload = useCallback(async () => {
    const id = ++sequence.current;
    // Existing cards remain steady during background refreshes.
    setLoading(!loaded.current);
    setError("");
    try {
      const token = await tokenGetter.current();
      const data = await apiRequest<{ trips: Trip[] }>("/api/trips", token);
      if (id === sequence.current) {
        loaded.current = true;
        setTrips(data.trips);
      }
    } catch (e) {
      if (id === sequence.current)
        setError(e instanceof Error ? e.message : "여행을 불러오지 못했어요.");
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (!isLoaded) return;
      if (owner.current !== userId) {
        owner.current = userId;
        loaded.current = false;
        setTrips([]);
      }
      if (userId) void reload();
      else {
        setLoading(false);
        setError("");
      }
      return () => {
        sequence.current++;
      };
    }, [isLoaded, userId, reload]),
  );
  return { trips, loading, error, reload };
}
