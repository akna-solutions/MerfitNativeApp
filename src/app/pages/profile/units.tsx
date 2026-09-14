import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { useTheme } from "../../../shared/theme/ThemeContext";
import type { ThemeTokens } from "../../../shared/theme/tokens";

export default function UnitsRoute() {
  const { profile, updateProfile } = useProfile();
  const { colors } = useTheme();
  const isMetric = profile.unitSystem === "metric";

  return (
    <ProfileDetailShell title="Birimler">
      <OnboardingOption
        label="Metrik"
        subtitle="kg · cm · km"
        selected={isMetric}
        onPress={() => updateProfile({ unitSystem: "metric" })}
      />
      <OnboardingOption
        label="İngiliz"
        subtitle="lb · ft · mi"
        selected={!isMetric}
        onPress={() => updateProfile({ unitSystem: "imperial" })}
      />

      <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <PreviewRow label="Kilo" value={isMetric ? "kg" : "lb"} colors={colors} />
        <PreviewRow label="Boy" value={isMetric ? "cm" : "ft"} colors={colors} />
        <PreviewRow label="Enerji" value="kcal" isLast colors={colors} />
      </View>
    </ProfileDetailShell>
  );
}

function PreviewRow({
  label,
  value,
  isLast,
  colors,
}: {
  label: string;
  value: string;
  isLast?: boolean;
  colors: ThemeTokens;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, isLast && styles.rowLast]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    marginTop: 24,
    borderRadius: 20,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: "700" },
});
