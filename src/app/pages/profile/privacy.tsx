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
    <ProfileDetailShell title="Gizlilik">
      <SettingsSection>
        <SettingsToggle
          title="Profili liderlik tablosunda göster"
          subtitle="Diğerleri Anonim yerine adını görür"
          value={profile.privacy.profileVisibleOnLeaderboard}
          onValueChange={(value) =>
            setPrivacy({ profileVisibleOnLeaderboard: value })
          }
        />
        <SettingsToggle
          title="Antrenman istatistiklerini paylaş"
          value={profile.privacy.shareWorkoutStatistics}
          onValueChange={(value) =>
            setPrivacy({ shareWorkoutStatistics: value })
          }
        />
        <SettingsToggle
          title="Kişiselleştirilmiş öneriler"
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
