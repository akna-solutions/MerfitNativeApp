import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../motion/DumbbellSpinner";

import { ApiError } from "../../services/api/client";
import { getNotificationSettings, updateNotificationSettings } from "../../services/api/notifications";
import { NotificationApp, NotificationCategory, NotificationTypeSetting } from "../../services/api/types";
import { PushPreferencesSection } from "./PushPreferencesSection";
import { ProfileDetailShell } from "../profile/components/ProfileDetailShell";
import { SettingsSection } from "../profile/components/SettingsSection";
import { SettingsToggle } from "../profile/components/SettingsToggle";
import { useProfile } from "../profile/ProfileContext";
import { useTheme } from "../theme/ThemeContext";

const SECTIONS: Record<NotificationApp, { category: NotificationCategory; title: string }[]> = {
  mbfit: [
    { category: "workout", title: "Antrenman" },
    { category: "nutrition", title: "Beslenme" },
    { category: "general", title: "Genel" },
  ],
  mbshop: [{ category: "shop", title: "MB Shop" }],
};

/** Ayar satirinin bolumu; eski backend "app" gondermezse kategoriden turetilir. */
export function settingAppOf(setting: Pick<NotificationTypeSetting, "app" | "category">): NotificationApp {
  return setting.app ?? (setting.category === "shop" ? "mbshop" : "mbfit");
}

/**
 * Bildirim ayarlari. Satirlar sabit kodlanmaz; backend'deki her NotificationType icin
 * GET /api/notifications/settings'ten gelir. Her degisiklik aninda PUT ile kaydedilir,
 * basarisiz olursa anahtar eski haline doner. MB FIT (Profil > Bildirimler) ve MB Shop
 * (MB Shop > Bildirimler > ayarlar) ayarlari ayri ekranlardadir; anlik bildirim izni ve sessiz saatler ortaktir.
 */
export function NotificationSettings({ app }: { app: NotificationApp }) {
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
      setSettings((await getNotificationSettings()).filter((s) => settingAppOf(s) === app));
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : "Bildirim ayarların yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [app, router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (type: string, isEnabled: boolean) => {
    setSaveError(null);
    setSettings((prev) => prev.map((s) => (s.type === type ? { ...s, isEnabled } : s)));
    updateNotificationSettings([{ type, isEnabled }])
      .then((saved) => {
        setSettings(saved.filter((s) => settingAppOf(s) === app));
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
    <ProfileDetailShell title={app === "mbshop" ? "MB Shop Bildirimleri" : "Bildirimler"}>
      {isLoading ? (
        <View style={styles.centered}>
          <DumbbellSpinner color={colors.primary} />
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
          {app === "mbfit" ? (
            <PushPreferencesSection />
          ) : (
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              MB Shop bildirimleri MB FIT bildirimlerinden ayrıdır. Anlık bildirim izni ve sessiz saatler Profil &gt; Bildirimler&apos;den yönetilir.
            </Text>
          )}
          {saveError ? (
            <Text style={[styles.saveError, { color: colors.textSecondary }]}>{saveError}</Text>
          ) : null}
          {SECTIONS[app].map(({ category, title }) => {
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
  note: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  section: { marginBottom: 20 },
});
