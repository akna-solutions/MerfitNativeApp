import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";
import { useTheme } from "../../../shared/theme/ThemeContext";

export default function BodyMeasurementsRoute() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { colors } = useTheme();

  const [height, setHeight] = useState(`${profile.height}`);
  const [weight, setWeight] = useState(`${profile.weight}`);
  const [targetWeight, setTargetWeight] = useState(`${profile.targetWeight}`);

  const heightUnit = profile.unitSystem === "metric" ? "cm" : "ft";
  const weightUnit = profile.unitSystem === "metric" ? "kg" : "lb";

  const handleSave = () => {
    updateProfile({
      height: parseFloat(height) || profile.height,
      weight: parseFloat(weight) || profile.weight,
      targetWeight: parseFloat(targetWeight) || profile.targetWeight,
    });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Vücut Ölçümleri"
      footer={<OnboardingButton label="Değişiklikleri Kaydet" onPress={handleSave} />}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Boy ({heightUnit})</Text>
      <OnboardingInput
        value={height}
        onChangeText={(text) => setHeight(text.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Kilo ({weightUnit})</Text>
      <OnboardingInput
        value={weight}
        onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>
        Hedef Kilo ({weightUnit})
      </Text>
      <OnboardingInput
        value={targetWeight}
        onChangeText={(text) => setTargetWeight(text.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        style={styles.input}
      />
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  gapTop: { marginTop: 20 },
  input: { fontSize: 20, fontWeight: "700" },
});
