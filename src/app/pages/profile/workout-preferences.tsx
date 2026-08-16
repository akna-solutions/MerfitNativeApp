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
import { colors } from "./theme";

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
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
      title="Workout Preferences"
      footer={<OnboardingButton label="Save Changes" onPress={handleSave} />}
    >
      <Text style={styles.label}>Training Days</Text>
      <View style={styles.daysRow}>
        {WEEKDAYS.map((day) => {
          const active = trainingDays.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              style={[styles.dayPill, active && styles.dayPillActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                {day.charAt(0)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, styles.gapTop]}>Workout Duration</Text>
      {DURATION_OPTIONS.map((minutes) => (
        <OnboardingOption
          key={minutes}
          label={minutes === 90 ? "90+ min" : `${minutes} min`}
          selected={duration === minutes}
          onPress={() => setDuration(minutes)}
        />
      ))}

      <Text style={[styles.label, styles.gapTop]}>Experience Level</Text>
      {EXPERIENCE_OPTIONS.map((level) => (
        <OnboardingOption
          key={level}
          label={EXPERIENCE_LABELS[level]}
          selected={experience === level}
          onPress={() => setExperience(level)}
        />
      ))}

      <Text style={[styles.label, styles.gapTop]}>Equipment</Text>
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
    color: colors.textMuted,
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dayPillActive: { backgroundColor: colors.buttonElectricBlue },
  dayLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  dayLabelActive: { color: "#FFFFFF" },
});
