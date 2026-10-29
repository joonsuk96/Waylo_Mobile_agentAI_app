import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Show the brand briefly before entering the authentication flow.
export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/sign-in"), 1800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 bg-[#352f2c]">
      <StatusBar style="light" />
      <Image
        source={require("../../assets/images/grand-canyon-splash.png")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        accessibilityLabel="Golden sunlight over the Grand Canyon"
      />
      <View pointerEvents="none" style={styles.shade} />
      <View className="absolute left-[24px] right-[24px] top-[37%] items-center" accessibilityRole="header">
        <Image
          source={require("../../assets/images/triply-mark.svg")}
          style={styles.mark}
          contentFit="contain"
          accessible={false}
        />
        <Text style={styles.name}>Waylo</Text>
        <View style={styles.rule} />
        <Text style={styles.tagline}>AI Travel Companion</Text>
      </View>
      <View style={[styles.caption, { bottom: Math.max(insets.bottom, 20) + 20 }]}>
        <View style={styles.locationDot} />
        <Text style={styles.location}>GRAND CANYON, ARIZONA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(12, 22, 27, 0.24)" },
  mark: { width: 112, height: 72, marginBottom: 0 },
  name: {
    color: "#fff", fontSize: 68, fontWeight: "300", letterSpacing: -3,
    lineHeight: 82, textAlign: "center", includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.18)", textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  rule: { width: 146, height: 1, backgroundColor: "rgba(255,255,255,0.42)", marginTop: 9, marginBottom: 13 },
  tagline: { color: "#fff", fontSize: 14, fontWeight: "500", letterSpacing: 1.1, textAlign: "center" },
  caption: { position: "absolute", left: 24, right: 24, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  locationDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.8)" },
  location: { color: "rgba(255,255,255,0.8)", fontSize: 9, fontWeight: "500", letterSpacing: 2 },
});
