import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { SettingsToggle } from "../../../shared/profile/components/SettingsToggle";
import { useProfile } from "../../../shared/profile/ProfileContext";

export default function PrivacyRoute() {
  const { profile, updateProfile } = useProfile();

  const setPrivacy = (patch: Partial<typeof profile.privacy>) => {
    updateProfile({ privacy: { ...profile.privacy, ...patch } });
  };

  return (
    <ProfileDetailShell title="Privacy">
      <SettingsSection>
        <SettingsToggle
          title="Show profile on leaderboard"
          subtitle="Others see your name instead of Anonymous"
          value={profile.privacy.profileVisibleOnLeaderboard}
          onValueChange={(value) =>
            setPrivacy({ profileVisibleOnLeaderboard: value })
          }
        />
        <SettingsToggle
          title="Share workout statistics"
          value={profile.privacy.shareWorkoutStatistics}
          onValueChange={(value) =>
            setPrivacy({ shareWorkoutStatistics: value })
          }
        />
        <SettingsToggle
          title="Personalized recommendations"
          value={profile.privacy.personalizedRecommendations}
          onValueChange={(value) =>
            setPrivacy({ personalizedRecommendations: value })
          }
          isLast
        />
      </SettingsSection>
    </ProfileDetailShell>
  );
}
