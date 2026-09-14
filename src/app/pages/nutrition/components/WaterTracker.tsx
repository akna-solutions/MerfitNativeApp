import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

const SEGMENT_LITERS = 0.5;

type Props = {
  consumedL: number;
  targetL: number;
  onAdd: () => void;
};

export function WaterTracker({ consumedL, targetL, onAdd }: Props) {
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
        <View style={styles.row}>
          {Array.from({ length: totalSegments }).map((_, index) => (
            <Pressable key={index} onPress={onAdd} hitSlop={4}>
              <Ionicons
                name={index < filledSegments ? "water" : "water-outline"}
                size={20}
                color={
                  index < filledSegments
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.amount, { color: colors.text }]}>
            {consumedL.toFixed(1)} / {targetL.toFixed(1)} L
          </Text>
          <Pressable onPress={onAdd} style={[styles.addButton, { backgroundColor: colors.cardActive }]} hitSlop={8}>
            <Text style={[styles.addLabel, { color: colors.primary }]}>+ 250 ml</Text>
          </Pressable>
        </View>
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  amount: { fontSize: 13, fontWeight: "700" },
  addButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: { fontSize: 12, fontWeight: "700" },
});
