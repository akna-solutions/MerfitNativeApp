import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { colors } from "./theme";

export default function UnitsRoute() {
  const { profile, updateProfile } = useProfile();
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

      <View style={styles.previewCard}>
        <PreviewRow label="Kilo" value={isMetric ? "kg" : "lb"} />
        <PreviewRow label="Boy" value={isMetric ? "cm" : "ft"} />
        <PreviewRow label="Enerji" value="kcal" isLast />
      </View>
    </ProfileDetailShell>
  );
}

function PreviewRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    marginTop: 24,
    borderRadius: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
});
