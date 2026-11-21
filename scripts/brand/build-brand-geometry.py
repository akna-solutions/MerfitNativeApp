"""
MB Fit yazi logosunun ("MB | FIT") ve uygulama ikonu monogramining ("MB") vektor geometrisini uretir.

Harfler Inter yazi tipinden (SIL Open Font License) dis hatlara cevrilir; boylece logo her cihazda, sistem
fontundan bagimsiz olarak birebir ayni gorunur. Cikti: src/shared/brand/brandGeometry.json
(uygulama icindeki SVG bilesenleri ve scripts/brand/generate-brand-assets.js bunu kullanir).

Kullanim:
    pip install fonttools
    python3 scripts/brand/build-brand-geometry.py [--fonts /usr/share/fonts/opentype/inter]
"""
import argparse
import json
import os

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "src", "shared", "brand", "brandGeometry.json")

SIZE = 100.0  # yazi boyutu (birim)


def fmt(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")


def text_path(font_path, text, x, baseline, tracking):
    font = TTFont(font_path)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = SIZE / font["head"].unitsPerEm
    pen = SVGPathPen(glyphs, ntos=fmt)
    bounds = BoundsPen(glyphs)
    cursor = x
    for ch in text:
        name = cmap[ord(ch)]
        for target in (pen, bounds):
            glyphs[name].draw(TransformPen(target, (scale, 0, 0, -scale, cursor, baseline)))
        cursor += glyphs[name].width * scale + tracking
    return pen.getCommands(), bounds.bounds


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fonts", default="/usr/share/fonts/opentype/inter")
    args = parser.parse_args()
    bold = os.path.join(args.fonts, "Inter-ExtraBold.otf")
    light = os.path.join(args.fonts, "Inter-Light.otf")

    baseline = 100.0

    # Yazi logo: kalin MB, ince mavi ayirac, hafif ikinci kelime (FIT ya da SHOP). Taban cizgisi y=100.
    def wordmark(suffix):
        mb, mb_box = text_path(bold, "MB", 0, baseline, 1.0)
        cap_top = mb_box[1]
        bar_w, gap = 9.0, 30.0
        bar_x = mb_box[2] + gap
        bar_pad = 6.0  # ayirac harflerden biraz uzun
        bar = {"x": round(bar_x, 2), "y": round(cap_top - bar_pad, 2), "width": bar_w,
               "height": round(baseline - cap_top + 2 * bar_pad, 2)}
        word, word_box = text_path(light, suffix, bar_x + bar_w + gap - 2.0, baseline, 2.0)
        min_x, max_x = mb_box[0], word_box[2]
        min_y, max_y = bar["y"], bar["y"] + bar["height"]
        return {
            "viewBox": [round(min_x, 2), round(min_y, 2), round(max_x - min_x, 2), round(max_y - min_y, 2)],
            "mb": mb,
            "word": word,
            "bar": bar,
        }

    # Ikon monogrami: kalin MB ve altinda kisa yatay mavi cizgi.
    mono_mb, mono_box = text_path(bold, "MB", 0, baseline, 1.0)
    width = mono_box[2] - mono_box[0]
    under_w, under_h, under_gap = width * 0.34, 9.0, 16.0
    under = {"x": round(mono_box[0] + (width - under_w) / 2, 2), "y": round(baseline + under_gap, 2),
             "width": round(under_w, 2), "height": under_h}
    monogram = {
        "viewBox": [round(mono_box[0], 2), round(mono_box[1], 2), round(width, 2),
                    round(under["y"] + under_h - mono_box[1], 2)],
        "mb": mono_mb,
        "bar": under,
    }

    with open(OUT, "w") as fh:
        json.dump({"source": "Inter ExtraBold / Light (SIL OFL)", "wordmark": wordmark("FIT"),
                   "wordmarkShop": wordmark("SHOP"), "monogram": monogram}, fh,
                  indent=2, ensure_ascii=False)
        fh.write("\n")
    print("yazildi:", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
