/**
 * Alt navbar secim gostergesinin surukleme matematigi. Saf fonksiyonlar: hem UI thread'inde (worklet)
 * hem testlerde ayni sekilde calisir.
 */

export const NAV_TAB_COUNT = 4;

/** Gostergenin sol kenarinin alabilecegi en kucuk/en buyuk x (kapsul ici dolgu dahil). */
export function indicatorBounds(itemWidth: number, count: number = NAV_TAB_COUNT, inset: number = 0) {
  "worklet";
  return { min: inset, max: inset + itemWidth * (count - 1) };
}

export function indicatorXForIndex(index: number, itemWidth: number, inset: number = 0) {
  "worklet";
  return inset + index * itemWidth;
}

/** Surukleme sirasinda gostergeyi kapsulun disina tasirmaz. */
export function clampIndicatorX(x: number, itemWidth: number, count: number = NAV_TAB_COUNT, inset: number = 0) {
  "worklet";
  const { min, max } = indicatorBounds(itemWidth, count, inset);
  return Math.min(max, Math.max(min, x));
}

/** Gostergenin (sol kenar) x konumuna en yakin sekmenin indeksi. */
export function nearestIndex(x: number, itemWidth: number, count: number = NAV_TAB_COUNT, inset: number = 0) {
  "worklet";
  if (itemWidth <= 0) return 0;
  const raw = Math.round((x - inset) / itemWidth);
  return Math.min(count - 1, Math.max(0, raw));
}

/**
 * Birakma anindaki hiz da hesaba katilir: gosterge hizli sekilde bir yone firlatildiysa, sadece konuma gore
 * ayni sekmede kalmak yerine o yondeki bir sonraki sekmeye gecilir.
 */
export function settleIndex(x: number, velocityX: number, itemWidth: number, count: number = NAV_TAB_COUNT, inset: number = 0) {
  "worklet";
  const projected = x + velocityX * 0.08;
  return nearestIndex(projected, itemWidth, count, inset);
}
