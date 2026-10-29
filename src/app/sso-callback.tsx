import { Redirect } from "expo-router";

// The open browser session completes the SSO flow; the auth screen checks session state.
export default function SSOCallback() {
  return <Redirect href="/sign-in" />;
}
