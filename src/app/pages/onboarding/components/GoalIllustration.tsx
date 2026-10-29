import { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

import { PrimaryFitnessGoalCode, normalizeFitnessGoal } from "../../../../services/api/types";
import { useReducedMotion } from "../../../../shared/motion/useReducedMotion";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Goal } from "../types";

/**
 * "Ana hedefin nedir?" adiminda secilen hedefe gore degisen ozgun vektorel ayicik animasyonu.
 * Gorseller tamamen kodla cizilir (harici asset yok). Hareket, ayni SVG'nin katmanlarinin
 * Animated.View ile kaydirilmasiyla verilir; "Hareketi azalt" acikken sahne durgun kalir.
 */

const VIEW_W = 200;
const VIEW_H = 140;

const BEAR = "#B07A4A";
const BEAR_DARK = "#8A5A33";
const MUZZLE = "#E8C9A6";
const INK = "#1A1C22";
const STEEL = "#5B6270";
const PLATE = "#2B2F38";

/** Kisa, sonuc vaat etmeyen aciklamalar. */
export const GOAL_ILLUSTRATION_TEXT: Record<PrimaryFitnessGoalCode, { title: string; text: string }> = {
  build_muscle: {
    title: "Kas geliştirme",
    text: "Hacim odaklı antrenmanlar ve yeterli proteinle kas gelişimini desteklemeye odaklanırız.",
  },
  get_stronger: {
    title: "Güçlenme",
    text: "Temel hareketlerde tekniği koruyarak ağırlığı adım adım artırmaya odaklanırız.",
  },
  lose_weight: {
    title: "Yağ kaybı",
    text: "Kuvvet antrenmanı, kardiyo ve dengeli beslenmeyle kas kütleni korumayı hedefleriz.",
  },
};

const BearHead = memo(function BearHead({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx - r * 0.7} cy={cy - r * 0.75} r={r * 0.38} fill={BEAR} />
      <Circle cx={cx + r * 0.7} cy={cy - r * 0.75} r={r * 0.38} fill={BEAR} />
      <Circle cx={cx - r * 0.7} cy={cy - r * 0.75} r={r * 0.2} fill={MUZZLE} />
      <Circle cx={cx + r * 0.7} cy={cy - r * 0.75} r={r * 0.2} fill={MUZZLE} />
      <Circle cx={cx} cy={cy} r={r} fill={BEAR} />
      <Rect x={cx - r * 0.95} y={cy - r * 0.62} width={r * 1.9} height={r * 0.28} rx={r * 0.14} fill="#3E7BFA" />
      <Ellipse cx={cx} cy={cy + r * 0.35} rx={r * 0.48} ry={r * 0.36} fill={MUZZLE} />
      <Circle cx={cx - r * 0.38} cy={cy - r * 0.05} r={r * 0.12} fill={INK} />
      <Circle cx={cx + r * 0.38} cy={cy - r * 0.05} r={r * 0.12} fill={INK} />
      <Circle cx={cx - r * 0.34} cy={cy - r * 0.09} r={r * 0.04} fill="#FFFFFF" />
      <Circle cx={cx + r * 0.42} cy={cy - r * 0.09} r={r * 0.04} fill="#FFFFFF" />
      <Ellipse cx={cx} cy={cy + r * 0.22} rx={r * 0.14} ry={r * 0.1} fill={INK} />
      <Path d={`M${cx - r * 0.16} ${cy + r * 0.42} Q${cx} ${cy + r * 0.56} ${cx + r * 0.16} ${cy + r * 0.42}`} stroke={INK} strokeWidth={r * 0.08} strokeLinecap="round" fill="none" />
      <Circle cx={cx - r * 0.62} cy={cy + r * 0.3} r={r * 0.12} fill="#F29C9C" opacity={0.6} />
      <Circle cx={cx + r * 0.62} cy={cy + r * 0.3} r={r * 0.12} fill="#F29C9C" opacity={0.6} />
    </G>
  );
});

function Barbell({ y, x1, x2 }: { y: number; x1: number; x2: number }) {
  return (
    <G>
      <Line x1={x1} y1={y} x2={x2} y2={y} stroke={STEEL} strokeWidth={4} strokeLinecap="round" />
      <Rect x={x1 + 2} y={y - 13} width={8} height={26} rx={2} fill={PLATE} />
      <Rect x={x1 + 11} y={y - 9} width={6} height={18} rx={2} fill={PLATE} />
      <Rect x={x2 - 10} y={y - 13} width={8} height={26} rx={2} fill={PLATE} />
      <Rect x={x2 - 17} y={y - 9} width={6} height={18} rx={2} fill={PLATE} />
    </G>
  );
}

/** Ust uste binen uc SVG katmani: arka (sabit), hareketli, on (sabit). */
function Layers({
  back, moving, front, movingStyle,
}: { back: React.ReactNode; moving: React.ReactNode; front: React.ReactNode; movingStyle: object }) {
  const svg = (children: React.ReactNode) => (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>{children}</Svg>
  );
  return (
    <View style={styles.stage}>
      <View style={StyleSheet.absoluteFill}>{svg(back)}</View>
      <Animated.View style={[StyleSheet.absoluteFill, movingStyle]}>{svg(moving)}</Animated.View>
      <View style={StyleSheet.absoluteFill}>{svg(front)}</View>
    </View>
  );
}

type Props = { goal: Goal | null };

export function GoalIllustration({ goal: rawGoal }: Props) {
  const { colors } = useTheme();
  // Eski hedef kodlari (backend ile ayni kuralla) ana hedeflerden birine eslenir.
  const goal = normalizeFitnessGoal(rawGoal);
  const reducedMotion = useReducedMotion();
  const cycle = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    cycle.setValue(0);
    if (reducedMotion) return;
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cycle, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(150),
        Animated.timing(cycle, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(250),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [goal, reducedMotion, cycle, appear]);

  // Sahne birimleri piksele: hareket mesafesi viewBox'a oranlanir.
  const shift = (units: number) => cycle.interpolate({ inputRange: [0, 1], outputRange: [0, units] });
  const floor = <Ellipse cx={100} cy={128} rx={70} ry={5} fill={colors.progressTrack} />;

  let scene: React.ReactNode;
  if (goal === "build_muscle") {
    // Bench press: sirt ustu yatan ayicik, bar gogusten yukari itilir.
    scene = (
      <Layers
        back={
          <G>
            {floor}
            <Rect x={52} y={92} width={110} height={8} rx={4} fill={colors.border} />
            <Rect x={62} y={100} width={6} height={26} rx={2} fill={colors.border} />
            <Rect x={146} y={100} width={6} height={26} rx={2} fill={colors.border} />
          </G>
        }
        moving={
          <G>
            <Rect x={93} y={34} width={9} height={52} rx={4.5} fill={BEAR_DARK} />
            <Rect x={113} y={34} width={9} height={52} rx={4.5} fill={BEAR_DARK} />
            <Barbell y={34} x1={60} x2={156} />
          </G>
        }
        front={
          <G>
            <Ellipse cx={112} cy={84} rx={40} ry={13} fill={BEAR} />
            <Ellipse cx={115} cy={82} rx={20} ry={7} fill={MUZZLE} opacity={0.55} />
            <Rect x={146} y={86} width={22} height={9} rx={4.5} fill={BEAR} />
            <BearHead cx={66} cy={74} r={15} />
          </G>
        }
        movingStyle={{ transform: [{ translateY: shift(-14) }] }}
      />
    );
  } else if (goal === "get_stronger") {
    // Overhead press: ayakta duran ayicik bari omuzdan basin ustune kaldirir.
    scene = (
      <Layers
        back={floor}
        moving={
          <G>
            <Rect x={78} y={56} width={9} height={40} rx={4.5} fill={BEAR_DARK} />
            <Rect x={113} y={56} width={9} height={40} rx={4.5} fill={BEAR_DARK} />
            <Barbell y={56} x1={46} x2={154} />
          </G>
        }
        front={
          <G>
            <Rect x={84} y={110} width={12} height={18} rx={6} fill={BEAR_DARK} />
            <Rect x={104} y={110} width={12} height={18} rx={6} fill={BEAR_DARK} />
            <Ellipse cx={100} cy={96} rx={25} ry={22} fill={BEAR} />
            <Ellipse cx={100} cy={100} rx={14} ry={12} fill={MUZZLE} opacity={0.55} />
            <BearHead cx={100} cy={62} r={17} />
          </G>
        }
        movingStyle={{ transform: [{ translateY: shift(-30) }] }}
      />
    );
  } else if (goal === "lose_weight") {
    // Kosu: ayicik hafifce ziplar, hiz cizgileri geriye akar.
    scene = (
      <Layers
        back={
          <G>
            {floor}
            <Path d="M24 70 H52 M16 86 H46 M30 102 H56" stroke={colors.borderActive} strokeWidth={4} strokeLinecap="round" />
            <Path d="M140 30 h10 l5 -9 l7 18 l5 -9 h10" stroke="#EF4444" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </G>
        }
        moving={
          <G>
            <Rect x={88} y={104} width={11} height={22} rx={5.5} fill={BEAR_DARK} transform="rotate(25 93 104)" />
            <Rect x={106} y={104} width={11} height={22} rx={5.5} fill={BEAR_DARK} transform="rotate(-30 111 104)" />
            <Rect x={74} y={80} width={9} height={24} rx={4.5} fill={BEAR_DARK} transform="rotate(40 78 80)" />
            <Rect x={120} y={80} width={9} height={24} rx={4.5} fill={BEAR_DARK} transform="rotate(-45 124 80)" />
            <Ellipse cx={102} cy={92} rx={24} ry={20} fill={BEAR} />
            <Ellipse cx={102} cy={96} rx={13} ry={11} fill={MUZZLE} opacity={0.55} />
            <BearHead cx={104} cy={60} r={17} />
          </G>
        }
        front={null}
        movingStyle={{ transform: [{ translateY: shift(-6) }] }}
      />
    );
  } else {
    // Hedef secilmeden once: el sallayan ayicik.
    scene = (
      <Layers
        back={floor}
        moving={null}
        front={
          <G>
            <Rect x={84} y={110} width={12} height={18} rx={6} fill={BEAR_DARK} />
            <Rect x={104} y={110} width={12} height={18} rx={6} fill={BEAR_DARK} />
            <Rect x={122} y={62} width={9} height={30} rx={4.5} fill={BEAR_DARK} transform="rotate(30 126 92)" />
            <Ellipse cx={100} cy={96} rx={25} ry={22} fill={BEAR} />
            <Ellipse cx={100} cy={100} rx={14} ry={12} fill={MUZZLE} opacity={0.55} />
            <BearHead cx={100} cy={62} r={17} />
          </G>
        }
        movingStyle={{}}
      />
    );
  }

  const copy = goal ? GOAL_ILLUSTRATION_TEXT[goal] : null;

  return (
    <View
      testID="goal-illustration"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessible
      accessibilityLabel={copy ? `${copy.title}: ${copy.text}` : "Hedefini seç; sana uygun programı hazırlayalım."}
    >
      <Animated.View testID={`goal-illustration-${goal ?? "none"}`} style={[styles.stageWrap, { opacity: appear }]}>
        {scene}
      </Animated.View>
      <Text style={[styles.text, { color: copy ? colors.text : colors.textSecondary }]}>
        {copy ? copy.text : "Hedefini seç; sana uygun programı hazırlayalım."}
      </Text>
      <Text style={[styles.note, { color: colors.textSecondary }]}>Sonuçlar kişiden kişiye değişir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 16, alignItems: "center" },
  stageWrap: { width: "100%", maxWidth: 260, aspectRatio: VIEW_W / VIEW_H },
  stage: { flex: 1 },
  text: { fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 6 },
  note: { fontSize: 10, marginTop: 4 },
});
