import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { Icon } from "./ui";

export default function TripPlanningArt({
  paused = false,
}: {
  paused?: boolean;
}) {
  const [motion] = useState(() => new Animated.Value(0));
  useFocusEffect(
    useCallback(() => {
      let active = true,
        reduced = true;
      let animation: Animated.CompositeAnimation | undefined;
      function update() {
        animation?.stop();
        motion.setValue(0);
        if (!active || reduced || paused || AppState.currentState !== "active")
          return;
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(motion, {
              toValue: 1,
              duration: 1900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
              isInteraction: false,
            }),
            Animated.timing(motion, {
              toValue: 0,
              duration: 1900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
              isInteraction: false,
            }),
          ]),
        );
        animation.start();
      }
      const accessibility = AccessibilityInfo.addEventListener(
        "reduceMotionChanged",
        (value) => {
          reduced = value;
          update();
        },
      );
      const appState = AppState.addEventListener("change", update);
      void AccessibilityInfo.isReduceMotionEnabled()
        .then((value) => {
          if (active) {
            reduced = value;
            update();
          }
        })
        .catch(() => {});
      return () => {
        active = false;
        animation?.stop();
        accessibility.remove();
        appState.remove();
      };
    }, [motion, paused]),
  );
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.scene}
    >
      <View style={styles.halo} />
      <View style={styles.orbit} />
      <Animated.View
        style={[
          styles.shadow,
          {
            opacity: motion.interpolate({
              inputRange: [0, 1],
              outputRange: [0.18, 0.09],
            }),
            transform: [
              {
                scaleX: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          width: 280,
          height: 260,
          transform: [
            {
              translateY: motion.interpolate({
                inputRange: [0, 1],
                outputRange: [3, -9],
              }),
            },
            {
              rotate: motion.interpolate({
                inputRange: [0, 1],
                outputRange: ["-1deg", "1deg"],
              }),
            },
          ],
        }}
      >
        <Image
          source={require("../../../assets/images/trip-planning-map.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          accessible={false}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.spark,
          {
            opacity: motion.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 1],
            }),
            transform: [
              {
                scale: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.15],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="star" size={18} color="#74B4E8" />
      </Animated.View>
      <View style={styles.dot} />
    </View>
  );
}
const styles = StyleSheet.create({
  scene: {
    width: "100%",
    height: 285,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 238,
    height: 238,
    borderRadius: 119,
    backgroundColor: "#EDF5FF",
  },
  orbit: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: "#E5EEFB",
    borderStyle: "dashed",
  },
  shadow: {
    position: "absolute",
    bottom: 34,
    width: 130,
    height: 13,
    borderRadius: 65,
    backgroundColor: "#699FC9",
  },
  spark: { position: "absolute", right: "13%", top: 39 },
  dot: {
    position: "absolute",
    left: "12%",
    bottom: 61,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A1D5C8",
  },
});
