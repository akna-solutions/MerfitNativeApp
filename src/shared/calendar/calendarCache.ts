import { getActivityCalendar } from "../../services/api/progress";
import { ActivityCalendarResponse } from "../../services/api/types";

/** Ayni aralik bu sure icinde tekrar istenirse ag istegi atilmaz (ekranlar arasi gecis, ay ileri/geri). */
export const CALENDAR_CACHE_TTL_MS = 60_000;

type Entry = { at: number; data: ActivityCalendarResponse };

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<ActivityCalendarResponse>>();

const keyOf = (from: string, to: string) => `${from}|${to}`;

/** Onbellekteki (suresi dolmamis) yaniti dondurur; yoksa undefined. */
export function peekCalendar(from: string, to: string): ActivityCalendarResponse | undefined {
  const entry = cache.get(keyOf(from, to));
  if (!entry || Date.now() - entry.at > CALENDAR_CACHE_TTL_MS) return undefined;
  return entry.data;
}

/**
 * Araligi onbellekten veya tek bir ag isteginden getirir. Ayni aralik icin es zamanli cagrilar ayni
 * istegi paylasir. `force` onbellegi atlar (orn. ekran odaga geldiginde, yeni kayit sonrasi).
 */
export async function fetchCalendar(
  from: string,
  to: string,
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<ActivityCalendarResponse> {
  const key = keyOf(from, to);
  if (!options.force) {
    const cached = peekCalendar(from, to);
    if (cached) return cached;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  // Paylasilan istek tek bir ekranin AbortSignal'ina baglanmaz; iptal edilen ekran sonucu yok sayar.
  const request = getActivityCalendar(from, to)
    .then((data) => {
      cache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);

  const data = await request;
  if (options.signal?.aborted) {
    const aborted = new Error("Aborted");
    aborted.name = "AbortError";
    throw aborted;
  }
  return data;
}

/** Antrenman/ogun/kilo kaydindan sonra tum takvim onbellegini gecersiz kilar. */
export function invalidateCalendarCache() {
  cache.clear();
}
