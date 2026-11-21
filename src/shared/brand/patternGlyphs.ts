/**
 * Acilis ve gecis ekranlarinin zemin deseni icin elle cizilmis ince cizgi ikonlari. Her ikon (0, 0)
 * merkezli, yaklasik -30..30 birimlik bir kutuya sigar ve yalnizca kontur (stroke) olarak cizilir.
 */
export type GlyphPart =
  | { kind: "path"; d: string }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx?: number };

export type Glyph = readonly GlyphPart[];

const path = (d: string): GlyphPart => ({ kind: "path", d });
const circle = (cx: number, cy: number, r: number): GlyphPart => ({ kind: "circle", cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx = 2): GlyphPart => ({ kind: "rect", x, y, width, height, rx });

// --- MB Fit: antrenman ve beslenme ---
const dumbbell: Glyph = [
  path("M-16 0 H16 M-32 0 H-28 M28 0 H32"),
  rect(-28, -13, 7, 26),
  rect(-21, -9, 5, 18, 1.5),
  rect(21, -13, 7, 26),
  rect(16, -9, 5, 18, 1.5),
];
const kettlebell: Glyph = [
  path("M-11 -9 V-17 A11 10 0 0 1 11 -17 V-9"),
  path("M-11 22 A19 19 0 1 1 11 22 Z"),
];
const heartPulse: Glyph = [
  path("M0 19 C-27 3 -25 -21 -9 -21 C-4 -21 0 -16 0 -12 C0 -16 4 -21 9 -21 C25 -21 27 3 0 19 Z"),
  path("M-15 -1 H-8 L-4 -8 L1 7 L5 -1 H15"),
];
const plate: Glyph = [circle(0, 0, 23), circle(0, 0, 15), circle(0, 0, 5)];
const stopwatch: Glyph = [
  circle(0, 4, 19),
  path("M0 -15 V-21 M-6 -23 H6 M14 -11 L18 -15 M0 4 L8 -4"),
];
const apple: Glyph = [
  path("M0 -9 C-6 -15 -22 -14 -22 3 C-22 17 -10 25 0 20 C10 25 22 17 22 3 C22 -14 6 -15 0 -9 Z"),
  path("M0 -9 C0 -17 4 -22 10 -23"),
];
const shaker: Glyph = [
  rect(-11, -25, 22, 7),
  path("M-12 -18 H12 L10 22 Q10 25 7 25 H-7 Q-10 25 -10 22 Z M-11 -6 H11"),
];
const drop: Glyph = [
  path("M0 -23 C9 -11 17 -3 17 8 A17 17 0 0 1 -17 8 C-17 -3 -9 -11 0 -23 Z"),
  path("M-8 9 A8 8 0 0 0 0 17"),
];

// --- MB Shop: alisveris ---
const bag: Glyph = [path("M-17 -8 H17 L19 23 H-19 Z"), path("M-8 -8 V-14 A8 8 0 0 1 8 -14 V-8")];
const cart: Glyph = [
  path("M-27 -17 H-19 L-12 10 H16 L22 -9 H-16"),
  circle(-8, 18, 3.5),
  circle(12, 18, 3.5),
];
const tag: Glyph = [path("M-21 -21 H3 L23 -1 L-1 23 L-21 3 Z"), circle(-11, -11, 3.5)];
const gift: Glyph = [
  rect(-18, -6, 36, 27),
  rect(-21, -14, 42, 8),
  path("M0 -14 V21 M0 -14 C-6 -24 -17 -22 -10 -14 M0 -14 C6 -24 17 -22 10 -14"),
];
const box: Glyph = [path("M0 -23 L21 -11 V11 L0 23 L-21 11 V-11 Z M-21 -11 L0 0 L21 -11 M0 0 V23")];
const card: Glyph = [rect(-25, -16, 50, 32, 4), path("M-25 -6 H25 M-17 8 H-5")];
const percent: Glyph = [circle(0, 0, 21), path("M-8 8 L8 -8"), circle(-7, -7, 3), circle(7, 7, 3)];
const receipt: Glyph = [
  path("M-14 -23 H14 V23 L9 19 L4 23 L-1 19 L-6 23 L-11 19 L-14 23 Z"),
  path("M-8 -13 H8 M-8 -5 H8 M-8 3 H3"),
];

/**
 * Her bolum icin 8 ikon: ilk dordu karonun icindeki baklava dilimlerine, son dordu karonun kenarlarina
 * (komsu karoyla paylasilan dilimlere) yerlesir.
 */
export const PATTERN_GLYPHS: Record<"fit" | "shop", readonly Glyph[]> = {
  fit: [dumbbell, kettlebell, heartPulse, plate, stopwatch, apple, shaker, drop],
  shop: [bag, cart, tag, gift, box, card, percent, receipt],
};
