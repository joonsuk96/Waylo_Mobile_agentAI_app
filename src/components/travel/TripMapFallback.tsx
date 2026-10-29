import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./ui";
export default function TripMapFallback({
  onOpenGoogle,
  empty = false,
}: {
  onOpenGoogle: () => void;
  empty?: boolean;
}) {
  return (
    <View style={st.frame}>
      <View style={st.circle}>
        <Icon name="map" size={34} color="#2455BE" />
      </View>
      <Text style={st.title}>
        {empty ? "표시할 위치 정보가 없어요" : "여행 지도를 준비하고 있어요"}
      </Text>
      <Text style={st.body}>
        {empty
          ? "아래 일정에서 장소를 선택해 검색할 수 있어요."
          : "Google 지도에서 여행지를 먼저 둘러볼 수 있어요."}
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={onOpenGoogle}
        style={st.button}
      >
        <Text style={st.buttonText}>Google 지도에서 열기</Text>
        <Icon name="external-link" size={15} color="#2455BE" />
      </Pressable>
    </View>
  );
}
const st = StyleSheet.create({
  frame: {
    height: 265,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E1EAF5",
    backgroundColor: "#F1F6FC",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 12,
  },
  circle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#19283D" },
  body: { fontSize: 12, lineHeight: 20, color: "#7A8799", textAlign: "center" },
  button: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 22,
    backgroundColor: "white",
  },
  buttonText: { fontSize: 12, fontWeight: "600", color: "#2455BE" },
});
