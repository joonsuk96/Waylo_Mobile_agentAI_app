import Constants from "expo-constants";
import { Component, lazy, Suspense, type PropsWithChildren } from "react";
import { ActivityIndicator, Platform, UIManager, View } from "react-native";
import type { TripMapProps } from "./TripMap.types";
import TripMapFallback from "./TripMapFallback";

const NativeMap = lazy(() => import("./TripMapView"));
class MapBoundary extends Component<
  PropsWithChildren<{ fallback: React.ReactNode }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function TripMap(props: TripMapProps) {
  const configured =
    Platform.OS === "android" &&
    Boolean(Constants.expoConfig?.extra?.googleMapsConfigured);
  // Avoid importing/registering a missing native view in the old development build.
  const installed =
    configured &&
    ["RNMapsMapView", "AIRMap"].some((name) =>
      Boolean(UIManager.getViewManagerConfig(name)),
    );
  const fallback = (
    <TripMapFallback
      onOpenGoogle={props.onOpenGoogle}
      empty={!props.points.length}
    />
  );
  if (!installed) return fallback;
  return (
    <MapBoundary fallback={fallback}>
      <Suspense
        fallback={
          <View style={{ height: 285, justifyContent: "center" }}>
            <ActivityIndicator color="#2455BE" />
          </View>
        }
      >
        <NativeMap {...props} />
      </Suspense>
    </MapBoundary>
  );
}
