import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import {
    EXPERIENCE_LABELS,
    ExperienceLevel,
    TRAINING_LOCATION_LABELS,
    TrainingLocation,
    WEEKDAY_SHORT_LABELS,
    WEEKDAYS,
} from "../../../shared/profile/types";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { useTheme } from "../../../shared/theme/ThemeContext";

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
// Kayittaki FrequencyStep ile ayni secenekler.
const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6, 7];
const EXPERIENCE_OPTIONS: ExperienceLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];
const LOCATION_OPTIONS: TrainingLocation[] = ["gym", "home", "outdoor"];

export default function WorkoutPreferencesRoute() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfile();
  const { colors } = useTheme();

  const [daysPerWeek, setDaysPerWeek] = useState(profile.trainingDaysPerWeek);
  const [duration, setDuration] = useState(profile.workoutDurationMin);
  const [experience, setExperience] = useState<ExperienceLevel>(
    profile.experienceLevel,
  );
  const [location, setLocation] = useState<TrainingLocation | null>(
    profile.trainingLocation,
  );

  // bkz. edit.tsx - ekran profil yuklenmeden once acildiysa formu gercek verilerle senkronize et.
  useEffect(() => {
    if (isLoading) return;
    setDaysPerWeek(profile.trainingDaysPerWeek);
    setDuration(profile.workoutDurationMin);
    setExperience(profile.experienceLevel);
    setLocation(profile.trainingLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Gunler kullanici tarafindan secilmez; antrenman programi olusturulurken belirlenir.
  const planDays = WEEKDAYS.filter((day) => profile.trainingDays.includes(day));

  const handleSave = () => {
    updateProfile({
      ...(daysPerWeek > 0 ? { trainingDaysPerWeek: daysPerWeek } : {}),
      ...(duration > 0 ? { workoutDurationMin: duration } : {}),
      experienceLevel: experience,
      ...(location ? { trainingLocation: location } : {}),
    });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Antrenman Tercihleri"
      footer={<OnboardingButton label="Değişiklikleri Kaydet" onPress={handleSave} />}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Programındaki Günler</Text>
      {planDays.length > 0 ? (
        <View style={styles.daysRow}>
          {WEEKDAYS.map((day) => {
            const active = planDays.includes(day);
            return (
              <View
                key={day}
                style={[
                  styles.dayPill,
                  { backgroundColor: colors.inputBackground },
                  active && { backgroundColor: colors.primaryPressed },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: colors.textSecondary },
                    active && styles.dayLabelActive,
                  ]}
                >
                  {WEEKDAY_SHORT_LABELS[day]}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {planDays.length > 0
          ? "Bu günler antrenman programın oluşturulurken belirlendi."
          : "Antrenman programın hazırlandığında günlerin burada görünecek."}
      </Text>

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Haftalık Antrenman Sayısı</Text>
      {FREQUENCY_OPTIONS.map((count) => (
        <OnboardingOption
          key={count}
          label={count === 7 ? "Her gün" : `Haftada ${count} gün`}
          selected={daysPerWeek === count}
          onPress={() => setDaysPerWeek(count)}
        />
      ))}

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Antrenman Süresi</Text>
      {DURATION_OPTIONS.map((minutes) => (
        <OnboardingOption
          key={minutes}
          label={minutes === 90 ? "90+ dk" : `${minutes} dk`}
          selected={duration === minutes}
          onPress={() => setDuration(minutes)}
        />
      ))}

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Deneyim Seviyesi</Text>
      {EXPERIENCE_OPTIONS.map((level) => (
        <OnboardingOption
          key={level}
          label={EXPERIENCE_LABELS[level]}
          selected={experience === level}
          onPress={() => setExperience(level)}
        />
      ))}

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Antrenman Yeri</Text>
      {LOCATION_OPTIONS.map((option) => (
        <OnboardingOption
          key={option}
          label={TRAINING_LOCATION_LABELS[option]}
          selected={location === option}
          onPress={() => setLocation(option)}
        />
      ))}
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
  },
  gapTop: { marginTop: 24 },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { fontSize: 12, fontWeight: "700" },
  dayLabelActive: { color: "#FFFFFF" },
  hint: { fontSize: 12, marginTop: 10, lineHeight: 17 },
});
