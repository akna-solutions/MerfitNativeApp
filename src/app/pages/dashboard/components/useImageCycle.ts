import { useCallback, useEffect, useMemo, useState } from "react";

/** Gorseller arasi gecis araligi (ms). */
export const IMAGE_CYCLE_MS = 4000;

/** Yalnizca http(s) adreslerini, tekrarsiz ve en fazla `limit` adet olarak alir. */
export function usableImageUrls(urls: (string | null | undefined)[], limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
    if (result.length >= limit) break;
  }
  return result;
}

/**
 * Bugunun egzersiz gorselleri arasinda sirayla gezer. Yuklenemeyen gorsel listeden cikarilir; hic gorsel
 * kalmazsa `current` null olur ve kart yedek (gradient) gorunumune duser. Hareketi azalt acikken veya
 * tek gorsel varken dongu calismaz.
 */
export function useImageCycle(urls: string[], options: { paused?: boolean; intervalMs?: number } = {}) {
  const { paused = false, intervalMs = IMAGE_CYCLE_MS } = options;
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [index, setIndex] = useState(0);

  const available = useMemo(() => urls.filter((url) => !failed.has(url)), [urls, failed]);
  const urlsKey = urls.join("|");

  // Gorsel listesi degisince (orn. plan yenilendi) basa don ve hatalari unut.
  useEffect(() => {
    setIndex(0);
    setFailed(new Set());
  }, [urlsKey]);

  useEffect(() => {
    if (paused || available.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % available.length), intervalMs);
    return () => clearInterval(timer);
  }, [paused, available.length, intervalMs]);

  const markFailed = useCallback((url: string) => {
    setFailed((previous) => {
      if (previous.has(url)) return previous;
      const next = new Set(previous);
      next.add(url);
      return next;
    });
  }, []);

  const current = available.length > 0 ? available[index % available.length] : null;
  return { current, count: available.length, markFailed };
}
