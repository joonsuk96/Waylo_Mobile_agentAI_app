import { useAuth, useSSO } from "@clerk/expo";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import WelcomeScreen from "../components/WelcomeScreen";
import { isClerkConfigured } from "../lib/auth";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  if (!isClerkConfigured) return <WelcomeScreen configured={false} />;
  return <ConnectedSignIn />;
}

function ConnectedSignIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync().catch(() => {});
    return () => { void WebBrowser.coolDownAsync().catch(() => {}); };
  }, []);

  if (isSignedIn) return <Redirect href="/home" />;

  async function signInWithGoogle() {
    if (!isLoaded || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const AuthSession = await import("expo-auth-session");
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "appprac", path: "sso-callback" }),
      });
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
      } else if (result.authSessionResult?.type !== "cancel" && result.authSessionResult?.type !== "dismiss") {
        setError("추가 인증이 필요하거나 로그인이 완료되지 않았어요. 다시 시도해 주세요.");
      }
    } catch {
      setError("Google 로그인에 연결하지 못했어요. 네트워크와 Clerk의 Google 로그인 설정을 확인해 주세요.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <WelcomeScreen configured onGooglePress={signInWithGoogle} busy={!isLoaded || busy} error={error} />;
}
