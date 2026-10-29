import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { CalendarDay } from "../../../../services/api/types";
import { RING_COLORS } from "../../../../shared/calendar/ringColors";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  /** Bugunun takvim kaydi; yuklenirken undefined. */
  today: CalendarDay | undefined;
  dailyTarget: number | null;
  loading: boolean;
  error: boolean;
  onPress: () => void;
};

const SIZE = 96;
const STROKE = 10;

/**
 * Ana sayfada "Antrenmana Başla" kartinin yanindaki yarim genislikli kalori takibi. Halka bugun
 * besinlerden ALINAN kalorinin gunluk hedefe oranidir; antrenmanda HARCANAN kalori ayri satirda yazilir.
 * Hedef hesaplanmamissa halka bos kalir ve yalnizca alinan kalori gosterilir.
 */
export function CalorieRingCard({ today, dailyTarget, loading, error, onPress }: Props) {
  const { colors } = useTheme();
  const consumed = today?.nutrition.consumedCalories ?? 0;
  const burned = today?.activity.caloriesBurned ?? 0;
  const ratio = dailyTarget && dailyTarget > 0 ? Math.min(1, consumed / dailyTarget) : 0;
  const goalMet = today?.nutrition.calorieGoalMet === true;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const label = loading
    ? "Kalori takibi yükleniyor"
    : error
      ? "Kalori verisi alınamadı. Beslenme ekranını aç"
      : dailyTarget
        ? `Bugün ${consumed} / ${dailyTarget} kcal alındı, antrenmanda ${burned} kcal yakıldı`
        : `Bugün ${consumed} kcal alındı, antrenmanda ${burned} kcal yakıldı`;

  return (
    <Pressable
      testID="calorie-ring-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Text style={[styles.badge, { color: colors.textSecondary }]}>KALORİ</Text>

      <View style={styles.ringWrap}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Svg width={SIZE} height={SIZE}>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={radius} stroke={colors.progressTrack} strokeWidth={STROKE} fill="none" />
              {ratio > 0 ? (
                <Circle
                  testID="calorie-ring-progress"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={radius}
                  stroke={RING_COLORS.nutrition}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference * (1 - ratio)}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              ) : null}
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={[styles.value, { color: colors.text }]}>{error ? "—" : consumed}</Text>
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                {dailyTarget && !error ? `/ ${dailyTarget}` : "kcal"}
              </Text>
            </View>
          </>
        )}
      </View>

      <View>
        <Text style={[styles.caption, { color: goalMet ? RING_COLORS.nutrition : colors.textSecondary }]} numberOfLines={1}>
          {error ? "Veri alınamadı" : goalMet ? "Hedef tamam ✓" : dailyTarget ? "Alınan kalori" : "Hedef hesaplanmadı"}
        </Text>
        <Text style={[styles.burned, { color: colors.textSecondary }]} numberOfLines={1}>
          Yakılan: <Text style={{ color: RING_COLORS.activity, fontWeight: "800" }}>{error ? "—" : burned}</Text> kcal
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 208,
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-between",
  },
  badge: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  ringWrap: { alignItems: "center", justifyContent: "center", height: SIZE, marginVertical: 6 },
  ringCenter: { position: "absolute", alignItems: "center" },
  value: { fontSize: 20, fontWeight: "800" },
  unit: { fontSize: 10, marginTop: 1 },
  caption: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  burned: { fontSize: 11, textAlign: "center", marginTop: 2 },
});
