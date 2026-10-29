import Constants from "expo-constants";
import { Platform } from "react-native";

export function apiOrigin() {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (Platform.OS === "web") return "";
  const host = Constants.expoConfig?.hostUri;
  if (!host)
    throw Error("API 서버 주소가 없어요. EXPO_PUBLIC_API_URL을 설정해 주세요.");
  const origin = new URL(host.includes("://") ? host : `http://${host}`);
  if (
    Platform.OS === "android" &&
    ["localhost", "127.0.0.1"].includes(origin.hostname)
  )
    origin.hostname = "10.0.2.2";
  return origin.origin;
}
export async function apiRequest<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  if (!token) throw Error("로그인 후 다시 시도해 주세요.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 25000);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  try {
    let response: Response;
    try {
      response = await fetch(apiOrigin() + path, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw Error(
        "서버에 연결하지 못했어요. Expo 서버와 네트워크를 확인해 주세요.",
      );
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw Error(data?.error ?? "요청을 처리하지 못했어요.");
    if (data === null)
      throw Error("서버 응답을 읽지 못했어요. 다시 시도해 주세요.");
    return data as T;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
