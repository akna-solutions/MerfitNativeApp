import { NotificationItem } from "../../services/api/types";

export type NotificationDaySection = {
  /** Yerel gun anahtari (YYYY-MM-DD). */
  key: string;
  title: string;
  data: NotificationItem[];
};

function localDayKey(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function formatDayTitle(date: Date, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (localDayKey(date) === localDayKey(now)) return "Bugün";
  if (localDayKey(date) === localDayKey(yesterday)) return "Dün";
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

export function formatNotificationTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Bildirimleri (en yeniden eskiye sirali gelir) kullanicinin yerel gunune gore gruplar.
 * Sira korunur: ilk bolum en yeni gun.
 */
export function groupNotificationsByDay(items: NotificationItem[], now = new Date()): NotificationDaySection[] {
  const sections: NotificationDaySection[] = [];
  const byKey = new Map<string, NotificationDaySection>();
  for (const item of items) {
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = localDayKey(date);
    let section = byKey.get(key);
    if (!section) {
      section = { key, title: formatDayTitle(date, now), data: [] };
      byKey.set(key, section);
      sections.push(section);
    }
    section.data.push(item);
  }
  return sections;
}
