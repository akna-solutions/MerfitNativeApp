import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { SettingsToggle } from "../../../shared/profile/components/SettingsToggle";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { NotificationSettings } from "../../../shared/profile/types";

const ROWS: { key: keyof NotificationSettings; title: string }[] = [
  { key: "workoutReminders", title: "Antrenman Hatırlatmaları" },
  { key: "dailyGoalReminder", title: "Günlük Hedef Hatırlatıcısı" },
  { key: "streakReminder", title: "Seri Hatırlatıcısı" },
  { key: "progressUpdates", title: "İlerleme Güncellemeleri" },
  { key: "leaderboardUpdates", title: "Liderlik Tablosu Güncellemeleri" },
  { key: "productUpdates", title: "Ürün Güncellemeleri" },
];

export default function NotificationsRoute() {
  const { profile, updateProfile } = useProfile();

  const setNotification = (key: keyof NotificationSettings, value: boolean) => {
    updateProfile({
      notifications: { ...profile.notifications, [key]: value },
    });
  };

  return (
    <ProfileDetailShell title="Bildirimler">
      <SettingsSection>
        {ROWS.map((row, index) => (
          <SettingsToggle
            key={row.key}
            title={row.title}
            value={profile.notifications[row.key]}
            onValueChange={(value) => setNotification(row.key, value)}
            isLast={index === ROWS.length - 1}
          />
        ))}
      </SettingsSection>
    </ProfileDetailShell>
  );
}
