import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { destinations } from "../data/destinations";
import { Button, Icon, Page, s } from "../components/travel/ui";
import { colors as c } from "../components/travel/theme";
import { isClerkConfigured } from "../lib/auth";

export default function DestinationScreen() {
  if (!isClerkConfigured) return <Redirect href="/sign-in" />;
  return <ConnectedDestination />;
}
function ConnectedDestination() {
  const { isLoaded, isSignedIn } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  if (!isLoaded)
    return <ActivityIndicator style={{ flex: 1 }} color={c.teal} />;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  const d = destinations.find((x) => x.id === id);
  if (!d)
    return (
      <Page>
        <Text style={s.title}>여행지를 찾지 못했어요.</Text>
        <Button title="홈으로" onPress={() => router.replace("/home")} />
      </Page>
    );
  return (
    <Page>
      <Pressable
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/home")
        }
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
        style={{
          width: 44,
          height: 44,
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon name="arrow-left" size={24} />
      </Pressable>
      <View
        style={{
          height: 300,
          borderRadius: 28,
          overflow: "hidden",
          marginBottom: 25,
        }}
      >
        <Image
          source={d.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
      <Text style={s.eyebrow}>{d.english}</Text>
      <Text style={s.title}>{d.name}</Text>
      <Text style={[s.body, { marginTop: 14 }]}>{d.description}</Text>
      <View style={{ flexDirection: "row", gap: 20, marginVertical: 24 }}>
        <Text style={{ color: c.teal, fontSize: 13 }}>추천 기간 {d.days}</Text>
        <Text style={{ color: c.teal, fontSize: 13 }}>
          추천 시기 {d.season}
        </Text>
      </View>
      <Text style={s.sectionTitle}>이런 순간을 만나보세요</Text>
      {d.spots.map((spot, i) => (
        <View
          key={spot}
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: c.line,
          }}
        >
          <Text style={{ color: c.teal, fontSize: 12, fontWeight: "700" }}>
            0{i + 1}
          </Text>
          <Text style={{ color: c.ink, fontSize: 14, flex: 1 }}>{spot}</Text>
        </View>
      ))}
      <View style={{ marginTop: 28 }}>
        <Button
          title="이 여행지로 계획하기"
          onPress={() =>
            router.navigate({
              pathname: "/planner",
              params: { destination: d.name },
            })
          }
        />
      </View>
      <Text
        style={[s.body, { fontSize: 10, textAlign: "center", marginTop: 16 }]}
      >
        {d.credit} · 추천 시기와 기간은 여행 참고 정보예요.
      </Text>
    </Page>
  );
}
