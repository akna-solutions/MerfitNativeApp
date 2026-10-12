import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ApiError } from "../../../services/api/client";
import { getNotificationSettings, updateNotificationSettings } from "../../../services/api/notifications";
import { NotificationCategory, NotificationTypeSetting } from "../../../services/api/types";
import { PushPreferencesSection } from "../../../shared/notifications/PushPreferencesSection";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { SettingsToggle } from "../../../shared/profile/components/SettingsToggle";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { useTheme } from "../../../shared/theme/ThemeContext";

const SECTIONS: { category: NotificationCategory; title: string }[] = [
  { category: "workout", title: "Antrenman" },
  { category: "nutrition", title: "Beslenme" },
  { category: "general", title: "Genel" },
];

/**
 * Bildirim ayarlari. Satirlar sabit kodlanmaz; backend'deki her NotificationType icin
 * GET /api/notifications/settings'ten gelir. Her degisiklik aninda PUT ile kaydedilir,
 * basarisiz olursa anahtar eski haline doner.
 */
export default function NotificationsRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const { reload: reloadProfile } = useProfile();

  const [settings, setSettings] = useState<NotificationTypeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      setSettings(await getNotificationSettings());
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : "Bildirim ayarların yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (type: string, isEnabled: boolean) => {
    setSaveError(null);
    setSettings((prev) => prev.map((s) => (s.type === type ? { ...s, isEnabled } : s)));
    updateNotificationSettings([{ type, isEnabled }])
      .then((saved) => {
        setSettings(saved);
        // Profildeki eski "notifications" alani da ayni kayitlardan okunuyor; senkron kalsin.
        reloadProfile();
      })
      .catch((error) => {
        setSettings((prev) => prev.map((s) => (s.type === type ? { ...s, isEnabled: !isEnabled } : s)));
        setSaveError(
          error instanceof ApiError ? error.message : "Ayar kaydedilemedi. Lütfen tekrar dene.",
        );
      });
  };

  return (
    <ProfileDetailShell title="Bildirimler">
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>{errorMessage}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={load}>
            <Text style={styles.retryLabel}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <PushPreferencesSection />
          {saveError ? (
            <Text style={[styles.saveError, { color: colors.textSecondary }]}>{saveError}</Text>
          ) : null}
          {SECTIONS.map(({ category, title }) => {
            const rows = settings.filter((s) => s.category === category);
            if (rows.length === 0) return null;
            return (
              <View key={category} style={styles.section}>
                <SettingsSection title={title}>
                  {rows.map((row, index) => (
                    <SettingsToggle
                      key={row.type}
                      title={row.title}
                      subtitle={row.isLocked ? `${row.description} Kapatılamaz.` : row.description}
                      value={row.isEnabled}
                      disabled={row.isLocked}
                      onValueChange={(value) => toggle(row.type, value)}
                      isLast={index === rows.length - 1}
                    />
                  ))}
                </SettingsSection>
              </View>
            );
          })}
        </>
      )}
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 48 },
  muted: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  saveError: { fontSize: 12, marginBottom: 12 },
  section: { marginBottom: 20 },
});
