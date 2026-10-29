import { useAuth } from "@clerk/expo";
import { useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { totalBudget, type Trip } from "../../lib/trip-contract";
import { Icon } from "./ui";
import { PhotoCredit } from "./PhotoCredit";

const labels = {
  pending: "생성 대기 중",
  generating: "일정을 만들고 있어요",
  ready: "여행 준비 완료",
  failed: "다시 시도할 수 있어요",
};
export default function TripCard({
  trip,
  onDeleted,
}: {
  trip: Trip;
  onDeleted?: () => void;
}) {
  const { getToken } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const inFlight = useRef(false);
  async function remove() {
    if (inFlight.current) return;
    inFlight.current = true;
    setDeleting(true);
    try {
      await apiRequest(
        `/api/trips/${encodeURIComponent(trip.id)}`,
        await getToken(),
        { method: "DELETE" },
      );
      setDeleted(true);
      onDeleted?.();
    } catch (error) {
      Alert.alert(
        "삭제하지 못했어요",
        error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.",
      );
    } finally {
      inFlight.current = false;
      setDeleting(false);
    }
  }
  function confirmDelete() {
    Alert.alert(
      "여행을 삭제할까요?",
      `“${trip.itinerary?.title ?? trip.input.destination}” 일정과 저장된 지도 위치가 영구 삭제돼요. 삭제한 여행은 복구할 수 없어요.`,
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => void remove() },
      ],
    );
  }
  const router = useRouter();
  const money = trip.itinerary
    ? Math.round(
        totalBudget(trip.itinerary) / trip.input.numTravelers,
      ).toLocaleString("ko-KR")
    : null;
  if (deleted) return null;
  return (
    <View style={st.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${trip.input.destination} 여행 열기`}
        onPress={() =>
          router.push({
            pathname:
              trip.status === "ready" ? "/trip-detail" : "/trip-loading",
            params: { id: trip.id },
          })
        }
      >
        <View style={st.cover}>
          <Image
            source={
              trip.cover?.url
                ? { uri: trip.cover.url }
                : require("../../../assets/images/grand-canyon-splash.png")
            }
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={st.shade} />
          <View style={st.badge}>
            <Text style={st.badgeText}>
              {trip.num_days}일 · {trip.input.numTravelers}명
            </Text>
          </View>
          <View style={st.caption}>
            <Text style={st.title}>
              {trip.itinerary?.title ?? trip.input.destination}
            </Text>
            <Text style={st.status}>{labels[trip.status]}</Text>
          </View>
        </View>
        <View style={st.footer}>
          <Icon name="briefcase" size={17} color="#778191" />
          <Text style={st.cost}>
            {money
              ? `예상 ₩${money} / 1인`
              : trip.status === "failed"
                ? "생성을 완료하지 못했어요"
                : "나만의 여행을 준비하고 있어요"}
          </Text>
          <Icon name="chevron-right" color="#2455BE" size={18} />
        </View>
      </Pressable>
      <PhotoCredit cover={trip.cover} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${trip.input.destination} 여행 삭제`}
        accessibilityState={{ disabled: deleting, busy: deleting }}
        disabled={deleting}
        onPress={confirmDelete}
        style={st.deleteButton}
      >
        {deleting ? (
          <ActivityIndicator size="small" color="#C14B57" />
        ) : (
          <Icon name="trash-2" size={15} color="#C14B57" />
        )}
        <Text style={st.deleteText}>{deleting ? "삭제 중…" : "여행 삭제"}</Text>
      </Pressable>
    </View>
  );
}
const st = StyleSheet.create({
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
    paddingHorizontal: 18,
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5EAF0",
  },
  deleteText: { fontSize: 12, fontWeight: "600", color: "#C14B57" },
  card: {
    backgroundColor: "white",
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5EAF0",
    marginBottom: 15,
  },
  cover: { height: 180, backgroundColor: "#2455BE" },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,25,35,.42)" },
  badge: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 11,
    backgroundColor: "rgba(0,0,0,.35)",
  },
  badgeText: { color: "white", fontSize: 11 },
  caption: { position: "absolute", bottom: 20, left: 20, right: 20 },
  title: { color: "white", fontSize: 22, fontWeight: "700", lineHeight: 30 },
  status: { color: "white", fontSize: 11, marginTop: 6 },
  footer: { flexDirection: "row", gap: 9, alignItems: "center", padding: 17 },
  cost: { flex: 1, fontSize: 12, color: "#778191" },
});
