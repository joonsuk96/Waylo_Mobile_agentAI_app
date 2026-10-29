import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onGooglePress?: () => void;
  busy?: boolean;
  error?: string | null;
  configured: boolean;
};

export default function WelcomeScreen({ onGooglePress, busy = false, error, configured }: Props) {
  const insets = useSafeAreaInsets();
  const disabled = busy || !configured;

  return (
    <View className="flex-1 bg-[#032e37]">
      <StatusBar style="light" />
      <Image source={require("../../assets/images/bali-auth-background.png")} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="노을이 지는 발리의 바다와 리조트" />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.gradient]} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 20) + 18 }]} bounces={false}>
        <View className="flex-row items-center gap-[8px]">
          <Image source={require("../../assets/images/triply-mark.svg")} style={{ width: 40, height: 30 }} contentFit="contain" accessible={false} />
          <Text className="text-[26px] font-light tracking-[-1px] text-white">Waylo</Text>
        </View>

        <View style={styles.bottom}>
          <Text className="mb-[16px] text-[10px] font-semibold tracking-[3px] text-white/80">YOUR NEXT CHAPTER</Text>
          <Text accessibilityRole="header" style={styles.title}>다음 여행,{"\n"}함께 떠나볼까요?</Text>
          <Text className="mt-[16px] text-[15px] leading-[24px] text-white/80">설레는 시작부터 나만의 여행 일정까지.{"\n"}AI가 당신의 여정을 함께 계획해요.</Text>

          <Pressable accessibilityRole="button" accessibilityLabel="Google로 계속하기" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onGooglePress} style={[styles.googleButton, { opacity: disabled ? 0.65 : 1 }]}>
            {busy ? <ActivityIndicator color="#0c3139" /> : <Text style={styles.googleMark} accessible={false}>G</Text>}
            <Text className="text-[15px] font-semibold text-[#14353c]">{busy ? "Google에 연결하는 중…" : "Google로 계속하기"}</Text>
          </Pressable>
          {error ? <Text accessibilityRole="alert" className="mt-[14px] text-center text-[13px] leading-[20px] text-[#ffe5bd]">{error}</Text> : null}
          {!configured ? <Text className="mt-[14px] text-center text-[12px] leading-[20px] text-white/75">로그인 연결을 준비하고 있어요.</Text> : null}
          <Text className="mt-[22px] text-center text-[11px] leading-[18px] text-white/60">나만의 여행은 여기서 시작됩니다.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { backgroundImage: "linear-gradient(180deg, rgba(1,24,31,0.16) 0%, rgba(1,24,31,0) 30%, rgba(1,24,31,0.45) 55%, rgba(1,24,31,0.96) 100%)" },
  content: { flexGrow: 1, paddingHorizontal: 28, minHeight: "100%", justifyContent: "space-between" },
  bottom: { paddingTop: 180 },
  title: { color: "#fff", fontSize: 34, lineHeight: 47, fontWeight: "600", letterSpacing: -1.4 },
  googleButton: { marginTop: 32, minHeight: 58, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 30, backgroundColor: "#fff", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14 },
  googleMark: { color: "#4285f4", fontSize: 23, fontWeight: "700" },
});
