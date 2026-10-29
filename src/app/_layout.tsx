import "../../global.css";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { verifyInstallation } from "nativewind";
import { useEffect } from "react";
import { clerkPublishableKey, isClerkConfigured } from "../lib/auth";

export default function RootLayout() {
  useEffect(() => {
    if (__DEV__) verifyInstallation();
  }, []);

  const screens = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#032e37" }, animation: "fade" }} />
  );

  if (!isClerkConfigured) return screens;

  return (
    <ClerkProvider publishableKey={clerkPublishableKey!} tokenCache={tokenCache}>
      {screens}
    </ClerkProvider>
  );
}
