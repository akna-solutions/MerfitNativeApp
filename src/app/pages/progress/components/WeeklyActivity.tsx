import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

const DAY_LABELS = ["P", "S", "Ç", "P", "C", "C", "P"];

type Props = {
  /** Pazartesiden baslayarak haftanin her gunu icin antrenman yapildi mi. */
  days: boolean[];
  /**
   * Aktif programdaki dinlenme gunleri (ayni sira). Verilirse bu gunler antrenman yapilsa bile mavi
   * gosterilmez ve sayac programdaki antrenman gunlerine gore yazilir. Program yoksa null.
   */
  restDays?: boolean[] | null;
};

export function WeeklyActivity({ days, restDays = null }: Props) {
  const { colors } = useTheme();
  const isRest = (index: number) => restDays?.[index] === true;
  const caption = restDays
    ? (() => {
        const planned = restDays.filter((rest) => !rest).length;
        const done = days.filter((completed, index) => completed && !isRest(index)).length;
        return `Bu hafta ${done} / ${planned} antrenman`;
      })()
    : `Bu hafta ${days.filter(Boolean).length} antrenman`;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bu Hafta</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          {days.map((completed, index) => {
            const rest = isRest(index);
            return (
              <View
                key={index}
                style={styles.dayColumn}
                accessible
                accessibilityLabel={`${DAY_LABELS[index]}: ${rest ? "dinlenme günü" : completed ? "antrenman yapıldı" : "antrenman yok"}`}
              >
                {rest ? (
                  <View testID={`weekly-rest-${index}`} style={[styles.dot, styles.restDot, { borderColor: colors.border }]}>
                    <Ionicons name="moon" size={11} color={colors.textSecondary} />
                  </View>
                ) : (
                  <View
                    testID={`weekly-day-${index}`}
                    style={[styles.dot, { backgroundColor: completed ? colors.primary : colors.inputBackground }]}
                  />
                )}
                <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{DAY_LABELS[index]}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text>
        {restDays ? (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Antrenman</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="moon" size={11} color={colors.textSecondary} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Dinlenme günü</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  dayColumn: { alignItems: "center", gap: 8 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  restDot: { borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  dayLabel: { fontSize: 11, fontWeight: "600" },
  caption: { fontSize: 12, marginTop: 16 },
  legend: { flexDirection: "row", gap: 16, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11 },
});
