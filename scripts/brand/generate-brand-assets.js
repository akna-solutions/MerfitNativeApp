/**
 * MB Fit marka gorsellerini (uygulama ikonu, Android adaptive ikon katmanlari, acilis ekrani logosu,
 * favicon) tek kaynaktan uretir. Renkler yalnizca siyah / beyaz / mavidir; gradyan kullanilmaz.
 *
 * Kullanim (Playwright + Chromium gerekir; projeye bagimlilik olarak eklenmez):
 *   node scripts/brand/generate-brand-assets.js
 *   # Istege bagli: PNG boyutlarini kucultmek icin (Pillow ile, gorunum degismez)
 *   python3 -c "from PIL import Image; import glob; [Image.open(f).save(f, optimize=True) for f in glob.glob('assets/images/*icon*.png')]"
 *
 * Harf geometrisi src/shared/brand/brandGeometry.json'dadir (scripts/brand/build-brand-geometry.py uretir);
 * uygulama icindeki SVG bilesenleri de ayni dosyayi kullanir.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const geometry = require("../../src/shared/brand/brandGeometry.json");

const BRAND_BLUE = "#2563EB";
const BRAND_BLACK = "#050507";
const BRAND_WHITE = "#FFFFFF";

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_IMAGES = path.join(ROOT, "assets", "images");
const OUT_BRAND = path.join(ROOT, "assets", "brand");

/** Sekli (cx, cy) merkezli ve `width` piksel genisliginde cizer. */
function shape(kind, { cx, cy, width, primary = BRAND_WHITE, accent = BRAND_BLUE }) {
  const g = kind === "wordmark" ? geometry.wordmark : geometry.monogram;
  const [vx, vy, vw, vh] = g.viewBox;
  const scale = width / vw;
  const tx = cx - (vx + vw / 2) * scale;
  const ty = cy - (vy + vh / 2) * scale;
  const letters = (kind === "wordmark" ? [g.mb, g.word] : [g.mb]).map((d) => `<path d="${d}" fill="${primary}"/>`).join("");
  const { x, y, width: bw, height: bh } = g.bar;
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">${letters}<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${accent}"/></g>`;
}

const svg = (body, { size = 1024, w = size, h = size, viewBox = "0 0 1024 1024" } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${body}</svg>`;

const vb = (g) => g.viewBox.join(" ");
const svgOf = (kind, primary) => {
  const g = geometry[kind];
  const [, , vw, vh] = g.viewBox;
  const [vx, vy] = g.viewBox;
  return svg(shape(kind, { cx: vx + vw / 2, cy: vy + vh / 2, width: vw, primary }), { w: vw, h: vh, viewBox: vb(g) });
};

const ASSETS = {
  // iOS / genel uygulama ikonu: duz siyah zemin, ortalanmis "MB" monogrami.
  "icon.png": {
    opaque: true,
    svg: svg(`<rect width="1024" height="1024" fill="${BRAND_BLACK}"/>${shape("monogram", { cx: 512, cy: 512, width: 500 })}`),
  },
  // Android adaptive ikon: on katman guvenli alanda (ortadaki %66'lik daire) kalir.
  "android-icon-foreground.png": {
    svg: svg(shape("monogram", { cx: 512, cy: 512, width: 420 })),
  },
  "android-icon-background.png": {
    opaque: true,
    svg: svg(`<rect width="1024" height="1024" fill="${BRAND_BLACK}"/>`),
  },
  "android-icon-monochrome.png": {
    svg: svg(shape("monogram", { cx: 512, cy: 512, width: 420, accent: BRAND_WHITE })),
  },
  // Native acilis ekrani: yalnizca "MB | FIT" yazi logosu, seffaf zemin. app.json'da imageWidth 300 ile logo
  // ~176 dp genisliginde gorunur; JS acilis ekrani (src/shared/brand/BrandSplash.tsx) ayni boyutla baslar.
  // Android 12+ ikonu ortadaki daireye kirpar; 600 px genislikte logo bu dairenin icinde kalir.
  "splash-icon.png": {
    svg: svg(shape("wordmark", { cx: 512, cy: 512, width: 600 })),
  },
  "favicon.png": {
    size: 48,
    opaque: true,
    svg: svg(`<rect width="1024" height="1024" fill="${BRAND_BLACK}"/>${shape("monogram", { cx: 512, cy: 512, width: 760 })}`, { size: 48 }),
  },
};

const SOURCE_SVGS = {
  "mbfit-icon.svg": ASSETS["icon.png"].svg,
  "mbfit-wordmark.svg": svgOf("wordmark", BRAND_WHITE),
  "mbfit-wordmark-light.svg": svgOf("wordmark", "#0B0D12"),
  "mbfit-monogram.svg": svgOf("monogram", BRAND_WHITE),
};

(async () => {
  for (const [name, content] of Object.entries(SOURCE_SVGS)) {
    fs.writeFileSync(path.join(OUT_BRAND, name), content + "\n");
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [name, asset] of Object.entries(ASSETS)) {
    const size = asset.size ?? 1024;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${asset.svg}</body></html>`);
    await page.screenshot({
      path: path.join(OUT_IMAGES, name),
      omitBackground: !asset.opaque,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    console.log("yazildi:", name);
  }
  await browser.close();
})();
