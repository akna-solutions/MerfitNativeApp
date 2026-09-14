import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import {
    Equipment,
    EQUIPMENT_LABELS,
    EXPERIENCE_LABELS,
    ExperienceLevel,
    Weekday,
    WEEKDAYS,
} from "../../../shared/profile/types";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";
import { useTheme } from "../../../shared/theme/ThemeContext";

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const DAY_LABELS: Record<Weekday, string> = {
  Mon: "Pt",
  Tue: "Sa",
  Wed: "Ça",
  Thu: "Pe",
  Fri: "Cu",
  Sat: "Ct",
  Sun: "Pz",
};
const EXPERIENCE_OPTIONS: ExperienceLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];
const EQUIPMENT_OPTIONS: Equipment[] = [
  "FULL_GYM",
  "HOME_GYM",
  "BODYWEIGHT",
  "MINIMAL_EQUIPMENT",
];

export default function WorkoutPreferencesRoute() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { colors } = useTheme();

  const [trainingDays, setTrainingDays] = useState<Weekday[]>(
    profile.trainingDays,
  );
  const [duration, setDuration] = useState(profile.workoutDurationMin);
  const [experience, setExperience] = useState<ExperienceLevel>(
    profile.experienceLevel,
  );
  const [equipment, setEquipment] = useState<Equipment>(profile.equipment);

  const toggleDay = (day: Weekday) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  };

  const handleSave = () => {
    updateProfile({
      trainingDays,
      workoutDurationMin: duration,
      experienceLevel: experience,
      equipment,
    });
    router.back();
  };

  return (
    <ProfileDetailShell
      title="Antrenman Tercihleri"
      footer={<OnboardingButton label="Değişiklikleri Kaydet" onPress={handleSave} />}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Antrenman Günleri</Text>
      <View style={styles.daysRow}>
        {WEEKDAYS.map((day) => {
          const active = trainingDays.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
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
                {DAY_LABELS[day]}
              </Text>
            </Pressable>
          );
        })}
      </View>

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

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Ekipman</Text>
      {EQUIPMENT_OPTIONS.map((option) => (
        <OnboardingOption
          key={option}
          label={EQUIPMENT_LABELS[option]}
          selected={equipment === option}
          onPress={() => setEquipment(option)}
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
});
