import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { Gender, GENDER_OPTIONS } from "../../../shared/profile/types";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { useTheme } from "../../../shared/theme/ThemeContext";

export default function EditProfileRoute() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfile();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [age, setAge] = useState(profile.age > 0 ? `${profile.age}` : "");
  const [gender, setGender] = useState<Gender>(profile.gender);

  // Bu ekran, gercek profil GET /api/profile'dan donmeden ONCE (orn. kullanici cok hizli
  // navigasyon yaparsa) mount olabilir; o an useState(...) yukaridaki alanlari henuz bos olan
  // INITIAL_PROFILE_DATA ile doldurur. Fetch tamamlanip `profile` guncellendiginde (isLoading
  // false'a dustugunde) formu GERCEK degerlerle senkronize ediyoruz - aksi halde kullanici hicbir
  // seyi degistirmeden "Kaydet"e basarsa bos/varsayilan degerler (orn. username: "") sessizce
  // veritabanina yazilirdi (bkz. Faz raporu - profil guncelleme veri kaybi bug'i).
  useEffect(() => {
    if (isLoading) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setUsername(profile.username);
    setEmail(profile.email);
    setAge(profile.age > 0 ? `${profile.age}` : "");
    setGender(profile.gender);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const initial = firstName.trim().charAt(0).toUpperCase() || "M";

  const handleSave = () => {
    // Kayitta dogum tarihi degil yas soruluyor; bu yuzden burada da yas duzenlenir.
    const parsedAge = parseInt(age, 10);
    updateProfile({
      firstName,
      lastName,
      username,
      email,
      ...(parsedAge > 0 && parsedAge !== profile.age ? { age: parsedAge } : {}),
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
        {profile.emailConfirmed === false && email.trim().toLowerCase() === profile.email.trim().toLowerCase() ? (
          <Pressable
            onPress={() => router.push("/pages/auth/verify-email")}
            accessibilityRole="link"
            accessibilityLabel="E-posta adresin doğrulanmadı. Doğrula"
            hitSlop={8}
            style={styles.verifyRow}
          >
            <Text style={[styles.verifyText, { color: colors.textSecondary }]}>
              E-posta adresin doğrulanmadı.{" "}
              <Text style={[styles.verifyLink, { color: colors.primary }]}>Doğrula</Text>
            </Text>
          </Pressable>
        ) : null}
        {email.trim().toLowerCase() !== profile.email.trim().toLowerCase() && profile.email ? (
          <Text style={[styles.verifyText, styles.verifyRow, { color: colors.textSecondary }]}>
            E-posta adresini değiştirirsen uygulamaya devam etmeden önce yeni adresine gelen kodla doğrulaman gerekir.
          </Text>
        ) : null}
      </Field>
      <Field label="Yaş">
        <OnboardingInput
          value={age}
          onChangeText={(text) => setAge(text.replace(/[^0-9]/g, "").slice(0, 3))}
          keyboardType="number-pad"
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
  verifyRow: { marginTop: 8 },
  verifyText: { fontSize: 12, lineHeight: 17 },
  verifyLink: { fontWeight: "700" },
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
