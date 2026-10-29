import { useAuth } from "@clerk/expo";
import * as Crypto from "expo-crypto";
import { apiRequest } from "../../lib/api";
import { tripInputSchema, type Trip } from "../../lib/trip-contract";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  dateKey,
  daysInclusive,
  selectRange,
  shortDate,
} from "../../lib/calendar";
import { Icon } from "../travel/ui";
import TripCalendar from "./TripCalendar";

const budgets = ["알뜰하게", "편안하게", "여유롭게"];
const paces = ["여유롭게", "균형 있게", "알차게"];
const interests = [
  "모험",
  "해변",
  "맛집·카페",
  "문화·예술",
  "자연",
  "야경",
  "쇼핑",
  "역사",
  "휴식",
  "드라이브",
];

export default function TripPlanner({
  initialDestination,
}: {
  initialDestination: string;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  const [today] = useState(() => dateKey(new Date()));
  const [destination, setDestination] = useState(initialDestination);
  const [range, setRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [budget, setBudget] = useState("편안하게");
  const [travelers, setTravelers] = useState(2);
  const [tags, setTags] = useState<string[]>([]);
  const [pace, setPace] = useState("균형 있게");
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const numDays =
    range.start && range.end ? daysInclusive(range.start, range.end) : 0;
  const ready = !!destination.trim() && numDays >= 1 && numDays <= 30;
  function chooseDate(day: string) {
    const next = selectRange(range.start, range.end, day);
    if (next.start && next.end && daysInclusive(next.start, next.end) > 30) {
      setError("한 번에 최대 30일까지 선택할 수 있어요.");
      return;
    }
    setRange(next);
    setError("");
  }
  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((x) => x !== tag)
        : [...current, tag],
    );
  }
  async function createTrip() {
    if (pending.current || !ready) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const input = tripInputSchema.parse({
        destination: destination.trim(),
        startDate: range.start,
        endDate: range.end,
        numTravelers: travelers,
        budgetTier:
          budget === "알뜰하게"
            ? "low"
            : budget === "여유롭게"
              ? "luxury"
              : "medium",
        interests: tags,
        pace:
          pace === "여유롭게"
            ? "relaxed"
            : pace === "알차게"
              ? "fast"
              : "balanced",
      });
      const fingerprint = JSON.stringify(input);
      if (submission.current?.fingerprint !== fingerprint)
        submission.current = { fingerprint, id: Crypto.randomUUID() };
      const result = await apiRequest<{ trip: Trip }>(
        "/api/trips",
        await getToken(),
        {
          method: "POST",
          body: JSON.stringify({ input, requestId: submission.current!.id }),
        },
      );
      setReview(false);
      router.push({
        pathname: "/trip-loading",
        params: { id: result.trip.id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "여행을 요청하지 못했어요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={st.screen}>
      <View style={st.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="홈으로 돌아가기"
          onPress={() => router.navigate("/home")}
          style={st.back}
        >
          <Icon name="chevron-left" size={23} color="#19263A" />
        </Pressable>
        <Text accessibilityRole="header" style={st.headerTitle}>
          여행 계획하기
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={st.content}
        >
          <View style={st.intro}>
            <View style={st.sparkle}>
              <MaterialCommunityIcons name="creation" size={23} color="white" />
            </View>
            <View style={st.bubble}>
              <Text style={st.introTitle}>
                안녕하세요, 나만의 AI 여행 도우미예요.
              </Text>
              <Text style={st.introBody}>
                몇 가지 취향을 알려주세요.{"\n"}나에게 맞는 여행을 함께
                그려볼게요.
              </Text>
            </View>
          </View>
          <Text accessibilityRole="header" style={st.label}>
            어디로 떠날까요?
          </Text>
          <View style={st.inputRow}>
            <Icon name="map-pin" size={20} color="#8790A0" />
            <TextInput
              accessibilityLabel="여행 목적지"
              placeholder="예: 일본 도쿄, 제주도"
              placeholderTextColor="#A0A8B6"
              value={destination}
              onChangeText={setDestination}
              maxLength={100}
              returnKeyType="done"
              style={st.input}
            />
            {!!destination && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="목적지 지우기"
                hitSlop={10}
                onPress={() => setDestination("")}
              >
                <Icon name="x" size={17} color="#8790A0" />
              </Pressable>
            )}
          </View>
          <View style={st.labelRow}>
            <Text accessibilityRole="header" style={st.labelInline}>
              언제 떠날까요?
            </Text>
            {numDays > 0 && (
              <Text style={st.dayBadge}>
                {numDays === 1 ? "당일 여행" : `${numDays - 1}박 ${numDays}일`}
              </Text>
            )}
          </View>
          <TripCalendar
            today={today}
            start={range.start}
            end={range.end}
            onSelect={chooseDate}
          />
          {!!error && (
            <Text accessibilityRole="alert" style={st.error}>
              {error}
            </Text>
          )}
          <Text accessibilityRole="header" style={st.label}>
            예산 스타일 <Text style={st.labelHint}>(1인 기준)</Text>
          </Text>
          <ChoiceRow options={budgets} value={budget} onChange={setBudget} />
          <Text style={st.footnote}>예상 여행 비용은 원화(₩)로 안내해요.</Text>
          <Text accessibilityRole="header" style={st.label}>
            몇 명이 함께하나요?
          </Text>
          <View style={st.travelerRow}>
            <Icon name="users" color="#7B8595" />
            <Text style={st.travelerText}>{travelers}명</Text>
            <Counter
              label="여행 인원 줄이기"
              name="minus"
              disabled={travelers === 1}
              onPress={() => setTravelers((n) => Math.max(1, n - 1))}
            />
            <Counter
              label="여행 인원 늘리기"
              name="plus"
              disabled={travelers === 20}
              onPress={() => setTravelers((n) => Math.min(20, n + 1))}
            />
          </View>
          <View style={st.labelRow}>
            <Text accessibilityRole="header" style={st.labelInline}>
              어떤 여행을 좋아하나요?
            </Text>
            <Text style={st.optional}>복수 선택</Text>
          </View>
          <View style={st.tagRow}>
            {interests.map((tag) => (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityState={{ selected: tags.includes(tag) }}
                onPress={() => toggleTag(tag)}
                style={[st.tag, tags.includes(tag) && st.chosen]}
              >
                <Text
                  style={[st.chipText, tags.includes(tag) && st.chosenText]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text accessibilityRole="header" style={st.label}>
            여행 속도
          </Text>
          <ChoiceRow options={paces} value={pace} onChange={setPace} />
          <Text style={st.footnote}>
            {pace === "여유롭게"
              ? "하루에 적은 일정을 담고, 충분히 쉬어가요."
              : pace === "알차게"
                ? "다양한 장소와 경험으로 하루를 채워요."
                : "관광과 휴식이 어우러지는 일정을 선호해요."}
          </Text>
        </ScrollView>
        <View style={st.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={() => setReview(true)}
            style={[st.cta, !ready && st.ctaDisabled]}
          >
            <MaterialCommunityIcons name="creation" size={20} color="white" />
            <Text style={st.ctaText}>나의 여행 계획 확인하기</Text>
          </Pressable>
          <Text style={st.footerNote}>
            {ready
              ? "선택 내용을 확인하고 나만의 AI 일정을 만들어요."
              : "목적지와 여행 날짜를 선택하면 다음으로 갈 수 있어요."}
          </Text>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={review}
        animationType="slide"
        transparent
        onRequestClose={() => setReview(false)}
      >
        <View style={st.scrim}>
          <View accessibilityViewIsModal style={st.sheet}>
            <View style={st.sheetHandle} />
            <Text style={st.sheetTitle}>여행 준비가 한 걸음 가까워졌어요</Text>
            <Text style={st.reviewDestination}>{destination.trim()}</Text>
            <Text style={st.reviewDetail}>
              {range.start && shortDate(range.start)} —{" "}
              {range.end && shortDate(range.end)} · {numDays}일 · {travelers}명
            </Text>
            <Text style={st.reviewDetail}>
              예산: {budget} · 여행 속도: {pace}
            </Text>
            <Text style={st.reviewDetail}>
              관심사: {tags.length ? tags.join(", ") : "아직 선택하지 않았어요"}
            </Text>
            {!!error && (
              <Text accessibilityRole="alert" style={st.error}>
                {error}
              </Text>
            )}
            <View style={st.reviewNotice}>
              <Icon name="info" size={18} color="#2455BE" />
              <Text style={st.reviewNoticeText}>
                선택한 조건으로 AI 일정을 만들어요. 예상 비용은 원화이며
                항공권은 포함하지 않아요.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityState={{ disabled: busy, busy }}
              onPress={() => void createTrip()}
              style={[st.cta, busy && st.ctaDisabled]}
            >
              <Text style={st.ctaText}>
                {busy ? "여행을 요청하고 있어요…" : "AI 여행 만들기"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={st.choices}>
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={[st.choice, option === value && st.chosen]}
        >
          <Text style={[st.chipText, option === value && st.chosenText]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Counter({
  name,
  label,
  disabled,
  onPress,
}: {
  name: "plus" | "minus";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={st.counter}
    >
      <Icon name={name} size={20} color={disabled ? "#C6CCD5" : "#1D293D"} />
    </Pressable>
  );
}
const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F2F4F7",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6F7FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#172438" },
  content: {
    padding: 22,
    paddingBottom: 30,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  intro: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sparkle: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#2455BE",
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    flex: 1,
    padding: 17,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E9EDF4",
    backgroundColor: "#F9FBFF",
  },
  introTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 21,
    color: "#19263B",
  },
  introBody: { fontSize: 12, lineHeight: 20, color: "#7C8594", marginTop: 5 },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#19263B",
    marginTop: 27,
    marginBottom: 14,
  },
  labelHint: { fontSize: 12, fontWeight: "400", color: "#929AA7" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7EBF0",
    paddingHorizontal: 17,
    minHeight: 58,
  },
  input: { flex: 1, fontSize: 14, color: "#182638", paddingVertical: 15 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 14,
  },
  labelInline: { fontSize: 16, fontWeight: "700", color: "#19263B" },
  dayBadge: {
    fontSize: 11,
    color: "#2455BE",
    fontWeight: "600",
    backgroundColor: "#EAF0FF",
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  choices: { flexDirection: "row", gap: 8 },
  choice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 6,
    paddingVertical: 11,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E7EBF0",
    backgroundColor: "white",
  },
  chipText: { fontSize: 13, color: "#778191", fontWeight: "500" },
  chosen: { backgroundColor: "#2455BE", borderColor: "#2455BE" },
  chosenText: { color: "white", fontWeight: "600" },
  footnote: { fontSize: 10, color: "#929AA7", marginTop: 10, lineHeight: 17 },
  travelerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7EBF0",
    padding: 14,
  },
  travelerText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#19263B" },
  counter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F6F7FA",
    alignItems: "center",
    justifyContent: "center",
  },
  optional: { fontSize: 10, color: "#929AA7" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7EBF0",
    backgroundColor: "white",
  },
  error: { fontSize: 12, color: "#B54708", lineHeight: 19, marginTop: 10 },
  footer: {
    borderTopWidth: 1,
    borderColor: "#E9EDF3",
    paddingHorizontal: 22,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: "white",
  },
  cta: {
    backgroundColor: "#2455BE",
    minHeight: 52,
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  ctaDisabled: { backgroundColor: "#A4BCEB" },
  ctaText: { fontSize: 15, fontWeight: "700", color: "white" },
  footerNote: {
    fontSize: 9,
    lineHeight: 15,
    color: "#8F98A6",
    textAlign: "center",
    marginTop: 7,
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(15,27,45,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
    paddingBottom: 40,
    gap: 13,
  },
  sheetHandle: {
    height: 4,
    width: 35,
    borderRadius: 2,
    backgroundColor: "#DFE4ED",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "700",
    color: "#19263B",
  },
  reviewDestination: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2455BE",
    marginTop: 7,
  },
  reviewDetail: { fontSize: 13, lineHeight: 21, color: "#6D7788" },
  reviewNotice: {
    flexDirection: "row",
    gap: 10,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#EFF4FF",
    marginVertical: 7,
  },
  reviewNoticeText: { flex: 1, fontSize: 12, lineHeight: 20, color: "#536885" },
});
