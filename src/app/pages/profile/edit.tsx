import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

export default function EditProfileRoute() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [gender, setGender] = useState<Gender>(profile.gender);

  const initial = firstName.trim().charAt(0).toUpperCase() || "M";

  const handleSave = () => {
    updateProfile({
      firstName,
      lastName,
      username,
      email,
      dateOfBirth,
      gender,
    });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Profili Düzenle"
      footer={<OnboardingButton label="Değişiklikleri Kaydet" onPress={handleSave} />}
    >
      <Pressable style={styles.avatarWrapper}>
        {/* TODO: expo-image-picker eklendiğinde kullanıcı galeriden fotoğraf seçebilecek. */}
        <View style={[styles.avatar, { backgroundColor: colors.primaryPressed }]}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <Text style={[styles.avatarHint, { color: colors.primary }]}>Fotoğrafı Değiştir</Text>
      </Pressable>

      <Field label="Ad">
        <OnboardingInput
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
        />
      </Field>
      <Field label="Soyad">
        <OnboardingInput
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
        />
      </Field>
      <Field label="Kullanıcı Adı">
        <OnboardingInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
        />
      </Field>
      <Field label="E-posta">
        <OnboardingInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
      </Field>
      <Field label="Doğum Tarihi">
        <OnboardingInput
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-AA-GG"
          style={styles.input}
        />
      </Field>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Cinsiyet</Text>
      <View style={styles.genderGap}>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,168,255,0.35)",
  },
  avatarLabel: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  avatarHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: { fontSize: 15, fontWeight: "600" },
  genderGap: { marginTop: 2 },
});
