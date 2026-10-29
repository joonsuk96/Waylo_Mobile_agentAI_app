import { useAuth } from "@clerk/expo";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/travel/ui";
import { apiRequest } from "../../lib/api";
type Message = { role: "user" | "assistant"; content: string };
function Bot({ small = false }: { small?: boolean }) {
  return (
    <View
      style={[st.bot, small && { width: 30, height: 30, borderRadius: 12 }]}
    >
      <View style={st.antenna} />
      <View style={st.face}>
        <View style={st.eye} />
        <View style={st.eye} />
      </View>
      <View style={st.smile} />
    </View>
  );
}
export default function AssistantScreen() {
  const { userId } = useAuth();
  return <Chat key={userId ?? "signed-out"} />;
}
function Chat() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null),
    controller = useRef<AbortController | null>(null),
    inFlight = useRef(false),
    version = useRef(0);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  async function send(text = draft) {
    const content = text.trim();
    if (!content || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setDraft("");
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    const current = version.current;
    const request = new AbortController();
    controller.current = request;
    try {
      const result = await apiRequest<{ reply: string }>(
        "/api/chat",
        await getToken(),
        {
          method: "POST",
          body: JSON.stringify({
            messages: next
              .slice(-9)
              .map((m) => ({ ...m, content: m.content.slice(0, 1600) })),
          }),
          signal: request.signal,
        },
      );
      if (current === version.current && !request.signal.aborted)
        setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (e) {
      if (current === version.current && !request.signal.aborted) {
        setMessages(next.slice(0, -1));
        setDraft(content);
        setError(e instanceof Error ? e.message : "답변을 받지 못했어요.");
      }
    } finally {
      if (current === version.current && !request.signal.aborted) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  }
  function clear() {
    Alert.alert(
      "대화를 지울까요?",
      "이 화면의 대화 내용을 모두 지우고 새로 시작해요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            version.current++;
            controller.current?.abort();
            inFlight.current = false;
            setMessages([]);
            setDraft("");
            setBusy(false);
            setError("");
          },
        },
      ],
    );
  }
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={st.page}>
      <View style={st.header}>
        <Bot />
        <View style={{ flex: 1 }}>
          <Text style={st.title}>AI 웨일로 챗</Text>
          <Text style={st.subtitle}>당신의 여행에, 작은 도움 하나</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="대화 모두 삭제"
          onPress={clear}
          style={st.clear}
        >
          <Icon name="trash-2" size={20} color="#6D7D91" />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={st.list}
          onContentSizeChange={() =>
            scroll.current?.scrollToEnd({ animated: true })
          }
        >
          <View style={st.welcome}>
            <Text style={st.welcomeTitle}>어디로 떠나고 싶나요?</Text>
            <Text style={st.body}>
              안녕하세요! 여행 친구 웨일로예요. 가고 싶은 곳, 챙길 짐, 맛있는
              음식까지 편하게 물어보세요.
            </Text>
          </View>
          {messages.length === 0 && (
            <View style={st.suggestions}>
              {[
                "가을에 가기 좋은 국내 여행지 추천해줘",
                "도쿄 여행 준비물 알려줘",
                "부산에서 꼭 먹어야 할 음식은?",
              ].map((q) => (
                <Pressable
                  key={q}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void send(q)}
                  style={st.suggestion}
                >
                  <Text style={st.suggestionText}>{q}</Text>
                  <Icon name="arrow-up-right" size={15} color="#377BC5" />
                </Pressable>
              ))}
            </View>
          )}
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                st.row,
                m.role === "user" && { justifyContent: "flex-end" },
              ]}
            >
              {m.role === "assistant" && <Bot small />}
              <View style={[st.bubble, m.role === "user" && st.userBubble]}>
                <Text
                  selectable
                  style={[st.message, m.role === "user" && { color: "white" }]}
                >
                  {m.content}
                </Text>
              </View>
            </View>
          ))}
          {busy && (
            <View style={st.row}>
              <Bot small />
              <View
                style={[
                  st.bubble,
                  { flexDirection: "row", gap: 10, alignItems: "center" },
                ]}
              >
                <ActivityIndicator size="small" color="#2F81DD" />
                <Text style={st.hint}>답변을 생각하고 있어요…</Text>
              </View>
            </View>
          )}
        </ScrollView>
        {!!error && (
          <Text accessibilityRole="alert" style={st.error}>
            {error} 입력창에서 다시 보낼 수 있어요.
          </Text>
        )}
        <View style={st.composer}>
          <TextInput
            accessibilityLabel="여행 질문 입력"
            value={draft}
            onChangeText={setDraft}
            placeholder="여행에 대해 무엇이든 물어보세요"
            placeholderTextColor="#A0AAB7"
            multiline
            maxLength={1600}
            style={st.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="메시지 보내기"
            accessibilityState={{ disabled: busy || !draft.trim() }}
            disabled={busy || !draft.trim()}
            onPress={() => void send()}
            style={[
              st.send,
              (busy || !draft.trim()) && { backgroundColor: "#DCE4EE" },
            ]}
          >
            <Icon name="arrow-up" size={22} color="white" />
          </Pressable>
        </View>
        <Text style={st.footnote}>
          AI 답변은 참고용이에요 · 대화는 앱 종료 시 초기화돼요
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FAFBFD" },
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EEF5",
    backgroundColor: "white",
  },
  title: { fontSize: 23, fontWeight: "800", color: "#193247" },
  subtitle: { fontSize: 11, color: "#8291A1", marginTop: 4 },
  clear: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  bot: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#308DE9",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  antenna: { width: 4, height: 5, borderRadius: 2, backgroundColor: "#C7EFFF" },
  face: {
    width: "65%",
    height: "36%",
    borderRadius: 6,
    backgroundColor: "#173C68",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    borderWidth: 2,
    borderColor: "#E4F6FF",
  },
  eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#A0F1FC" },
  smile: { width: 9, height: 2, borderRadius: 1, backgroundColor: "#C7EFFF" },
  list: { padding: 20, gap: 17, paddingBottom: 24 },
  welcome: {
    padding: 21,
    backgroundColor: "#EBF4FF",
    borderRadius: 22,
    borderTopLeftRadius: 5,
  },
  welcomeTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#235788",
    marginBottom: 10,
  },
  body: { fontSize: 14, lineHeight: 23, color: "#4A6B8A" },
  suggestions: { gap: 9, marginBottom: 12 },
  suggestion: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBE8F8",
    borderRadius: 14,
    backgroundColor: "white",
  },
  suggestionText: { fontSize: 12, color: "#51708D" },
  row: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bubble: {
    maxWidth: "85%",
    backgroundColor: "#EFF2F7",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 20,
    borderTopLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: "#2F81DD",
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 5,
  },
  message: { fontSize: 14, lineHeight: 23, color: "#263D52" },
  hint: { fontSize: 12, color: "#6C849B" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E9EEF5",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    minHeight: 47,
    maxHeight: 130,
    backgroundColor: "#F0F3F8",
    borderRadius: 23,
    paddingHorizontal: 17,
    paddingVertical: 12,
    fontSize: 13,
    color: "#263D52",
  },
  send: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#2F81DD",
    alignItems: "center",
    justifyContent: "center",
  },
  footnote: {
    fontSize: 9,
    color: "#A0ACB9",
    textAlign: "center",
    paddingVertical: 9,
    backgroundColor: "white",
  },
  error: { color: "#AE633B", fontSize: 11, lineHeight: 17, padding: 12 },
});
