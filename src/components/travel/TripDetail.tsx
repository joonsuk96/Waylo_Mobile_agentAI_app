import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { totalBudget, type Trip } from "../../lib/trip-contract";
import {
  dayColor,
  googleMapsUrl,
  tripPlaces,
  type TripPlace,
} from "../../lib/trip-places";
import { PhotoCredit } from "./PhotoCredit";
import { Icon } from "./ui";

const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
export default function TripDetail({ trip }: { trip: Trip }) {
  const itinerary = trip.itinerary!;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const positions = useRef<Record<number, number>>({});
  const [darkStatus, setDarkStatus] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([
    itinerary.days[0]?.day ?? 1,
  ]);
  const [linkError, setLinkError] = useState("");
  const places = useMemo(() => tripPlaces(itinerary), [itinerary]);
  const total = totalBudget(itinerary);
  const heroHeight = 330 + insets.top;
  const costs: [string, number, string][] = [
    ["숙박", itinerary.budgetBreakdown.accommodation, "#2455BE"],
    ["식비", itinerary.budgetBreakdown.food, "#159881"],
    ["교통", itinerary.budgetBreakdown.transport, "#8B65D5"],
    ["관광·액티비티", itinerary.budgetBreakdown.activities, "#D68628"],
    ["기타", itinerary.budgetBreakdown.other, "#D35B83"],
  ];
  function openGoogle(place?: TripPlace) {
    setLinkError("");
    void Linking.openURL(googleMapsUrl(place, trip.input.destination)).catch(
      () =>
        setLinkError("지도를 열지 못했어요. 네트워크 상태를 확인해 주세요."),
    );
  }
  function openHotel(name: string, area: string, map: boolean) {
    const query = [
      trip.input.destination,
      area,
      name,
      ...(map
        ? []
        : ["숙소 예약 가격", trip.input.startDate, trip.input.endDate]),
    ]
      .filter(Boolean)
      .join(" ");
    const url = map
      ? "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(query)
      : "https://www.google.com/search?q=" + encodeURIComponent(query);
    void Linking.openURL(url).catch(() =>
      Alert.alert(
        "링크를 열지 못했어요",
        "네트워크 상태와 브라우저를 확인해 주세요.",
      ),
    );
  }
  function showDay(day: number) {
    setExpanded((current) =>
      current.includes(day) ? current : [...current, day],
    );
    requestAnimationFrame(() =>
      scroll.current?.scrollTo({
        y: Math.max(0, (positions.current[day] ?? 0) - insets.top - 14),
        animated: true,
      }),
    );
  }
  function toggleDay(day: number) {
    setExpanded((current) =>
      current.includes(day)
        ? current.filter((x) => x !== day)
        : [...current, day],
    );
  }
  return (
    <View style={st.screen}>
      <StatusBar style={darkStatus ? "dark" : "light"} />
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const next =
            event.nativeEvent.contentOffset.y > heroHeight - insets.top - 35;
          setDarkStatus((old) => (old === next ? old : next));
        }}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 20,
        }}
      >
        <View style={[st.hero, { height: heroHeight }]}>
          <Image
            source={
              trip.cover?.url
                ? { uri: trip.cover.url }
                : require("../../../assets/images/grand-canyon-splash.png")
            }
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={st.heroShade} />
          <View style={[st.heroNav, { top: insets.top + 12 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="내 여행으로 돌아가기"
              onPress={() => router.replace("/trips")}
              style={st.navButton}
            >
              <Icon name="chevron-left" size={24} color="#15243B" />
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="여행지를 Google 지도에서 열기"
              onPress={() => openGoogle()}
              style={st.navButton}
            >
              <Icon name="external-link" size={20} color="#15243B" />
            </Pressable>
          </View>
          <View style={st.heroCaption}>
            <View style={st.destinationTag}>
              <Icon name="map-pin" size={12} color="white" />
              <Text style={st.destinationText}>{trip.input.destination}</Text>
            </View>
            <Text
              accessibilityRole="header"
              numberOfLines={3}
              style={st.heroTitle}
            >
              {itinerary.title}
            </Text>
            <Text style={st.heroDates}>
              {trip.input.startDate.replaceAll("-", ".")} —{" "}
              {trip.input.endDate.replaceAll("-", ".")}
            </Text>
            <PhotoCredit cover={trip.cover} onDark />
          </View>
        </View>
        <View style={st.body}>
          <View style={st.stats}>
            <Stat
              icon="calendar"
              value={`${trip.num_days}일`}
              label="여행 기간"
            />
            <Stat
              icon="users"
              value={`${trip.input.numTravelers}명`}
              label="여행 인원"
            />
            <Stat
              icon="credit-card"
              value={won(total / trip.input.numTravelers)}
              label="1인 예상 예산"
            />
          </View>
          <Text style={st.summary}>{itinerary.summary}</Text>
          <View style={st.sectionRow}>
            <View>
              <Text accessibilityRole="header" style={st.sectionTitle}>
                여행 한눈에 보기
              </Text>
              <Text style={st.sectionSub}>
                하루의 흐름을 보고, 자세한 일정으로 이동해요
              </Text>
            </View>
          </View>
          <View style={st.overview}>
            {itinerary.days.map((day) => (
              <Pressable
                key={day.day}
                accessibilityRole="button"
                accessibilityLabel={day.day + "일차 상세 일정 보기"}
                onPress={() => showDay(day.day)}
                style={st.overviewDay}
              >
                <View
                  style={[st.dayNumber, { backgroundColor: dayColor(day.day) }]}
                >
                  <Text style={st.dayNumberText}>{day.day}</Text>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={st.dayTitle}>{day.title}</Text>
                  <Text style={st.overviewRoute}>
                    {day.activities
                      .map((a) => a.location || a.name)
                      .join(" → ")}
                  </Text>
                  <Text style={st.smallText}>
                    {day.date} · {day.activities.length}개 일정
                  </Text>
                </View>
                <Icon name="chevron-down" size={17} color="#8595A8" />
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => openGoogle()}
            style={st.overviewMap}
          >
            <Icon name="map-pin" size={14} color="#2455BE" />
            <Text style={st.blueLink}>Google 지도에서 여행지 보기</Text>
            <Icon name="external-link" size={13} color="#2455BE" />
          </Pressable>
          {!!linkError && (
            <Text accessibilityRole="alert" style={st.linkError}>
              {linkError}
            </Text>
          )}
          <View style={st.sectionRow}>
            <View>
              <Text accessibilityRole="header" style={st.sectionTitle}>
                여행 일정
              </Text>
              <Text style={st.sectionSub}>
                하루하루, 나만의 여행을 따라가요
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() =>
                setExpanded(
                  expanded.length === itinerary.days.length
                    ? []
                    : itinerary.days.map((d) => d.day),
                )
              }
            >
              <Text style={st.blueLink}>
                {expanded.length === itinerary.days.length
                  ? "모두 접기"
                  : "모두 펼치기"}
              </Text>
            </Pressable>
          </View>
          {itinerary.days.map((day) => {
            const open = expanded.includes(day.day),
              items = places.filter((p) => p.day === day.day);
            return (
              <View
                key={day.day}
                onLayout={(event) => {
                  positions.current[day.day] =
                    event.nativeEvent.layout.y + heroHeight;
                }}
                style={st.dayCard}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${day.day}일차 ${day.title}`}
                  onPress={() => toggleDay(day.day)}
                  style={st.dayHeader}
                >
                  <View
                    style={[
                      st.dayNumber,
                      { backgroundColor: dayColor(day.day) },
                    ]}
                  >
                    <Text style={st.dayNumberText}>{day.day}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={st.dayTitle}>{day.title}</Text>
                    <Text style={st.smallText}>
                      {day.date} · {day.activities.length}개 일정
                    </Text>
                  </View>
                  <Icon
                    name={open ? "chevron-up" : "chevron-down"}
                    size={19}
                    color="#6D7C91"
                  />
                </Pressable>
                {open && (
                  <View style={st.activities}>
                    {items.map((place) => (
                      <View key={place.number} style={[st.activity]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${place.name} Google 지도에서 보기`}
                          onPress={() => openGoogle(place)}
                          style={[
                            st.smallNumber,
                            { backgroundColor: dayColor(place.day) },
                          ]}
                        >
                          <Text style={st.numberText}>{place.day}</Text>
                        </Pressable>
                        <View style={{ flex: 1, gap: 8 }}>
                          <Text style={st.time}>{place.time}</Text>
                          <Text style={st.activityTitle}>{place.name}</Text>
                          <Text style={st.activityBody}>
                            {place.description}
                          </Text>
                          <Pressable
                            accessibilityRole="link"
                            onPress={() => openGoogle(place)}
                            style={st.location}
                          >
                            <Icon name="map-pin" size={12} color="#738399" />
                            <Text style={st.locationText}>
                              {place.location}
                            </Text>
                            <Icon
                              name="external-link"
                              size={11}
                              color="#738399"
                            />
                          </Pressable>
                          <Text style={st.activityCost}>
                            예상 {won(place.estimatedCostKrw)} · 전체 인원
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          <View style={st.sectionRow}>
            <View>
              <Text accessibilityRole="header" style={st.sectionTitle}>
                예상 여행 예산
              </Text>
              <Text style={st.sectionSub}>
                우리 여행에 필요한 비용을 한눈에
              </Text>
            </View>
          </View>
          <View style={st.budgetCard}>
            <Text style={st.budgetOverline}>
              전체 {trip.input.numTravelers}명 · {trip.num_days}일 기준
            </Text>
            <Text style={st.budgetTotal}>{won(total)}</Text>
            <View style={st.budgetStack}>
              {costs.map(([label, amount, color]) => (
                <View
                  key={label}
                  style={{
                    width: `${total ? (amount / total) * 100 : 0}%`,
                    backgroundColor: color,
                    height: 7,
                  }}
                />
              ))}
            </View>
            {costs.map(([label, amount, color]) => (
              <View key={label} style={st.costRow}>
                <View style={[st.dot, { backgroundColor: color }]} />
                <Text style={st.costLabel}>{label}</Text>
                <Text style={st.costValue}>{won(amount)}</Text>
              </View>
            ))}
            <Text style={st.budgetNote}>
              1인 약 {won(total / trip.input.numTravelers)} · 항공권 제외{"\n"}
              실시간 가격이 아닌 AI의 추정 비용이에요.
            </Text>
          </View>
          {itinerary.hotels.length > 0 && (
            <>
              <Text
                style={[st.sectionTitle, { marginTop: 30, marginBottom: 15 }]}
              >
                추천 숙소 · 숙박 지역
              </Text>
              {itinerary.hotels.map((hotel, index) => (
                <View key={index} style={st.hotel}>
                  <View style={st.hotelIcon}>
                    <Icon name="home" size={20} color="#2455BE" />
                  </View>
                  <View style={{ flex: 1, gap: 7 }}>
                    <Text style={st.activityTitle}>{hotel.name}</Text>
                    <Text style={st.smallText}>{hotel.area}</Text>
                    <Text style={st.activityBody}>{hotel.description}</Text>
                    <Text style={st.blueLink}>
                      1박 전체 인원 약 {won(hotel.estimatedNightlyKrw)}
                    </Text>
                    <View style={st.hotelLinks}>
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={hotel.name + " 지도에서 찾기"}
                        onPress={() => openHotel(hotel.name, hotel.area, true)}
                        style={st.hotelLink}
                      >
                        <Icon name="map-pin" size={13} color="#2455BE" />
                        <Text style={st.hotelLinkText}>지도에서 찾기</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={hotel.name + " 예약 가격 검색"}
                        onPress={() => openHotel(hotel.name, hotel.area, false)}
                        style={st.hotelLink}
                      >
                        <Icon name="external-link" size={13} color="#2455BE" />
                        <Text style={st.hotelLinkText}>예약·가격 검색</Text>
                      </Pressable>
                    </View>
                    <Text style={st.smallText}>
                      검색 결과에서 실제 숙소와 날짜별 요금을 확인해 주세요.
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
          <View style={st.tips}>
            <Text style={st.tipTitle}>떠나기 전에 확인하세요</Text>
            {itinerary.tips.map((tip, index) => (
              <Text key={index} style={st.activityBody}>
                • {tip}
              </Text>
            ))}
            <Text style={st.mapNote}>
              방문 전 영업시간·가격·이동 경로를 직접 확인해 주세요.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
function Stat({
  icon,
  value,
  label,
}: {
  icon: "calendar" | "users" | "credit-card";
  value: string;
  label: string;
}) {
  return (
    <View style={st.stat}>
      <View style={st.statIcon}>
        <Icon name={icon} size={21} color="#2455BE" />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        style={st.statValue}
      >
        {value}
      </Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  overview: {
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#E4ECF6",
    backgroundColor: "#F8FAFE",
    overflow: "hidden",
  },
  overviewDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4ECF6",
  },
  overviewRoute: { fontSize: 12, lineHeight: 21, color: "#60738C" },
  overviewMap: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 15,
  },
  screen: { flex: 1, backgroundColor: "white" },
  hero: {
    backgroundColor: "#173D61",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,17,32,0.47)",
  },
  heroNav: {
    position: "absolute",
    left: 22,
    right: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navButton: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCaption: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 25,
    gap: 10,
  },
  destinationTag: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.18)",
  },
  destinationText: { fontSize: 11, color: "white", fontWeight: "600" },
  heroTitle: {
    color: "white",
    fontSize: 29,
    lineHeight: 39,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  heroDates: { fontSize: 11, color: "#E2EBF6" },
  body: {
    paddingHorizontal: 22,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
  },
  stat: { width: "32%", alignItems: "center", gap: 9 },
  statIcon: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: "#EFF5FE",
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    color: "#17263B",
    fontSize: 19,
    fontWeight: "800",
    width: "100%",
    textAlign: "center",
  },
  statLabel: { color: "#8B96A6", fontSize: 11 },
  summary: { fontSize: 13, lineHeight: 23, color: "#788699", marginTop: 20 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 29,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#17263B",
    letterSpacing: -0.5,
  },
  sectionSub: { fontSize: 11, color: "#929DAC", marginTop: 7, lineHeight: 17 },
  countBadge: {
    backgroundColor: "#EFF5FE",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  countText: { fontSize: 11, fontWeight: "600", color: "#2455BE" },
  filters: { gap: 8, paddingBottom: 14 },
  filter: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5EBF3",
  },
  filterActive: { backgroundColor: "#2455BE", borderColor: "#2455BE" },
  filterText: { fontSize: 11, color: "#7A8799", fontWeight: "600" },
  filterTextActive: { color: "white" },
  mapNote: { fontSize: 10, lineHeight: 17, color: "#8D99A8", marginTop: 11 },
  selectedCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#DCE7FA",
    backgroundColor: "#F7FAFF",
    borderRadius: 17,
    marginTop: 12,
  },
  selectedTitle: { fontSize: 13, fontWeight: "700", color: "#17263B" },
  seeItinerary: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingVertical: 10,
  },
  blueLink: { fontSize: 11, fontWeight: "600", color: "#2455BE" },
  smallText: { fontSize: 10, color: "#8B97A8", lineHeight: 17 },
  dayCard: {
    borderWidth: 1,
    borderColor: "#E5EBF3",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F1F6FF",
  },
  dayNumber: {
    height: 35,
    width: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberText: { color: "white", fontWeight: "800", fontSize: 15 },
  dayTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#17263B",
    lineHeight: 21,
  },
  activities: { padding: 13 },
  activity: {
    flexDirection: "row",
    gap: 12,
    padding: 11,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 4,
  },
  activitySelected: { backgroundColor: "#EFF5FE" },
  smallNumber: {
    height: 29,
    minWidth: 29,
    paddingHorizontal: 5,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: { color: "white", fontWeight: "700", fontSize: 12 },
  time: { fontSize: 10, color: "#2455BE", fontWeight: "700" },
  activityTitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#17263B",
    fontWeight: "700",
  },
  activityBody: { fontSize: 12, lineHeight: 21, color: "#7A8799" },
  location: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  locationText: {
    fontSize: 10,
    color: "#738399",
    flexShrink: 1,
    lineHeight: 17,
  },
  activityCost: { fontSize: 10, color: "#2455BE" },
  budgetCard: { padding: 23, borderRadius: 24, backgroundColor: "#F1F6FF" },
  budgetOverline: { fontSize: 11, color: "#75849A" },
  budgetTotal: {
    fontSize: 30,
    color: "#2455BE",
    fontWeight: "800",
    marginTop: 8,
  },
  budgetStack: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    marginVertical: 22,
  },
  costRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  dot: { height: 7, width: 7, borderRadius: 4 },
  costLabel: { fontSize: 12, color: "#7A8799", flex: 1 },
  costValue: { fontSize: 13, fontWeight: "600", color: "#17263B" },
  budgetNote: { fontSize: 10, color: "#7E8DA1", lineHeight: 18, marginTop: 15 },
  hotelLinks: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 3 },
  hotelLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#EFF5FE",
  },
  hotelLinkText: { color: "#2455BE", fontSize: 11, fontWeight: "600" },
  hotel: {
    flexDirection: "row",
    gap: 13,
    padding: 18,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E5EBF3",
    marginBottom: 12,
  },
  hotelIcon: {
    height: 40,
    width: 40,
    borderRadius: 13,
    backgroundColor: "#EFF5FE",
    justifyContent: "center",
    alignItems: "center",
  },
  tips: {
    padding: 21,
    borderRadius: 22,
    backgroundColor: "#F7F9FC",
    gap: 10,
    marginTop: 25,
  },
  tipTitle: { fontSize: 14, fontWeight: "700", color: "#17263B" },
  linkError: { fontSize: 11, color: "#B54708", marginTop: 10 },
});
