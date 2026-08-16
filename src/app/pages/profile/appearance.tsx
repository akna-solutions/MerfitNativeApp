import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { AppearanceMode } from "../../../shared/profile/types";
import { colors } from "./theme";

const OPTIONS: { value: AppearanceMode; label: string; enabled: boolean }[] = [
  { value: "dark", label: "Dark", enabled: true },
  { value: "light", label: "Light", enabled: false },
  { value: "system", label: "System", enabled: false },
];

export default function AppearanceRoute() {
  const { profile, updateProfile } = useProfile();

  return (
    <ProfileDetailShell
      title="Appearance"
      subtitle="MERFIT currently supports Dark mode."
    >
      {OPTIONS.map((option) => {
        const selected = profile.appearance === option.value;
        return (
          <Pressable
            key={option.value}
            disabled={!option.enabled}
            onPress={() => updateProfile({ appearance: option.value })}
            style={[
              styles.card,
              selected && styles.cardActive,
              !option.enabled && styles.cardDisabled,
            ]}
          >
            <Text
              style={[styles.label, !option.enabled && styles.labelDisabled]}
            >
              {option.label}
            </Text>
            {option.enabled ? (
              <View
                style={[styles.indicator, selected && styles.indicatorActive]}
              />
            ) : (
              <View style={styles.soonBadge}>
                <Text style={styles.soonLabel}>Soon</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ProfileDetailShell>
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
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: "rgba(0,168,255,0.55)",
    backgroundColor: colors.cardBackgroundActive,
  },
  cardDisabled: { opacity: 0.5 },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  labelDisabled: { color: colors.textMuted },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  indicatorActive: {
    borderColor: colors.electricBlue,
    backgroundColor: colors.electricBlue,
  },
  soonBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  soonLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
});
