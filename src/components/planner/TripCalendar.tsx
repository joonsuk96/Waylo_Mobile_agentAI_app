import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { calendarDays, monthKey, shortDate } from "../../lib/calendar";
import { Icon } from "../travel/ui";

type Props = {
  today: string;
  start: string | null;
  end: string | null;
  onSelect: (day: string) => void;
};
export default function TripCalendar({ today, start, end, onSelect }: Props) {
  const [month, setMonth] = useState(() => {
    const [y, m] = (start ?? today).split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const days = calendarDays(month.year, month.month);
  const canGoBack =
    monthKey(month.year, month.month, 1) > today.slice(0, 7) + "-01";
  function move(amount: number) {
    const next = new Date(month.year, month.month + amount, 1);
    setMonth({ year: next.getFullYear(), month: next.getMonth() });
  }
  return (
    <View style={st.card}>
      <View style={st.selection}>
        <Icon name="calendar" color="#7A8494" size={19} />
        <Text style={[st.selectionText, start && { color: "#182638" }]}>
          {start
            ? `${shortDate(start)}${end ? ` — ${shortDate(end)}` : " — 돌아오는 날을 선택하세요"}`
            : "떠나는 날과 돌아오는 날을 선택하세요"}
        </Text>
      </View>
      <View style={st.month}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          accessibilityState={{ disabled: !canGoBack }}
          disabled={!canGoBack}
          onPress={() => move(-1)}
          style={st.monthButton}
        >
          <Icon name="chevron-left" color={canGoBack ? "#15233B" : "#C6CDD8"} />
        </Pressable>
        <Text accessibilityRole="header" style={st.monthTitle}>
          {month.year}년 {month.month + 1}월
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => move(1)}
          style={st.monthButton}
        >
          <Icon name="chevron-right" color="#15233B" />
        </Pressable>
      </View>
      <View style={st.grid}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <Text key={d} style={st.weekday}>
            {d}
          </Text>
        ))}
        {days.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={st.cell} />;
          const disabled = day < today;
          const first = day === start,
            last = day === end;
          const between = !!start && !!end && day > start && day < end;
          const isRange = !!start && !!end && start !== end;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`${day.replaceAll("-", " ")}${first ? ", 출발일" : last ? ", 도착일" : ""}`}
              accessibilityState={{
                disabled,
                selected: first || last || between,
              }}
              disabled={disabled}
              onPress={() => onSelect(day)}
              style={st.cell}
            >
              {isRange && (first || last || between) && (
                <View
                  style={[
                    st.band,
                    first && { left: "50%" },
                    last && { right: "50%" },
                  ]}
                />
              )}
              <View
                style={[
                  st.dayCircle,
                  first || last
                    ? st.selected
                    : day === today
                      ? st.today
                      : undefined,
                ]}
              >
                <Text
                  style={[
                    st.day,
                    disabled && st.disabled,
                    between && { color: "#2455BE" },
                    (first || last) && st.selectedText,
                  ]}
                >
                  {Number(day.slice(-2))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={st.helper}>
        {!start
          ? "출발일을 선택해 주세요."
          : !end
            ? "돌아오는 날을 선택해 주세요. 당일 여행도 가능해요."
            : "날짜를 다시 누르면 새로운 기간을 선택할 수 있어요."}
      </Text>
    </View>
  );
}
const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E7EBF0",
    borderRadius: 23,
    backgroundColor: "white",
    padding: 16,
  },
  selection: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    marginBottom: 21,
  },
  selectionText: { fontSize: 12, color: "#8992A3", flex: 1, lineHeight: 19 },
  month: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  monthTitle: { fontSize: 17, fontWeight: "700", color: "#172438" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  weekday: {
    width: "14.285714%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#9AA2AF",
    paddingBottom: 10,
  },
  cell: {
    width: "14.285714%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { fontSize: 13, fontWeight: "500", color: "#172438" },
  disabled: { color: "#BDC4CE" },
  today: { borderWidth: 1, borderColor: "#2455BE" },
  selected: { backgroundColor: "#2455BE" },
  selectedText: { color: "white", fontWeight: "700" },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 4,
    bottom: 4,
    backgroundColor: "#EAF0FF",
  },
  helper: { fontSize: 10, color: "#8992A3", lineHeight: 17, marginTop: 10 },
});
