import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { PrimaryFitnessGoalCode, normalizeFitnessGoal } from "../../../../services/api/types";
import { useReducedMotion } from "../../../../shared/motion/useReducedMotion";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Goal } from "../types";

/**
 * "Ana hedefin nedir?" adiminda secilen hedefe gore degisen sade ikon animasyonu: primary renkli
 * daire icinde hedef ikonu, etrafinda yavasca nefes alan halkalar. Hedef degisince ikon yumusakca
 * buyuyerek gelir; "Hareketi azalt" acikken sahne durgun kalir.
 */

const ICONS: Record<PrimaryFitnessGoalCode, keyof typeof MaterialCommunityIcons.glyphMap> = {
  build_muscle: "arm-flex",
  get_stronger: "weight-lifter",
  lose_weight: "run-fast",
};
const IDLE_ICON: keyof typeof MaterialCommunityIcons.glyphMap = "target";

const CORE = 84;
const RING_STEP = 26;

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

type Props = { goal: Goal | null };

export function GoalIllustration({ goal: rawGoal }: Props) {
  const { colors } = useTheme();
  // Eski hedef kodlari (backend ile ayni kuralla) ana hedeflerden birine eslenir.
  const goal = normalizeFitnessGoal(rawGoal);
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(1)).current;

  // Halkalarin nefes alma dongusu hedeften bagimsizdir; hedef degisince yeniden baslamaz.
  useEffect(() => {
    pulse.setValue(0);
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, pulse]);

  useEffect(() => {
    if (reducedMotion) {
      appear.setValue(1);
      return;
    }
    appear.setValue(0);
    Animated.spring(appear, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, [goal, reducedMotion, appear]);

  const copy = goal ? GOAL_ILLUSTRATION_TEXT[goal] : null;
  const active = goal !== null;
  const tint = active ? colors.primary : colors.textSecondary;

  return (
    <View
      testID="goal-illustration"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessible
      accessibilityLabel={copy ? `${copy.title}: ${copy.text}` : "Hedefini seç; sana uygun programı hazırlayalım."}
    >
      <View testID={`goal-illustration-${goal ?? "none"}`} style={styles.stage}>
        <View style={[styles.ring, ringSize(2), { borderColor: tint, opacity: 0.12 }]} />
        <View style={[styles.ring, ringSize(1), { borderColor: tint, opacity: 0.22 }]} />
        {active && !reducedMotion ? (
          <Animated.View
            style={[
              styles.ring,
              ringSize(0),
              {
                borderColor: colors.primary,
                borderWidth: 2,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }],
              },
            ]}
          />
        ) : null}
        <Animated.View
          style={[
            styles.core,
            {
              backgroundColor: active ? colors.primary : colors.inputBackground,
              shadowColor: colors.primary,
              shadowOpacity: active ? 0.55 : 0,
              opacity: appear.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
              transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            },
          ]}
        >
          <MaterialCommunityIcons name={goal ? ICONS[goal] : IDLE_ICON} size={42} color={active ? "#FFFFFF" : colors.textSecondary} />
        </Animated.View>
      </View>
      {copy ? <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text> : null}
      <Text style={[styles.text, { color: copy ? colors.text : colors.textSecondary }]}>
        {copy ? copy.text : "Hedefini seç; sana uygun programı hazırlayalım."}
      </Text>
      <Text style={[styles.note, { color: colors.textSecondary }]}>Sonuçlar kişiden kişiye değişir.</Text>
    </View>
  );
}

/** 0: ikon dairesiyle ayni boyda (nabiz halkasi), 1-2: sabit dis halkalar. */
function ringSize(level: number) {
  const size = CORE + RING_STEP * level * 1.5;
  return { width: size, height: size, borderRadius: size / 2 };
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 16, alignItems: "center" },
  stage: { width: "100%", height: CORE + RING_STEP * 3, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 1.5 },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 8,
  },
  title: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  text: { fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 4 },
  note: { fontSize: 10, marginTop: 4 },
});
