import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { EnergyDay } from "../../../../services/api/energyBalance";
import { balanceLabel, formatSignedKcal, toneColor } from "../../../../shared/energy/energy";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  /** Bugunun kalori dengesi (sunucu hesabi; bekleyen adimlar withLiveSteps ile eklenmis olabilir). */
  day: EnergyDay | null;
  loading: boolean;
  error: boolean;
  onPress: () => void;
};

const SIZE = 92;
const STROKE = 9;

const tr = (value: number) => Math.round(value).toLocaleString("tr-TR");

/**
 * Ana sayfada "Antrenmana Başla" kartinin yanindaki yarim genislikli kalori dengesi karti. Halka alinan kalorinin
 * gunluk hedefe oranidir; ortada kalan kalori yazar. Altinda alinan, harcanan ve gunun dengesi (renk: hedefe gore
 * durum) gosterilir. Dokununca ayrintili kalori analizi acilir.
 */
export function CalorieBalanceCard({ day, loading, error, onPress }: Props) {
  const { colors } = useTheme();
  const target = day?.targetCalories ?? null;
  const intake = day?.intakeCalories ?? 0;
  const ratio = target && target > 0 ? Math.min(1, intake / target) : 0;
  const tone = day ? toneColor(day.tone, colors) : colors.primary;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = day?.remainingCalories ?? null;

  const label = loading
    ? "Kalori dengesi yükleniyor"
    : error || !day
      ? "Kalori dengesi alınamadı. Ayrıntılar için dokun"
      : `Bugün ${tr(intake)} kcal alındı, ${day.expenditureCalories === null ? "harcanan hesaplanamadı" : `${tr(day.expenditureCalories)} kcal harcandı`}, denge ${formatSignedKcal(day.balance)}`;

  return (
    <Pressable
      testID="calorie-balance-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Text style={[styles.badge, { color: colors.textSecondary }]}>KALORİ DENGESİ</Text>

      <View style={styles.ringWrap}>
        {loading ? (
          <DumbbellSpinner color={colors.primary} />
        ) : (
          <>
            <Svg width={SIZE} height={SIZE}>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={radius} stroke={colors.progressTrack} strokeWidth={STROKE} fill="none" />
              {ratio > 0 ? (
                <Circle
                  testID="calorie-balance-progress"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={radius}
                  stroke={colors.primary}
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
              <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {error || !day ? "—" : remaining !== null ? tr(Math.abs(remaining)) : tr(intake)}
              </Text>
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                {error || !day ? "kcal" : remaining === null ? "kcal alındı" : remaining >= 0 ? "kcal kaldı" : "kcal aşıldı"}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.rows}>
        <Row label="Alınan" value={error || !day ? "—" : tr(intake)} />
        <Row
          label="Harcanan"
          value={error || !day || day.expenditureCalories === null ? "—" : tr(day.expenditureCalories)}
        />
        <View
          style={[styles.balancePill, { backgroundColor: colors.inputBackground }]}
          testID="calorie-balance-pill"
        >
          <View style={[styles.dot, { backgroundColor: tone }]} />
          <Text style={[styles.balanceText, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {error || !day ? "Veri alınamadı" : day.balance === null ? "Profil eksik" : formatSignedKcal(day.balance)}
          </Text>
        </View>
        {day && !error ? (
          <Text style={[styles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {day.balance === null ? "Harcanan hesaplanamadı" : balanceLabel(day.balance)}
            {target ? ` · hedef ${tr(target)}` : ""}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
        {value}
        <Text style={[styles.rowUnit, { color: colors.textSecondary }]}> kcal</Text>
      </Text>
    </View>
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
  ringWrap: { alignItems: "center", justifyContent: "center", height: SIZE, marginVertical: 4 },
  ringCenter: { position: "absolute", alignItems: "center", width: SIZE - STROKE * 2 - 4 },
  value: { fontSize: 18, fontWeight: "800" },
  unit: { fontSize: 9, marginTop: 1 },
  rows: { gap: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  rowLabel: { fontSize: 11, fontWeight: "600" },
  rowValue: { fontSize: 12, fontWeight: "800" },
  rowUnit: { fontSize: 10, fontWeight: "600" },
  balancePill: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  balanceText: { flex: 1, fontSize: 13, fontWeight: "800" },
  caption: { fontSize: 10, textAlign: "center", marginTop: 1 },
});
