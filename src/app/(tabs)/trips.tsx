import { useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import TripCard from "../../components/travel/TripCard";
import { Button, Icon, Page, s } from "../../components/travel/ui";
import { useTrips } from "../../hooks/useTrips";
import { colors as c } from "../../components/travel/theme";

export default function TripsScreen() {
  const router = useRouter();
  const { trips, loading, error, reload } = useTrips();
  return (
    <Page>
      <Text style={s.eyebrow}>설렘이 쌓이는 곳</Text>
      <Text style={s.title}>나의 여행</Text>
      <Text style={[s.body, { marginTop: 10, marginBottom: 23 }]}>
        설레는 계획부터 완성된 일정까지.
      </Text>
      {loading && <ActivityIndicator color={c.teal} />}
      {!!error && (
        <View style={{ gap: 12, marginBottom: 20 }}>
          <Text accessibilityRole="alert" style={s.body}>
            {error}
          </Text>
          <Button title="다시 불러오기" onPress={() => void reload()} />
        </View>
      )}
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onDeleted={() => void reload()} />
      ))}
      {!loading && !error && !trips.length && (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Icon name="map" size={26} color={c.teal} />
          </View>
          <Text style={[s.sectionTitle, { fontSize: 19 }]}>
            어떤 이야기를 시작할까요?
          </Text>
          <Text style={[s.body, { textAlign: "center" }]}>
            아직 저장된 여행이 없어요.{"\n"}첫 여행의 목적지를 골라보세요.
          </Text>
        </View>
      )}
      <View style={{ marginTop: 20 }}>
        <Button
          title="새 여행 계획하기"
          onPress={() => router.navigate("/planner")}
        />
      </View>
    </Page>
  );
}
