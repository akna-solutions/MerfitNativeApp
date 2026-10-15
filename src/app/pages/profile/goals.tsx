import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { LowBodyFatWarningModal } from "../../../shared/bodyComposition/LowBodyFatWarningModal";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { Goal, GOAL_LABELS, normalizeGoal, PRIMARY_GOALS } from "../../../shared/profile/types";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";

const GOAL_SUBTITLES: Partial<Record<Goal, string>> = {
  BUILD_MUSCLE: "Kas kütleni artırmaya odaklan",
  GET_STRONGER: "Ana hareketlerde daha fazla ağırlık kaldır",
  LOSE_WEIGHT: "Kasını koruyarak yağ oranını azalt",
};

export default function GoalsRoute() {
  const { profile, changeGoal } = useProfile();
  const { colors } = useTheme();
  const [savingGoal, setSavingGoal] = useState<Goal | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ goal: Goal; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentGoal = normalizeGoal(profile.goal);

  const save = async (goal: Goal, confirmLowBodyFatWarning = false) => {
    setError(null);
    setSavingGoal(goal);
    const result = await changeGoal(goal, { confirmLowBodyFatWarning });
    setSavingGoal(null);
    if (result.status === "confirmationRequired") {
      // Hedef kaydedilmedi; kullanici iki secenekten birini acikca secer.
      setPendingConfirmation({ goal, message: result.message });
    } else if (result.status === "error") {
      setError(result.message);
    }
  };

  const handleSelect = (goal: Goal) => {
    if (savingGoal || goal === currentGoal) return;
    void save(goal);
  };

  const handleConfirm = () => {
    if (!pendingConfirmation) return;
    const { goal } = pendingConfirmation;
    setPendingConfirmation(null);
    void save(goal, true);
  };

  return (
    <ProfileDetailShell title="Hedefler" subtitle="Ana fitness hedefini seç">
      {PRIMARY_GOALS.map((goal) => (
        <OnboardingOption
          key={goal}
          label={GOAL_LABELS[goal]}
          subtitle={savingGoal === goal ? "Kaydediliyor..." : GOAL_SUBTITLES[goal]}
          selected={currentGoal === goal}
          onPress={() => handleSelect(goal)}
        />
      ))}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      <LowBodyFatWarningModal
        visible={pendingConfirmation !== null}
        message={pendingConfirmation?.message}
        onReconsider={() => setPendingConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 13, marginTop: 8 },
});
