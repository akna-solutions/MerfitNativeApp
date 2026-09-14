import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Kare check yerine yuvarlak tik göstermek istersen (multi-select equipment gibi) */
  shape?: "radio" | "check";
};

export function OnboardingOption({
  label,
  subtitle,
  selected,
  onPress,
  shape = "radio",
}: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.card },
        selected && { borderColor: colors.borderActive, backgroundColor: colors.cardActive },
      ]}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.indicator,
          { borderColor: colors.border },
          shape === "check" && styles.indicatorSquare,
          selected && { borderColor: colors.primary, backgroundColor: colors.primary },
        ]}
      >
        {selected ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  textBlock: { flex: 1, paddingRight: 12 },
  label: { fontSize: 15, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 3 },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorSquare: { borderRadius: 6 },
  checkmark: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
