import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  height: number;
  weight: number;
  age: number;
  onEditPress: () => void;
};

export function BodyStats({ height, weight, age, onEditPress }: Props) {
  const { colors } = useTheme();
  const bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0;

  const items = [
    { label: "Boy", value: `${height}`, unit: "cm" },
    { label: "Kilo", value: `${weight}`, unit: "kg" },
    { label: "Yaş", value: `${age}`, unit: "" },
    { label: "VKİ", value: bmi.toFixed(1), unit: "" },
  ];

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>İstatistiklerin</Text>
        <Pressable onPress={onEditPress} hitSlop={8}>
          <Text style={[styles.edit, { color: colors.primary }]}>Düzenle</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
              {item.unit ? <Text style={[styles.unit, { color: colors.textSecondary }]}> {item.unit}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  edit: { fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 11, fontWeight: "600" },
  valueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  value: { fontSize: 20, fontWeight: "700" },
  unit: { fontSize: 12, fontWeight: "600" },
});
