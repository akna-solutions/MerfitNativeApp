import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { Gender } from "../../../shared/profile/types";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { useTheme } from "../../../shared/theme/ThemeContext";

const GENDER_OPTIONS: Gender[] = [
  "Erkek",
  "Kadın",
  "Diğer",
  "Belirtmek istemiyorum",
];

export default function PersonalInformationRoute() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [age, setAge] = useState(`${profile.age}`);
  const [gender, setGender] = useState<Gender>(profile.gender);

  const handleSave = () => {
    updateProfile({ firstName, age: parseInt(age, 10) || profile.age, gender });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Kişisel Bilgiler"
      footer={<OnboardingButton label="Değişiklikleri Kaydet" onPress={handleSave} />}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Ad</Text>
      <OnboardingInput
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Yaş</Text>
      <OnboardingInput
        value={age}
        onChangeText={(text) => setAge(text.replace(/[^0-9]/g, "").slice(0, 3))}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Cinsiyet</Text>
      <View>
        {GENDER_OPTIONS.map((option) => (
          <OnboardingOption
            key={option}
            label={option}
            selected={gender === option}
            onPress={() => setGender(option)}
          />
        ))}
      </View>
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
  input: { fontSize: 15, fontWeight: "600" },
});
