// Antrenman gecmisi ekranlarinin ortak bicimlendiricileri.

export function formatHistoryDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay(date, today)) return `Bugün, ${time}`;
  if (sameDay(date, yesterday)) return `Dün, ${time}`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function formatMinutes(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  return `${Math.max(1, Math.round(seconds / 60))} dk`;
}

export function formatKg(weight: number) {
  const rounded = Math.round(weight * 10) / 10;
  return `${rounded.toLocaleString("tr-TR")} kg`;
}
