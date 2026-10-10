import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import {
  WORKOUT_ATTRIBUTE_MAX_SCORE,
  WORKOUT_ATTRIBUTE_META,
  WorkoutAttributeScore,
} from "./attributes";

type Props = {
  /** normalizeWorkoutAttributeScores ciktisi; yalnizca backend'in gercekten dondurdugu puanlar. */
  scores: readonly WorkoutAttributeScore[];
  /** Kart icinde kullanim icin baslik/aciklama metnini gizler. */
  compact?: boolean;
};

/**
 * Antrenmanin katalog ozellik puanlarini (0-100) yatay cubuklarla gosterir. Puan yoksa hic
 * render etmez. Puanlar kullanicinin kisisel basarisini degil antrenmanin karakterini anlatir.
 */
export function WorkoutAttributeBars({ scores, compact = false }: Props) {
  const { colors } = useTheme();
  if (scores.length === 0) return null;

  return (
    <View style={styles.container}>
      {compact ? null : (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Antrenman özellikleri</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Bu antrenmanın hangi alanlara ne kadar odaklandığını gösterir.
          </Text>
        </>
      )}

      {scores.map(({ type, score }) => {
        const meta = WORKOUT_ATTRIBUTE_META[type];
        return (
          <View
            key={type}
            style={styles.row}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${meta.label}: ${WORKOUT_ATTRIBUTE_MAX_SCORE} üzerinden ${score}`}
            accessibilityValue={{ min: 0, max: WORKOUT_ATTRIBUTE_MAX_SCORE, now: score }}
          >
            <View style={styles.labelRow}>
              <Ionicons name={meta.icon} size={14} color={colors.icon} />
              <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
                {meta.label}
              </Text>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{score}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.primary,
                    width: `${(score / WORKOUT_ATTRIBUTE_MAX_SCORE) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 12, marginTop: -6 },
  row: { gap: 6 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { flex: 1, fontSize: 13, fontWeight: "600" },
  value: { fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
});
