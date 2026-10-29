export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function daysInclusive(start: string, end: string) {
  return (
    Math.round(
      (Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) /
        86400000,
    ) + 1
  );
}
export function calendarDays(year: number, month: number): (string | null)[] {
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const length = Math.ceil((offset + count) / 7) * 7;
  return Array.from({ length }, (_, i) =>
    i < offset || i >= offset + count
      ? null
      : monthKey(year, month, i - offset + 1),
  );
}
export function shortDate(key: string) {
  const [, month, day] = key.split("-").map(Number);
  return `${month}월 ${day}일`;
}
export function selectRange(
  start: string | null,
  end: string | null,
  day: string,
) {
  if (!start || end || day < start) return { start: day, end: null };
  return { start, end: day };
}
