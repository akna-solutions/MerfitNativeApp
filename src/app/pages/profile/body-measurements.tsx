import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";
import { useTheme } from "../../../shared/theme/ThemeContext";

export default function BodyMeasurementsRoute() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfile();
  const { colors } = useTheme();

  // 0 = backend'de kayitli deger yok; kutuyu bos gosteririz (sahte "0" yerine).
  const toInput = (value: number) => (value > 0 ? `${value}` : "");
  const [height, setHeight] = useState(toInput(profile.height));
  const [weight, setWeight] = useState(toInput(profile.weight));
  const [targetWeight, setTargetWeight] = useState(toInput(profile.targetWeight));

  // bkz. edit.tsx - ekran profil yuklenmeden once acildiysa formu gercek verilerle senkronize et.
  useEffect(() => {
    if (isLoading) return;
    setHeight(toInput(profile.height));
    setWeight(toInput(profile.weight));
    setTargetWeight(toInput(profile.targetWeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const heightUnit = profile.unitSystem === "metric" ? "cm" : "ft";
  const weightUnit = profile.unitSystem === "metric" ? "kg" : "lb";

  const handleSave = () => {
    // Yalnizca gecerli (pozitif) degerler gonderilir; bos birakilan alan degistirilmez.
    const patch: { height?: number; weight?: number; targetWeight?: number } = {};
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const t = parseFloat(targetWeight);
    if (h > 0) patch.height = h;
    if (w > 0) patch.weight = w;
    if (t > 0) patch.targetWeight = t;
    updateProfile(patch);
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
        placeholder="Belirlenmedi"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Hedef kilon, hedefine (kilo verme, kas kazanma...) ve boyuna göre otomatik hesaplanır. Hedefini
        değiştirince yeniden hesaplanır; istersen buradan kendin de belirleyebilirsin.
      </Text>
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
  hint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  input: { fontSize: 20, fontWeight: "700" },
});
