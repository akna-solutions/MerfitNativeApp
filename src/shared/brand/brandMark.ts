/**
 * MB Fit marka kimligi: "MB | FIT" yazi logosu ve uygulama ikonundaki "MB" monogrami.
 * Harf geometrisi brandGeometry.json'dadir (scripts/brand/build-brand-geometry.py ile Inter'den uretilir);
 * ayni dosyayi gorsel uretim betigi (scripts/brand/generate-brand-assets.js) de kullanir.
 */
import geometry from "./brandGeometry.json";

export type BrandShape = {
  viewBox: readonly [number, number, number, number];
  /** Harfler (ana renk). */
  paths: readonly string[];
  /** Mavi vurgu cizgisi. */
  bar: { x: number; y: number; width: number; height: number };
};

type WordmarkGeometry = { viewBox: number[]; mb: string; word: string; bar: BrandShape["bar"] };

const wordmarkShape = (g: WordmarkGeometry): BrandShape => ({
  viewBox: g.viewBox as unknown as BrandShape["viewBox"],
  paths: [g.mb, g.word],
  bar: g.bar,
});

/** "MB | FIT" */
export const WORDMARK: BrandShape = wordmarkShape(geometry.wordmark);
/** "MB | SHOP": MB Shop bolumune geciste kullanilir. */
export const WORDMARK_SHOP: BrandShape = wordmarkShape(geometry.wordmarkShop);

export const MONOGRAM: BrandShape = {
  viewBox: geometry.monogram.viewBox as unknown as BrandShape["viewBox"],
  paths: [geometry.monogram.mb],
  bar: geometry.monogram.bar,
};

export const aspectOf = (shape: BrandShape) => shape.viewBox[3] / shape.viewBox[2];

export const BRAND_BLUE = "#2563EB";
export const BRAND_BLACK = "#050507";
export const BRAND_WHITE = "#FFFFFF";

/**
 * Native acilis ekranindaki yazi logosunun genisligi (dp): app.json'da imageWidth 300, splash-icon.png'de
 * logo 1024 px tuvalin 600 px'ini kaplar (300 * 600 / 1024). JS acilis ekrani logoyu ayni boyutta baslatir
 * ki native ekrandan gecis fark edilmesin.
 */
export const NATIVE_SPLASH_WORDMARK_WIDTH = 175.78;
