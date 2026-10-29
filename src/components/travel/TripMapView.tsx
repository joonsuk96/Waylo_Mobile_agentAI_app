import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { dayColor, groupPlaces, mapRegion } from "../../lib/trip-places";
import type { TripMapProps } from "./TripMap.types";
import { Icon } from "./ui";

export default function TripMapView({
  points,
  center,
  selected,
  onSelect,
  onOpenGoogle,
}: TripMapProps) {
  const ref = useRef<MapView | null>(null);
  const [ready, setReady] = useState(false);
  const groups = useMemo(() => groupPlaces(points), [points]);
  const region = useMemo(
    () =>
      mapRegion(points) ??
      center ?? {
        latitude: 20,
        longitude: 0,
        latitudeDelta: 120,
        longitudeDelta: 180,
      },
    [points, center],
  );
  const fit = useCallback(() => {
    if (!ready) return;
    if (!points.length) {
      if (center) ref.current?.animateToRegion(center, 350);
      return;
    }
    if (points.length === 1) {
      ref.current?.animateToRegion(region, 350);
      return;
    }
    ref.current?.fitToCoordinates(
      points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      {
        edgePadding: { top: 46, right: 42, bottom: 46, left: 42 },
        animated: true,
      },
    );
  }, [points, ready, region, center]);
  useEffect(() => {
    fit();
  }, [fit]);
  return (
    <View style={st.frame}>
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onMapReady={() => setReady(true)}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        loadingEnabled
      >
        {groups.map((group) => {
          const active = group.some((p) => p.number === selected);
          const first = group[0];
          const numbers = [...new Set(group.map((p) => p.day))];
          return (
            <Marker
              key={`${group.map((p) => p.number).join("-")}-${active}`}
              coordinate={{
                latitude: first.latitude,
                longitude: first.longitude,
              }}
              title={group.map((p) => `${p.day}일차 · ${p.name}`).join(" / ")}
              description={`${first.day}일차 · ${first.time}`}
              onPress={() => onSelect(first.number)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={active ? 100 : 1}
            >
              <View
                collapsable={false}
                style={[
                  st.marker,
                  { backgroundColor: dayColor(first.day) },
                  active && st.active,
                ]}
              >
                <Text style={st.markerText}>
                  {numbers.length <= 2
                    ? numbers.join("·")
                    : `${numbers[0]}+${numbers.length - 1}`}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
      <View style={st.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="모든 장소가 보이도록 지도 맞추기"
          onPress={fit}
          style={st.tool}
        >
          <Icon name="maximize" size={17} color="#2455BE" />
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Google 지도에서 열기"
          onPress={onOpenGoogle}
          style={st.tool}
        >
          <Icon name="external-link" size={17} color="#2455BE" />
        </Pressable>
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  frame: {
    height: 285,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#EAF0F5",
  },
  marker: {
    minWidth: 37,
    height: 37,
    paddingHorizontal: 7,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  active: { borderColor: "#F4D76D", borderWidth: 4 },
  markerText: { color: "white", fontWeight: "800", fontSize: 13 },
  tools: { position: "absolute", top: 13, right: 13, gap: 9 },
  tool: {
    height: 35,
    width: 35,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});
