import { useClerk, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState, type ComponentProps } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/travel/ui";
import { useTrips } from "../../hooks/useTrips";
type Row = {
  icon: ComponentProps<typeof Icon>["name"];
  label: string;
  detail?: string;
  action?: () => void;
  note?: string;
};
function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View style={st.section}>
      <Text style={st.heading}>{title}</Text>
      <View style={st.group}>
        {rows.map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            onPress={
              row.action ??
              (() =>
                Alert.alert(
                  row.label,
                  row.detail ?? "현재 로컬 개발 버전에서 준비 중인 기능이에요.",
                ))
            }
            style={st.row}
          >
            <Icon name={row.icon} size={20} color="#87909E" />
            <Text style={st.rowText}>{row.label}</Text>
            {!!row.note && <Text style={st.rowNote}>{row.note}</Text>}
            <Icon name="chevron-right" size={18} color="#B0B7C2" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export default function ProfileScreen() {
  const { user } = useUser(),
    { signOut } = useClerk(),
    router = useRouter(),
    { trips, loading, error } = useTrips();
  const [busy, setBusy] = useState(false);
  const ready = trips.filter((t) => t.status === "ready");
  const destinations = new Set(
    ready.map((t) => t.input.destination.trim().toLowerCase()),
  ).size;
  const name = user?.fullName ?? user?.firstName ?? "여행자";
  function logout() {
    Alert.alert(
      "로그아웃할까요?",
      "다음에 Google 계정으로 다시 로그인할 수 있어요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          onPress: () => {
            if (busy) return;
            setBusy(true);
            void signOut()
              .catch(() =>
                Alert.alert("로그아웃 실패", "잠시 후 다시 시도해 주세요."),
              )
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={st.page}>
      <ScrollView
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={st.title}>프로필</Text>
        <View style={st.userCard}>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={st.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[st.avatar, st.initial]}>
              <Text style={st.initialText}>{name.slice(0, 1)}</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={st.name}>{name}</Text>
            <Text style={st.email} numberOfLines={2}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
            <Text style={st.google}>Google 계정으로 연결됨</Text>
          </View>
        </View>
        <View style={st.stats}>
          {[
            { icon: "send" as const, value: ready.length, label: "여행 계획" },
            { icon: "globe" as const, value: destinations, label: "여행지" },
            {
              icon: "calendar" as const,
              value: ready.reduce((n, t) => n + t.num_days, 0),
              label: "계획한 일수",
            },
          ].map((item, i) => (
            <View key={item.label} style={[st.stat, i > 0 && st.statBorder]}>
              <View style={st.statIcon}>
                <Icon name={item.icon} size={19} color="#2B90E8" />
              </View>
              <Text style={st.statValue}>
                {loading ? "…" : error ? "—" : item.value}
              </Text>
              <Text style={st.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={st.statCaption}>
          저장된 최근 최대 100개 여행의 완성된 일정 기준
        </Text>
        <Group
          title="계정"
          rows={[
            {
              icon: "sliders",
              label: "여행 취향",
              action: () => router.push("/planner"),
            },
            {
              icon: "bell",
              label: "알림",
              note: "준비 중",
              detail:
                "아직 푸시 알림을 보내지 않아요. 여행 생성 결과는 ‘내 여행’에서 확인해 주세요.",
            },
            {
              icon: "credit-card",
              label: "결제 수단",
              note: "미사용",
              detail:
                "현재 앱 내 결제 기능은 없으며, 결제 수단을 저장하지 않아요.",
            },
          ]}
        />
        <Group
          title="환경 설정"
          rows={[
            {
              icon: "settings",
              label: "앱 설정",
              detail:
                "현재 로컬 개발 버전이에요. 기본 통화는 원화(₩)이며 Google 계정으로 로그인해요.",
            },
            {
              icon: "moon",
              label: "화면 테마",
              note: "라이트",
              detail:
                "현재는 라이트 테마를 사용해요. 다크 모드 전환은 준비 중이에요.",
            },
            {
              icon: "globe",
              label: "언어",
              note: "한국어",
              detail:
                "현재는 한국어로 제공해요. 다른 언어로 바꾸는 기능은 준비 중이에요.",
            },
          ]}
        />
        <Group
          title="도움말 및 지원"
          rows={[
            {
              icon: "help-circle",
              label: "도움말",
              detail:
                "홈의 ‘시작하기’에서 여행을 계획하고, 웨일로 챗에서 여행 질문을 할 수 있어요. ‘내 여행’에서는 일정을 확인하거나 삭제할 수 있어요.",
            },
            {
              icon: "shield",
              label: "개인정보 안내",
              detail:
                "Google 로그인은 Clerk, 여행 일정 저장은 Neon, AI 응답 생성은 OpenAI를 이용해요. 여행 삭제 시 해당 일정과 연결된 지도 좌표가 삭제돼요. 정식 개인정보처리방침은 배포 전에 준비할 예정이에요.",
            },
            {
              icon: "file-text",
              label: "이용 안내",
              detail:
                "현재 개인용 로컬 개발 앱이에요. 일정과 예산은 AI의 제안이며 실제 가격·영업시간·예약 가능 여부는 방문 전에 직접 확인해 주세요.",
            },
            {
              icon: "star",
              label: "Waylo 평가하기",
              note: "출시 전",
              detail:
                "아직 스토어에 출시되지 않았어요. 출시 후 평가 기능을 연결할 예정이에요.",
            },
            {
              icon: "gift",
              label: "친구 초대",
              note: "준비 중",
              detail:
                "현재 로컬에서만 실행되는 앱이라 공유 가능한 설치 링크가 없어요.",
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={logout}
          style={st.logout}
        >
          <Icon name="log-out" size={19} color="#445062" />
          <Text style={st.logoutText}>
            {busy ? "로그아웃 중…" : "로그아웃"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              "계정 삭제 안내",
              "앱에서 계정을 삭제하는 기능은 아직 연결되지 않았어요. 여행 기록은 ‘내 여행’에서 개별 삭제할 수 있어요.",
            )
          }
          style={st.logout}
        >
          <Icon name="trash-2" size={19} color="#D36B72" />
          <Text style={[st.logoutText, { color: "#D36B72" }]}>계정 삭제</Text>
          <Text style={st.rowNote}>준비 중</Text>
        </Pressable>
        <Text style={st.version}>
          Waylo v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 35,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#172134",
    letterSpacing: -1,
    marginBottom: 24,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    borderRadius: 26,
    padding: 21,
  },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  initial: {
    backgroundColor: "#1265A9",
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: { fontSize: 29, color: "white" },
  name: { fontSize: 18, fontWeight: "700", color: "#172134" },
  email: { fontSize: 12, color: "#7B8391", lineHeight: 18 },
  google: { fontSize: 10, color: "#60937B" },
  stats: {
    flexDirection: "row",
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    borderRadius: 26,
    marginTop: 18,
    boxShadow: "0px 4px 20px rgba(27,49,77,0.035)",
  },
  stat: { flex: 1, alignItems: "center", gap: 7 },
  statBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#EDF0F5",
  },
  statIcon: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 25, fontWeight: "800", color: "#172134" },
  statLabel: { fontSize: 12, color: "#858D9B" },
  statCaption: {
    fontSize: 9,
    color: "#ADB4BF",
    textAlign: "center",
    marginTop: 9,
  },
  section: { marginTop: 23 },
  heading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A909B",
    marginBottom: 12,
    marginLeft: 5,
  },
  group: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    paddingVertical: 5,
    boxShadow: "0px 4px 20px rgba(27,49,77,0.025)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    minHeight: 56,
  },
  rowText: { flex: 1, fontSize: 14, color: "#2C3545" },
  rowNote: { fontSize: 10, color: "#A3AAB6" },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    borderRadius: 25,
    minHeight: 51,
    marginTop: 18,
  },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#445062" },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: "#ABB2BE",
    marginTop: 25,
  },
});
