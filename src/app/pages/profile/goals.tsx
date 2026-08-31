import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { Goal, GOAL_LABELS } from "../../../shared/profile/types";
import { OnboardingOption } from "../onboarding/components/OnboardingOption";

const GOAL_OPTIONS: Goal[] = [
  "LOSE_WEIGHT",
  "BUILD_MUSCLE",
  "MAINTAIN_WEIGHT",
  "IMPROVE_ENDURANCE",
  "GET_STRONGER",
  "GENERAL_FITNESS",
];

export default function GoalsRoute() {
  const { profile, updateProfile } = useProfile();

  return (
    <ProfileDetailShell title="Hedefler" subtitle="Ana fitness hedefini seç">
      {GOAL_OPTIONS.map((goal) => (
        <OnboardingOption
          key={goal}
          label={GOAL_LABELS[goal]}
          selected={profile.goal === goal}
          onPress={() => updateProfile({ goal })}
        />
      ))}
    </ProfileDetailShell>
  );
}
