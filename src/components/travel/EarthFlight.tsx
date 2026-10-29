import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";

/** Decorative only: native-driven animation pauses when the home tab loses focus. */
export default function EarthFlight() {
  const [progress] = useState(() => new Animated.Value(0));
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let animation: Animated.CompositeAnimation | undefined;
      function setMotion(reduced: boolean) {
        animation?.stop();
        progress.setValue(reduced ? 0.5 : 0);
        if (reduced || !active) return;
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(progress, {
              toValue: 1,
              duration: 4200,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
              isInteraction: false,
            }),
            Animated.delay(1600),
          ]),
        );
        animation.start();
      }
      const subscription = AccessibilityInfo.addEventListener(
        "reduceMotionChanged",
        setMotion,
      );
      void AccessibilityInfo.isReduceMotionEnabled()
        .then((reduced) => {
          if (active) setMotion(reduced);
        })
        .catch(() => {
          if (active) setMotion(true);
        });
      return () => {
        active = false;
        animation?.stop();
        subscription.remove();
      };
    }, [progress]),
  );
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.container}
    >
      <Image
        source={require("../../../assets/images/earth-illustrated.png")}
        contentFit="contain"
        style={styles.earth}
        accessible={false}
      />
      <Animated.View
        style={[
          styles.plane,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.12, 0.85, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 90],
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [18, -4, 10],
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ["-15deg", "0deg", "15deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={require("../../../assets/images/airplane-illustrated.png")}
          style={{ width: 46, height: 46 }}
          contentFit="contain"
          accessible={false}
        />
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { width: 132, height: 150 },
  earth: { position: "absolute", top: 22, left: 2, width: 128, height: 128 },
  plane: { position: "absolute", left: 0, top: 0, width: 46, height: 46 },
});
