import { useAuth } from "@clerk/expo";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Icon, Page } from "../components/travel/ui";
import TripPlanningArt from "../components/travel/TripPlanningArt";
import { apiRequest } from "../lib/api";
import type { TripStatus } from "../lib/trip-contract";
import { isClerkConfigured } from "../lib/auth";

export default function LoadingRoute() {
  if (!isClerkConfigured) return <Redirect href="/sign-in" />;
  return <Loading />;
}
function Loading() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [details, setDetails] = useState<{
    destination: string;
    numDays: number;
    numTravelers: number;
  } | null>(null);
  const tokenGetter = useRef(getToken);
  useEffect(() => {
    tokenGetter.current = getToken;
  }, [getToken]);
  const [status, setStatus] = useState<TripStatus>("pending");
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [revision, setRevision] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !id) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const token = await tokenGetter.current();
        const data = await apiRequest<{
          destination: string;
          numDays: number;
          numTravelers: number;
          status: TripStatus;
          error: string | null;
        }>(`/api/trips/${encodeURIComponent(id)}/status`, token, {
          signal: controller.signal,
        });
        if (!alive) return;
        setDetails({
          destination: data.destination,
          numDays: data.numDays,
          numTravelers: data.numTravelers,
        });
        setStatus(data.status);
        setError(data.error ?? "");
        if (data.status === "ready") {
          router.replace({ pathname: "/trip-detail", params: { id } });
          return;
        }
        if (data.status === "failed") return;
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "연결 상태를 확인해 주세요.");
      }
      if (alive) timer = setTimeout(() => void poll(), 3000);
    }
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, isLoaded, isSignedIn, revision, router]);
  const retry = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRetrying(true);
    setError("");
    try {
      const token = await tokenGetter.current();
      await apiRequest(`/api/trips/${encodeURIComponent(id)}/retry`, token, {
        method: "POST",
      });
      setStatus("pending");
      setRevision((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 시도하지 못했어요.");
    } finally {
      setRetrying(false);
      inFlight.current = false;
    }
  }, [id]);
  if (isLoaded && !isSignedIn) return <Redirect href="/sign-in" />;
  const failed = status === "failed";
  const stage = status === "pending" ? 0 : status === "ready" ? 2 : 1;
  const stages = [
    { icon: "send" as const, label: "요청 접수" },
    { icon: "map" as const, label: "AI 일정 구성" },
    { icon: "check" as const, label: "여행 완성" },
  ];
  return (
    <Page>
      <View style={styles.top}>
        <Text style={styles.brand}>
          waylo<Text style={{ color: "#2787DE" }}>.</Text>
        </Text>
        <View style={styles.tag}>
          <Icon name="zap" size={12} color="#2866BE" />
          <Text style={styles.tagText}>AI 여행 플래너</Text>
        </View>
      </View>
      <View style={styles.content}>
        <TripPlanningArt paused={failed} />
        <Text style={styles.eyebrow}>
          {failed ? "잠시 쉬어가는 중" : "새로운 여행의 시작"}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {failed
            ? "여행을 완성하지 못했어요"
            : "당신만의 여행을\n그려내고 있어요"}
        </Text>
        <Text style={styles.destination}>
          {details ? details.destination : "설레는 다음 목적지"}
        </Text>
        <Text style={styles.meta}>
          {details
            ? details.numDays + "일의 여정 · " + details.numTravelers + "명"
            : "여행 정보를 확인하고 있어요"}
        </Text>
        {!failed && (
          <View style={styles.steps}>
            {stages.map((item, index) => (
              <View key={item.label} style={styles.step}>
                {index < 2 && (
                  <View
                    style={[
                      styles.connector,
                      index < stage && { backgroundColor: "#78ADE7" },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.stepCircle,
                    index === stage && styles.current,
                    index < stage && styles.done,
                  ]}
                >
                  <Icon
                    name={index < stage ? "check" : item.icon}
                    size={20}
                    color={index <= stage ? "#FFFFFF" : "#A1ADBC"}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    index === stage && { color: "#1F5BB9", fontWeight: "700" },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon
            name={failed ? "cloud-off" : "compass"}
            size={17}
            color={failed ? "#B76A44" : "#3675C7"}
          />
          <Text style={styles.messageText}>
            {failed
              ? "잠시 후 다시 시도해 주세요."
              : status === "pending"
                ? "여행 조건을 전달하고 있어요."
                : "취향에 맞는 일정과 예상 비용을 준비하고 있어요."}
          </Text>
        </View>
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        {failed && (
          <View style={{ width: "100%", marginTop: 16 }}>
            <Button
              title={retrying ? "다시 요청 중…" : "다시 시도하기"}
              onPress={() => void retry()}
            />
          </View>
        )}
        <Text style={styles.note}>
          좋은 여행을 위해 조금만 기다려 주세요.{"\n"}화면을 나가도 일정은 계속
          만들어져요.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.back}
          onPress={() => router.replace("/trips")}
        >
          <Text style={styles.backText}>내 여행에서 기다리기</Text>
          <Icon name="arrow-right" size={16} color="#63788F" />
        </Pressable>
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  brand: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#173A40",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EDF4FE",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tagText: { fontSize: 10, fontWeight: "600", color: "#356799" },
  content: { alignItems: "center", paddingTop: 22, paddingBottom: 18 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#5189BB",
    marginTop: 3,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 39,
    fontWeight: "800",
    color: "#182C3D",
    textAlign: "center",
    letterSpacing: -1,
  },
  destination: {
    fontSize: 17,
    fontWeight: "600",
    color: "#50647A",
    textAlign: "center",
    marginTop: 17,
  },
  meta: { fontSize: 12, color: "#8B99A9", marginTop: 6 },
  steps: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 360,
    marginTop: 32,
    marginBottom: 25,
  },
  step: { flex: 1, alignItems: "center" },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F3F7",
    borderWidth: 1,
    borderColor: "#E6EBF2",
    alignItems: "center",
    justifyContent: "center",
  },
  current: { backgroundColor: "#2C81DF", borderColor: "#2C81DF" },
  done: { backgroundColor: "#8BB8E6", borderColor: "#8BB8E6" },
  connector: {
    position: "absolute",
    top: 23,
    left: "71%",
    width: "58%",
    height: 2,
    backgroundColor: "#E4EAF2",
  },
  stepLabel: { fontSize: 10, color: "#99A4B2", marginTop: 10 },
  message: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#EEF5FD",
    width: "100%",
  },
  messageText: { flex: 1, fontSize: 12, lineHeight: 19, color: "#4174A6" },
  error: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    color: "#A86135",
    marginTop: 15,
  },
  note: {
    fontSize: 11,
    lineHeight: 19,
    textAlign: "center",
    color: "#92A0AF",
    marginTop: 26,
  },
  back: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 9,
  },
  backText: { fontSize: 12, fontWeight: "600", color: "#63788F" },
});
