import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { isClerkConfigured } from "../../lib/auth";
import { colors as c } from "../../components/travel/theme";

export default function TabLayout() {
  if (!isClerkConfigured) return <Redirect href="/sign-in" />;
  return <AuthenticatedTabs />;
}
function AuthenticatedTabs() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded)
    return (
      <View
        style={{ flex: 1, backgroundColor: c.bg, justifyContent: "center" }}
      >
        <ActivityIndicator color={c.teal} />
      </View>
    );
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  return (
    <>
      <StatusBar style="dark" />
      <NativeTabs
        backgroundColor={c.bg}
        tintColor={c.teal}
        iconColor={{ default: "#89938C", selected: c.teal }}
        labelStyle={{ fontSize: 11 }}
        indicatorColor={c.pale}
        disableTransparentOnScrollEdge
        labelVisibilityMode="labeled"
      >
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
          <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="assistant">
          <NativeTabs.Trigger.Icon sf="sparkles" md="chat_bubble_outline" />
          <NativeTabs.Trigger.Label>웨일로 챗</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="trips">
          <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
          <NativeTabs.Trigger.Label>내 여행</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
          <NativeTabs.Trigger.Label>프로필</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
