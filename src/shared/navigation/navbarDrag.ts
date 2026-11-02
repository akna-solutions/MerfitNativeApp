/**
 * Alt navbar'in olcu ve surukleme matematigi. Saf fonksiyonlar: hem UI thread'inde (worklet) hem testlerde ayni
 * sekilde calisir.
 *
 * Yerlesim: secili sekme genis bir hap (ikon + etiket), digerleri `itemSize` capinda yuvarlak butonlardir; aralarinda
 * `gap` bosluk vardir. Secili sekmeden onceki tum sekmeler yuvarlak oldugundan, `index`. sekmenin sol kenari her
 * zaman `index * (itemSize + gap)` noktasindadir; surukleme bu sabit adimla hesaplanir.
 */

export const NAV_TAB_COUNT = 4;

/** Bir sekmeden digerine gecis adimi (yuvarlak buton + bosluk). */
export function navStep(itemSize: number, gap: number) {
  "worklet";
  return itemSize + gap;
}

/**
 * Secili (genis) hapin genisligi: navbar'in toplam genisliginden yuvarlak butonlar ve bosluklar dusulur; kalan alan
 * `itemSize` ile `maxWidth` arasina sikistirilir. `trailing` saga eklenen yuvarlak aksiyon butonunun capidir.
 */
export function activePillWidth(
  totalWidth: number,
  itemSize: number,
  gap: number,
  maxWidth: number,
  count: number = NAV_TAB_COUNT,
  trailing: number = itemSize,
) {
  "worklet";
  const fixed = (count - 1) * itemSize + count * gap + trailing;
  return Math.min(maxWidth, Math.max(itemSize, totalWidth - fixed));
}

/** `index`. sekme seciliyken genis hapin kapladigi yatay aralik (sekme grubunun koordinatlarinda). */
export function pillSpan(index: number, step: number, pillWidth: number) {
  "worklet";
  const start = index * step;
  return { start, end: start + pillWidth };
}

/** Dokunma noktasi secili hapin uzerinde mi? Surukleme yalnizca hapin kendisinden baslar. */
export function isOnPill(x: number, index: number, step: number, pillWidth: number) {
  "worklet";
  if (index < 0) return false;
  const { start, end } = pillSpan(index, step, pillWidth);
  return x >= start && x <= end;
}

function clampIndex(index: number, count: number) {
  "worklet";
  return Math.min(count - 1, Math.max(0, index));
}

/** Surukleme sirasinda hapin ustunde durdugu sekme: baslangic sekmesi + kat edilen adim sayisi. */
export function dragIndex(startIndex: number, translationX: number, step: number, count: number = NAV_TAB_COUNT) {
  "worklet";
  if (step <= 0) return clampIndex(startIndex, count);
  return clampIndex(startIndex + Math.round(translationX / step), count);
}

/**
 * Birakma anindaki hiz da hesaba katilir: hap hizli sekilde bir yone firlatildiysa, sadece konuma gore ayni sekmede
 * kalmak yerine o yondeki bir sonraki sekmeye gecilir.
 */
export function settleIndex(startIndex: number, translationX: number, velocityX: number, step: number, count: number = NAV_TAB_COUNT) {
  "worklet";
  return dragIndex(startIndex, translationX + velocityX * 0.08, step, count);
}
