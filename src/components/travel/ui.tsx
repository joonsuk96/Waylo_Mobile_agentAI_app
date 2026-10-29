import Feather from "@expo/vector-icons/Feather";
import { ComponentProps, PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors as c } from "./theme";

export function Icon({
  name,
  size = 20,
  color = c.ink,
}: {
  name: ComponentProps<typeof Feather>["name"];
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function Page({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={s.page} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  light = false,
}: {
  title: string;
  onPress: () => void;
  light?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[s.button, light && s.light]}
    >
      <Text style={[s.buttonText, light && { color: c.ink }]}>{title}</Text>
      <Icon name="arrow-up-right" color={light ? c.ink : "white"} size={19} />
    </Pressable>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.section}>
      <Text accessibilityRole="header" style={s.sectionTitle}>
        {title}
      </Text>
      {action && (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onPress}
          style={s.inline}
        >
          <Text style={s.action}>{action}</Text>
          <Icon name="arrow-right" size={15} color={c.teal} />
        </Pressable>
      )}
    </View>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.bg },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  button: {
    backgroundColor: c.teal,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 15 },
  light: { backgroundColor: c.lime },
  inline: { flexDirection: "row", alignItems: "center", gap: 7 },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: c.ink,
    letterSpacing: -0.7,
  },
  action: { color: c.teal, fontSize: 13, fontWeight: "600" },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    color: c.teal,
    fontWeight: "700",
    marginBottom: 10,
  },
  title: {
    fontSize: 29,
    lineHeight: 39,
    fontWeight: "700",
    color: c.ink,
    letterSpacing: -1,
  },
  body: { fontSize: 14, lineHeight: 23, color: c.muted },
  empty: {
    backgroundColor: c.paper,
    borderColor: c.line,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  emptyIcon: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: c.pale,
    alignItems: "center",
    justifyContent: "center",
  },
});
