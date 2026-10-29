import { useAuth } from "@clerk/expo";
import TripDetail from "../components/travel/TripDetail";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Page, s } from "../components/travel/ui";

import { apiRequest } from "../lib/api";
import { type Trip } from "../lib/trip-contract";
import { isClerkConfigured } from "../lib/auth";

export default function DetailRoute() {
  if (!isClerkConfigured) return <Redirect href="/sign-in" />;
  return <Detail />;
}
function Detail() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !id) return;
    let alive = true;
    const controller = new AbortController();
    void (async () => {
      try {
        const data = await apiRequest<{ trip: Trip }>(
          `/api/trips/${encodeURIComponent(id)}`,
          await getToken(),
          { signal: controller.signal },
        );
        if (alive) {
          setTrip(data.trip);
          setError("");
        }
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error ? e.message : "여행을 불러오지 못했어요.",
          );
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [getToken, id, isLoaded, isSignedIn, revision]);
  if (isLoaded && !isSignedIn) return <Redirect href="/sign-in" />;
  if (error)
    return (
      <Page>
        <Text style={s.body}>{error}</Text>
        <Button
          title="다시 불러오기"
          onPress={() => setRevision((n) => n + 1)}
        />
        <Button title="내 여행으로" onPress={() => router.replace("/trips")} />
      </Page>
    );
  if (!trip)
    return (
      <View
        style={{ flex: 1, backgroundColor: "white", justifyContent: "center" }}
      >
        <ActivityIndicator color="#2455BE" />
      </View>
    );
  if (trip.status !== "ready" || !trip.itinerary)
    return (
      <Redirect href={{ pathname: "/trip-loading", params: { id: trip.id } }} />
    );
  return <TripDetail trip={trip} />;
}
