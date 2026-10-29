import TripCard from "../../components/travel/TripCard";
import { useTrips } from "../../hooks/useTrips";
import EarthFlight from "../../components/travel/EarthFlight";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { destinations } from "../../data/destinations";
import { Icon, Page, Section, s } from "../../components/travel/ui";
import { colors as c } from "../../components/travel/theme";

export default function HomeScreen() {
  const { user } = useUser();
  const tripState = useTrips();
  const router = useRouter();
  const name = user?.firstName ?? user?.fullName ?? "여행자";
  const open = (id: string) =>
    router.push({ pathname: "/destination", params: { id } });
  return (
    <Page>
      <View style={h.top}>
        <Text style={h.wordmark}>
          waylo<Text style={{ color: c.teal }}>.</Text>
        </Text>
        <View style={h.edition}>
          <View style={h.dot} />
          <Text style={h.editionText}>나만의 여행 동반자</Text>
        </View>
      </View>
      <View style={h.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={h.hello} numberOfLines={1}>
            {name}님, 안녕하세요
          </Text>
          <Text style={h.greeting}>다음 이야기는 어디에서?</Text>
        </View>
        <Pressable
          onPress={() => router.navigate("/profile")}
          accessibilityRole="button"
          accessibilityLabel="내 프로필 열기"
          style={h.avatar}
        >
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <Icon name="user" color={c.teal} />
          )}
        </Pressable>
      </View>
      <View style={h.hero}>
        <View pointerEvents="none" style={h.globeArt}>
          <EarthFlight />
        </View>
        <View style={h.heroTop}>
          <Icon name="compass" size={21} color="white" />
          <Text style={h.aiLabel}>AI 여행 플래너</Text>
        </View>
        <Text style={h.heroTitle}>다음 여행을{"\n"}계획해 보세요</Text>
        <Text style={h.heroBody}>
          어디로, 언제 떠나고 싶나요?{"\n"}나에게 꼭 맞는 여행을 함께 만들어요.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="AI 여행 계획 시작하기"
          onPress={() => router.navigate("/planner")}
          style={h.startButton}
        >
          <Text style={h.startText}>시작하기</Text>
          <Icon name="arrow-right" size={21} color="#234DB4" />
        </Pressable>
      </View>
      <Section
        title="나의 여행"
        action="모두 보기"
        onPress={() => router.navigate("/trips")}
      />
      {tripState.trips[0] ? (
        <TripCard
          key={tripState.trips[0].id}
          trip={tripState.trips[0]}
          onDeleted={() => void tripState.reload()}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="첫 여행 계획하기"
          onPress={() => router.navigate("/planner")}
          style={h.tripCard}
        >
          <View style={h.tripCover}>
            <Image
              source={destinations[0].image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={h.tripShade} />
            <View style={h.tripCaption}>
              <Text style={h.tripTitle}>나의 첫 여행을 시작해 보세요</Text>
              <Text style={h.tripSubtitle}>가고 싶었던 곳, 이제 계획으로</Text>
            </View>
          </View>
          <View style={h.tripFooter}>
            <View style={[s.inline, { flex: 1 }]}>
              <Icon name="briefcase" size={17} color="#667085" />
              <Text style={h.tripHint}>아직 저장된 여행이 없어요</Text>
            </View>
            <Text style={h.tripAction}>계획하기</Text>
            <Icon name="chevron-right" size={17} color="#2455BE" />
          </View>
        </Pressable>
      )}
      {!!tripState.error && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void tripState.reload()}
        >
          <Text style={[s.body, { fontSize: 11, marginTop: 10 }]}>
            여행을 불러오지 못했어요. 눌러서 다시 확인하기
          </Text>
        </Pressable>
      )}
      <Section title="인기 여행지" />
      <Text style={[s.body, { marginTop: -7, marginBottom: 17 }]}>
        다음 여행이 기대되는 곳들을 만나보세요.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -24 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: 14,
          paddingBottom: 4,
        }}
      >
        {destinations.slice(0, 3).map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            accessibilityLabel={`${d.name} 여행지 둘러보기`}
            onPress={() => open(d.id)}
            style={h.destination}
          >
            <Image
              source={d.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={h.destinationShade} />
            <View style={h.countryPill}>
              <Text style={h.countryText}>{d.country}</Text>
            </View>
            <View style={h.destinationInfo}>
              <Text style={h.destinationName}>{d.name}</Text>
              <Text style={h.destinationTag}>{d.tag}</Text>
            </View>
            <View style={h.roundArrow}>
              <Icon name="arrow-up-right" size={15} color="white" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => open("grand-canyon")}
        style={h.note}
      >
        <Icon name="sun" size={24} color={c.teal} />
        <View style={{ flex: 1 }}>
          <Text style={h.noteTitle}>조금 더 멀리, 조금 더 나답게</Text>
          <Text style={[s.body, { fontSize: 12 }]}>
            이번 여행은 대자연 속으로 떠나볼까요?
          </Text>
        </View>
        <Icon name="arrow-right" size={17} color={c.teal} />
      </Pressable>
      <Text style={h.bottomMark}>계획은 가볍게, 여행은 더 즐겁게.</Text>
    </Page>
  );
}
const h = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 27,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1.8,
    color: c.ink,
  },
  edition: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.teal },
  editionText: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: c.muted,
  },
  greetingRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  hello: { fontSize: 13, color: c.muted, marginBottom: 7 },
  greeting: {
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: c.ink,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: c.pale,
    borderWidth: 3,
    borderColor: "white",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderRadius: 26,
    overflow: "hidden",
    padding: 24,
    backgroundColor: "#2455BE",
  },
  heroTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 22,
  },
  aiLabel: { color: "white", fontSize: 16, fontWeight: "700" },
  heroTitle: {
    fontSize: 30,
    lineHeight: 41,
    color: "white",
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  heroBody: { fontSize: 14, lineHeight: 23, color: "#FFFFFF", marginTop: 12 },
  globeArt: {
    position: "absolute",
    right: 12,
    top: 35,
    width: 132,
    height: 150,
  },
  startButton: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    borderRadius: 40,
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 52,
  },
  startText: { fontSize: 17, fontWeight: "800", color: "#234DB4" },
  tripCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: c.line,
  },
  tripCover: { height: 170, backgroundColor: c.pale },
  tripShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10,24,34,0.5)",
  },
  tripCaption: { position: "absolute", left: 20, right: 20, bottom: 22 },
  tripTitle: {
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.6,
  },
  tripSubtitle: { fontSize: 12, color: "white", marginTop: 6 },
  tripFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 17,
    paddingVertical: 18,
  },
  tripHint: { fontSize: 11, color: "#667085" },
  tripAction: { fontSize: 12, fontWeight: "700", color: "#2455BE" },
  emptyTrip: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 22,
    padding: 18,
    backgroundColor: c.paper,
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  emptyIcon: {
    width: 46,
    height: 50,
    borderRadius: 15,
    backgroundColor: c.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 13, fontWeight: "700", color: c.ink },
  emptyBody: { fontSize: 11, color: c.muted, lineHeight: 17 },
  destination: {
    width: 172,
    height: 235,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: c.pale,
  },
  destinationShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8,28,30,0.15)",
  },
  countryPill: {
    alignSelf: "flex-start",
    margin: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  countryText: { fontSize: 9, color: c.ink, fontWeight: "600" },
  destinationInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 17,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: "rgba(5,20,30,0.72)",
  },
  destinationName: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.9,
    textShadowColor: "#183A36",
    textShadowRadius: 14,
  },
  destinationTag: {
    fontSize: 10,
    color: "#fff",
    marginTop: 6,
    textShadowColor: "#183A36",
    textShadowRadius: 10,
  },
  roundArrow: {
    position: "absolute",
    right: 13,
    top: 14,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "rgba(20,43,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginTop: 26,
    padding: 18,
    borderRadius: 19,
    backgroundColor: c.pale,
  },
  noteTitle: { fontSize: 13, fontWeight: "700", color: c.ink, marginBottom: 4 },
  bottomMark: {
    textAlign: "center",
    fontSize: 8,
    letterSpacing: 2,
    color: "#95A097",
    marginTop: 27,
  },
});
