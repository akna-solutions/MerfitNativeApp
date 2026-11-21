import { memo, useId } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from "react-native-svg";

import { Glyph, PATTERN_GLYPHS } from "./patternGlyphs";

/** Karo boyutu (dp). Karo, kenari TILE/2 olan baklava (45 derece donmus kare) agindan olusur. */
const TILE = 300;
const H = TILE / 2;
const Q = TILE / 4;
/** Ikonlarin olcegi: ~60 birimlik ikon, baklava diliminin icine rahat sigar. */
const GLYPH_SCALE = 1.15;

/**
 * Baklava dilimlerinin merkezleri. Ilk dordu karonun icinde; kenardakiler komsu karoda da gorunsun diye
 * karsi kenarda tekrar cizilir (desen dikissiz tekrarlanir).
 */
const INNER = [
  [H, Q],
  [Q, H],
  [3 * Q, H],
  [H, 3 * Q],
] as const;
const EDGE = [
  [[Q, 0], [Q, TILE]],
  [[3 * Q, 0], [3 * Q, TILE]],
  [[0, Q], [TILE, Q]],
  [[0, 3 * Q], [TILE, 3 * Q]],
] as const;
/** Ag cizgilerinin kesistigi dugumler. */
const NODES = [
  [0, 0], [H, 0], [TILE, 0],
  [Q, Q], [3 * Q, Q],
  [0, H], [H, H], [TILE, H],
  [Q, 3 * Q], [3 * Q, 3 * Q],
  [0, TILE], [H, TILE], [TILE, TILE],
] as const;
/** Egimi +1 ve -1 olan ag cizgileri (karo icinde kirpilmis). */
const LATTICE =
  `M0 ${H} L${H} 0 M0 ${TILE} L${TILE} 0 M${H} ${TILE} L${TILE} ${H} ` +
  `M0 ${H} L${H} ${TILE} M0 0 L${TILE} ${TILE} M${H} 0 L${TILE} ${H}`;

function GlyphShape({ glyph, x, y, rotate }: { glyph: Glyph; x: number; y: number; rotate: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${GLYPH_SCALE})`}>
      {glyph.map((part, i) => {
        if (part.kind === "path") return <Path key={i} d={part.d} />;
        if (part.kind === "circle") return <Circle key={i} cx={part.cx} cy={part.cy} r={part.r} />;
        return <Rect key={i} x={part.x} y={part.y} width={part.width} height={part.height} rx={part.rx} />;
      })}
    </G>
  );
}

type Props = {
  variant?: "fit" | "shop";
  /** Cizgi rengi; varsayilan beyaz. Gorunurlugu `opacity` belirler. */
  color?: string;
  /** Desenin genel gorunurlugu; varsayilan cok soluk. */
  opacity?: number;
};

/**
 * Zeminde cok az belli olan, birbirine bagli geometrik desen: ince cizgilerden bir baklava agi, agin
 * dugumlerinde kucuk halkalar ve her baklava diliminin icinde elle cizilmis bir ikon (MB Fit icin antrenman
 * ve beslenme, MB Shop icin alisveris). Tek bir SVG Pattern olarak cizilir; statiktir.
 */
export const BrandPattern = memo(function BrandPattern({ variant = "fit", color = "#FFFFFF", opacity = 0.04 }: Props) {
  const { width, height } = useWindowDimensions();
  const glyphs = PATTERN_GLYPHS[variant];
  const id = `mbfit-pattern-${variant}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`brand-pattern-${variant}`}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id={id}
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
            // Karo ekranin ortasina hizalanir; desen her ekran genisliginde simetrik baslar.
            x={(width / 2) % TILE}
            y={(height / 2) % TILE}
          >
            <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
              <Path d={LATTICE} strokeWidth={1} strokeOpacity={0.6} />
              {NODES.map(([x, y]) => (
                <Circle key={`n${x}-${y}`} cx={x} cy={y} r={3.5} strokeWidth={1} strokeOpacity={0.6} />
              ))}
              <G strokeWidth={1.6}>
                {INNER.map(([x, y], i) => (
                  <GlyphShape key={`i${i}`} glyph={glyphs[i]} x={x} y={y} rotate={i % 2 ? -12 : 12} />
                ))}
                {EDGE.map((pair, i) =>
                  pair.map(([x, y], j) => (
                    <GlyphShape key={`e${i}-${j}`} glyph={glyphs[4 + i]} x={x} y={y} rotate={i % 2 ? 10 : -10} />
                  )),
                )}
              </G>
            </G>
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${id})`} opacity={opacity} />
      </Svg>
    </View>
  );
});
