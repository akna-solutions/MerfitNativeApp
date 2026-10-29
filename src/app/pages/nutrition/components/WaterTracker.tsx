import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

const SEGMENT_LITERS = 0.5;

/** Tek dokunusla eklenebilen miktarlar (ml). */
export const WATER_QUICK_AMOUNTS_ML = [250, 500] as const;

type Props = {
  consumedL: number;
  targetL: number;
  onAdd: (amountMl: number) => void;
  /** Istek surerken butonlar pasif olur. */
  busy?: boolean;
};

export function WaterTracker({ consumedL, targetL, onAdd, busy = false }: Props) {
  const { colors } = useTheme();
  const totalSegments = Math.max(1, Math.round(targetL / SEGMENT_LITERS));
  const filledSegments = Math.min(
    totalSegments,
    Math.round(consumedL / SEGMENT_LITERS),
  );

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Su</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summary}>
          <Text style={[styles.amount, { color: colors.text }]}>
            {consumedL.toFixed(1)}
            <Text style={[styles.target, { color: colors.textSecondary }]}> / {targetL.toFixed(1)} L</Text>
          </Text>
          <Ionicons name="water" size={28} color={colors.primary} />
        </View>

        <View style={styles.row}>
          {Array.from({ length: totalSegments }).map((_, index) => (
            <Ionicons
              key={index}
              name={index < filledSegments ? "water" : "water-outline"}
              size={22}
              color={index < filledSegments ? colors.primary : colors.textSecondary}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {WATER_QUICK_AMOUNTS_ML.map((amount) => (
            <Pressable
              key={amount}
              testID={`water-add-${amount}`}
              accessibilityRole="button"
              accessibilityLabel={`${amount} mililitre su ekle`}
              disabled={busy}
              onPress={() => onAdd(amount)}
              style={[styles.addButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addLabel}>{amount} ml</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amount: { fontSize: 30, fontWeight: "700" },
  target: { fontSize: 15, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 18 },
  addButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
