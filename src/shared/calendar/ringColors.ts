/**
 * Takvim halkalarinin renkleri (tema bagimsiz, acik/koyu temada okunur). Antrenman uygulamanin ana
 * rengini kullanir; aktivite (harcanan) ve beslenme (alinan) ayri renklerle ayrilir.
 */
export const RING_COLORS = {
  activity: "#F59E0B",
  nutrition: "#22C55E",
} as const;

/** Aktivite halkasinin dolu sayildigi gunluk aktif sure (dk). Saglik kuruluslarinin haftalik 150 dk onerisinin gunluk karsiligi. */
export const ACTIVE_MINUTES_REFERENCE = 30;
