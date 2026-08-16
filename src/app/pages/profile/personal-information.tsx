import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { Gender } from "../../../shared/profile/types";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { colors } from "./theme";

const GENDER_OPTIONS: Gender[] = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];

export default function PersonalInformationRoute() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [age, setAge] = useState(`${profile.age}`);
  const [gender, setGender] = useState<Gender>(profile.gender);

  const handleSave = () => {
    updateProfile({ firstName, age: parseInt(age, 10) || profile.age, gender });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Personal Information"
      footer={<OnboardingButton label="Save Changes" onPress={handleSave} />}
    >
      <Text style={styles.label}>Name</Text>
      <OnboardingInput
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop]}>Age</Text>
      <OnboardingInput
        value={age}
        onChangeText={(text) => setAge(text.replace(/[^0-9]/g, "").slice(0, 3))}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop]}>Gender</Text>
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
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  gapTop: { marginTop: 20 },
  input: { fontSize: 15, fontWeight: "600" },
});
