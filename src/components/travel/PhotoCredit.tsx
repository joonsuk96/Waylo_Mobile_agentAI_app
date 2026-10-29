import { Linking, Pressable, Text, View } from "react-native";
import type { Cover } from "../../lib/trip-contract";
export function PhotoCredit({
  cover,
  onDark = false,
}: {
  cover: Cover | null;
  onDark?: boolean;
}) {
  if (!cover || cover.provider !== "unsplash") return null;
  const open = (url: string | null) => {
    if (url && url.startsWith("https://unsplash.com/"))
      void Linking.openURL(url).catch(() => {});
  };
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: onDark ? 0 : 16,
        paddingBottom: onDark ? 0 : 12,
      }}
    >
      <Text style={{ fontSize: 9, color: onDark ? "#DCE7F6" : "#7D8794" }}>
        사진:
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => open(cover.photographerUrl)}
        hitSlop={5}
      >
        <Text style={{ fontSize: 9, color: onDark ? "white" : "#2455BE" }}>
          {cover.photographer}
        </Text>
      </Pressable>
      <Text style={{ fontSize: 9, color: onDark ? "#DCE7F6" : "#7D8794" }}>
        {" "}
        /{" "}
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => open(cover.photoUrl)}
        hitSlop={5}
      >
        <Text style={{ fontSize: 9, color: onDark ? "white" : "#2455BE" }}>
          Unsplash
        </Text>
      </Pressable>
    </View>
  );
}
