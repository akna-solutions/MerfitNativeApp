import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import {
    EXPERIENCE_LABELS,
    ExperienceLevel,
    TRAINING_LOCATION_LABELS,
    TrainingLocation,
    WEEKDAY_SHORT_LABELS,
    WEEKDAYS,
    Weekday,
} from "../../../shared/profile/types";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { useTheme } from "../../../shared/theme/ThemeContext";

const MIN_TRAINING_DAYS = 2;
const EXPERIENCE_OPTIONS: ExperienceLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];
const LOCATION_OPTIONS: TrainingLocation[] = ["gym", "home", "outdoor"];

const sameDays = (a: Weekday[], b: Weekday[]) =>
  a.length === b.length && a.every((day) => b.includes(day));

export default function WorkoutPreferencesRoute() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfile();
  const { colors } = useTheme();

  const [days, setDays] = useState<Weekday[]>(profile.trainingDays);
  const [experience, setExperience] = useState<ExperienceLevel>(
    profile.experienceLevel,
  );
  const [location, setLocation] = useState<TrainingLocation | null>(
    profile.trainingLocation,
  );

  // bkz. edit.tsx - ekran profil yuklenmeden once acildiysa formu gercek verilerle senkronize et.
  useEffect(() => {
    if (isLoading) return;
    setDays(profile.trainingDays);
    setExperience(profile.experienceLevel);
    setLocation(profile.trainingLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const toggleDay = (day: Weekday) =>
    setDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : WEEKDAYS.filter((d) => d === day || prev.includes(d)),
    );

  const daysChanged = !sameDays(days, profile.trainingDays);
  const tooFewDays = daysChanged && days.length < MIN_TRAINING_DAYS;
  const planChanged =
    daysChanged ||
    experience !== profile.experienceLevel ||
    location !== profile.trainingLocation;

  const handleSave = () => {
    if (tooFewDays) return;
    updateProfile({
      ...(daysChanged ? { trainingDays: days } : {}),
      experienceLevel: experience,
      ...(location ? { trainingLocation: location } : {}),
    });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Antrenman Tercihleri"
      footer={
        <OnboardingButton
          label="Değişiklikleri Kaydet"
          onPress={handleSave}
          disabled={tooFewDays}
        />
      }
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Antrenman Günleri</Text>
      <View style={styles.daysRow}>
        {WEEKDAYS.map((day) => {
          const active = days.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={WEEKDAY_SHORT_LABELS[day]}
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
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.hint, { color: tooFewDays ? colors.danger : colors.textSecondary }]}>
        {tooFewDays
          ? `En az ${MIN_TRAINING_DAYS} gün seçmelisin.`
          : days.length > 0
            ? `Haftada ${days.length} gün antrenman yapacaksın.`
            : "Antrenman yapmak istediğin günleri seç."}
      </Text>

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

      {planChanged ? (
        <Text style={[styles.hint, styles.gapTop, { color: colors.textSecondary }]}>
          Kaydettiğinde antrenman programın bu tercihlere göre yeniden hazırlanır.
        </Text>
      ) : null}
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
