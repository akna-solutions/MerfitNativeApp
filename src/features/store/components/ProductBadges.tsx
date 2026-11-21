import { memo } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

import { ProductBadge, ProductBadgeCode } from "../types";

/**
 * MB Shop urun rozetleri. Gorsellerin ust koselerine yerlestirilir: sol ust kosede durum rozetleri (sunucunun
 * onem sirasiyla), sag ustte indirim muhru. Renkler MBFit paletinden sabittir (siyah, beyaz, mavi) ve temadan
 * bagimsizdir; cunku rozet her zaman urun fotografinin uzerinde durur. Ikonlar burada cizilir (hazir ikon/emoji yok).
 */

const BLUE = "#1d51c0";
const BLUE_BRIGHT = "#3E7BFA";
const INK = "#0B0D12";
const PAPER = "#FFFFFF";

type Tone = "blue" | "ink" | "paper";

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  blue: { bg: BLUE, fg: PAPER, border: "rgba(255,255,255,0.35)" },
  ink: { bg: INK, fg: PAPER, border: "rgba(255,255,255,0.28)" },
  paper: { bg: PAPER, fg: INK, border: "rgba(11,13,18,0.14)" },
};

const BADGE_TONE: Record<ProductBadgeCode, Tone> = {
  advantageous: "blue",
  mbfit_pick: "blue",
  low_stock: "paper",
  bestseller: "ink",
  top_rated: "ink",
  new: "ink",
  free_shipping: "paper",
};

/** Ikon cizimleri 12x12 kutuda; renk rozetin metin rengiyle ayni, vurgu (accent) mavi. */
function BadgeGlyph({ code, color, accent, size }: { code: ProductBadgeCode; color: string; accent: string; size: number }) {
  const common = { width: size, height: size, viewBox: "0 0 12 12" } as const;
  switch (code) {
    case "advantageous":
      // Yukari bakan cift sevron: "daha iyi fiyat/deger".
      return (
        <Svg {...common}>
          <Path d="M2.5 6.8 6 3.6l3.5 3.2" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2.5 9.6 6 6.4l3.5 3.2" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        </Svg>
      );
    case "mbfit_pick":
      // Kalkan icinde onay.
      return (
        <Svg {...common}>
          <Path d="M6 1.2 10 2.7v3.1c0 2.4-1.7 4.2-4 5-2.3-.8-4-2.6-4-5V2.7L6 1.2Z" fill={color} />
          <Path d="M4.1 6.1 5.5 7.4l2.5-2.7" stroke={BLUE} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "bestseller":
      // Yukselen grafik cizgisi.
      return (
        <Svg {...common}>
          <Path d="M1.5 9.5 4.6 6.3l2 1.9L10.3 4" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7.6 3.6h2.9v2.9" stroke={accent} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "top_rated":
      return (
        <Svg {...common}>
          <Path d="m6 1.3 1.4 3 3.2.4-2.4 2.2.7 3.2L6 8.5l-2.9 1.6.7-3.2-2.4-2.2 3.2-.4L6 1.3Z" fill={accent} />
        </Svg>
      );
    case "new":
      // Dort koseli parilti.
      return (
        <Svg {...common}>
          <Path d="M6 1c.3 2.3 1.2 3.4 3.8 4-2.6.6-3.5 1.7-3.8 4-.3-2.3-1.2-3.4-3.8-4C4.8 4.4 5.7 3.3 6 1Z" fill={accent} />
        </Svg>
      );
    case "low_stock":
      // Kum saati.
      return (
        <Svg {...common}>
          <Path d="M3 1.5h6M3 10.5h6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M3.6 1.8c0 2.4 2.4 2.6 2.4 4.2S3.6 7.8 3.6 10.2M8.4 1.8C8.4 4.2 6 4.4 6 6s2.4 1.8 2.4 4.2" stroke={color} strokeWidth={1.2} fill="none" />
          <Path d="M4.6 9.6 6 8.2l1.4 1.4Z" fill={accent} />
        </Svg>
      );
    case "free_shipping":
      // Hizli kargo kutusu (hiz cizgileriyle).
      return (
        <Svg {...common}>
          <Path d="M4.2 3.2h6.3v5.6H4.2z" fill={accent} />
          <Path d="M4.2 5.2h6.3" stroke={PAPER} strokeWidth={0.9} />
          <Path d="M1 4.4h2.2M.6 6.2h2.6M1 8h2.2" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

type BadgeProps = { badge: ProductBadge; size?: "sm" | "md"; testID?: string };

/** Tek rozet: sporcu "sekme" bicimi (sol ust ve sag alt koseler kesik), egik buyuk harf, ikon + etiket. */
export const ProductBadgeChip = memo(function ProductBadgeChip({ badge, size = "sm", testID }: BadgeProps) {
  const tone = TONES[BADGE_TONE[badge.code]];
  const accent = tone.bg === BLUE ? PAPER : BLUE_BRIGHT;
  const md = size === "md";
  return (
    <View
      testID={testID ?? `badge-${badge.code}`}
      accessible
      accessibilityLabel={badge.label}
      style={[styles.chip, md ? styles.chipMd : styles.chipSm, { backgroundColor: tone.bg, borderColor: tone.border }]}
    >
      <BadgeGlyph code={badge.code} color={tone.fg} accent={tone.bg === PAPER ? BLUE : accent} size={md ? 13 : 11} />
      <Text style={[styles.label, md ? styles.labelMd : styles.labelSm, { color: tone.fg }]} numberOfLines={1}>
        {badge.label.toLocaleUpperCase("tr-TR")}
      </Text>
    </View>
  );
});

type StackProps = {
  badges: ProductBadge[];
  /** Kartta 2, detayda 3; fazlasi gosterilmez (sunucu onem sirasiyla gonderir). */
  max?: number;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Sol ust kose rozet yigini. Rozet yoksa hicbir sey cizmez. */
export function ProductBadgeStack({ badges, max = 2, size = "sm", style, testID = "badge-stack" }: StackProps) {
  if (badges.length === 0) return null;
  return (
    <View style={[styles.stack, style]} pointerEvents="none" testID={testID}>
      {badges.slice(0, max).map((b) => (
        <ProductBadgeChip key={b.code} badge={b} size={size} />
      ))}
    </View>
  );
}

const SEAL_POINTS = 14;

/** Dis yaricapi r, ic yaricapi r*0.9 olan tirtikli muhur yolu (100x100 kutu). */
function sealPath(): string {
  const outer = 49;
  const inner = 44;
  const steps = SEAL_POINTS * 2;
  let d = "";
  for (let i = 0; i < steps; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * 2 * i) / steps - Math.PI / 2;
    const x = 50 + r * Math.cos(a);
    const y = 50 + r * Math.sin(a);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

const SEAL = sealPath();

/** Sag ust kose indirim muhru: mavi tirtikli daire, beyaz ic halka, "%20 / İNDİRİM". */
export function DiscountSeal({ percent, size = 44, testID }: { percent: number; size?: number; testID?: string }) {
  if (percent <= 0) return null;
  return (
    <View pointerEvents="none" testID={testID ?? "discount-seal"} accessible accessibilityLabel={`Yüzde ${percent} indirim`} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d={SEAL} fill={BLUE} stroke={PAPER} strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={50} cy={50} r={36} fill="none" stroke={PAPER} strokeWidth={1.6} strokeDasharray="3 3" opacity={0.7} />
        <SvgText x={50} y={54} fill={PAPER} fontSize={percent >= 100 ? 24 : 30} fontWeight="900" textAnchor="middle">
          {`%${percent}`}
        </SvgText>
        <SvgText x={50} y={71} fill={PAPER} fontSize={11.5} fontWeight="800" letterSpacing={1} textAnchor="middle">
          İNDİRİM
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: "flex-start", gap: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 9,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chipSm: { paddingHorizontal: 6, paddingVertical: 3, gap: 4 },
  chipMd: { paddingHorizontal: 8, paddingVertical: 4, gap: 5 },
  label: { fontWeight: "800", fontStyle: "italic", letterSpacing: 0.3 },
  labelSm: { fontSize: 9.5 },
  labelMd: { fontSize: 11 },
});
