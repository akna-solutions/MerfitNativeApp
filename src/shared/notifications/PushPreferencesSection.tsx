import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { ApiError } from "../../services/api/client";
import { getNotificationPreferences, updateNotificationPreferences } from "../../services/api/notifications";
import { NotificationPreferences } from "../../services/api/types";
import { SettingsSection } from "../profile/components/SettingsSection";
import { SettingsToggle } from "../profile/components/SettingsToggle";
import { useTheme } from "../theme/ThemeContext";
import {
  getDeviceTimeZone,
  getPushPermissionState,
  PushPermissionState,
  requestPushPermission,
  syncPushRegistration,
} from "./pushRegistration";

/** Sessiz saat secenekleri (kullanicinin yerel saati). Backend gece yarisini asan araliklari destekler. */
const QUIET_PRESETS: { label: string; start: string | null; end: string | null }[] = [
  { label: "Kapalı", start: null, end: null },
  { label: "22:00–08:00", start: "22:00", end: "08:00" },
  { label: "23:00–07:00", start: "23:00", end: "07:00" },
  { label: "21:00–09:00", start: "21:00", end: "09:00" },
];

const PERMISSION_TEXT: Record<PushPermissionState, string> = {
  granted: "Bu cihazda bildirim izni açık.",
  denied: "Bildirim izni kapalı. Bildirimleri uygulama içindeki gelen kutusunda görmeye devam edersin.",
  undetermined: "Bu cihaz için henüz bildirim izni verilmedi.",
  unsupported: "Bu cihazda anlık bildirim desteklenmiyor; bildirimler gelen kutusunda görünür.",
};

/**
 * Anlik bildirim ana anahtari, sessiz saatler, saat dilimi ve cihaz izin durumu.
 * Sunucu tarafi tercihleri (pushEnabled, sessiz saatler) GET/PUT /api/notifications/preferences ile
 * yonetilir; cihaz izni ise isletim sistemine aittir, kapaliysa ayarlara yonlendirilir.
 */
export function PushPreferencesSection() {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<PushPermissionState>("undetermined");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refreshPermission = useCallback(() => {
    getPushPermissionState().then(setPermission);
  }, []);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPrefs)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Bildirim tercihlerin yüklenemedi."));
    refreshPermission();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const save = (next: NotificationPreferences) => {
    const previous = prefs;
    setPrefs(next);
    setError(null);
    setIsSaving(true);
    updateNotificationPreferences({
      pushEnabled: next.pushEnabled,
      quietHoursStart: next.quietHoursStart,
      quietHoursEnd: next.quietHoursEnd,
      timeZone: getDeviceTimeZone(),
    })
      .then(setPrefs)
      .catch((e) => {
        setPrefs(previous);
        setError(e instanceof ApiError ? e.message : "Tercih kaydedilemedi. Lütfen tekrar dene.");
      })
      .finally(() => setIsSaving(false));
  };

  const onPermissionPress = async () => {
    if (permission === "undetermined") {
      const result = await requestPushPermission();
      setPermission(result);
      if (result === "granted") void syncPushRegistration({ promptIfNeeded: false });
    } else if (permission === "denied") {
      Linking.openSettings().catch(() => {});
    }
  };

  if (!prefs) {
    return error ? <Text style={[styles.hint, { color: colors.textSecondary }]}>{error}</Text> : null;
  }

  const activePreset = QUIET_PRESETS.find((p) => p.start === prefs.quietHoursStart && p.end === prefs.quietHoursEnd);

  return (
    <View style={styles.section}>
      <SettingsSection title="Anlık bildirimler">
        <SettingsToggle
          title="Anlık bildirimler"
          subtitle="Kapalıyken bildirimler yalnızca gelen kutusunda görünür."
          value={prefs.pushEnabled}
          disabled={isSaving}
          onValueChange={(value) => save({ ...prefs, pushEnabled: value })}
        />
        <View style={[styles.quietBlock, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Sessiz saatler</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Bu aralıkta anlık bildirim gönderilmez.
            {activePreset ? "" : ` Mevcut: ${prefs.quietHoursStart}–${prefs.quietHoursEnd}`}
          </Text>
          <View style={styles.chips}>
            {QUIET_PRESETS.map((preset) => {
              const selected = preset === activePreset;
              return (
                <Pressable
                  key={preset.label}
                  disabled={isSaving}
                  onPress={() => save({ ...prefs, quietHoursStart: preset.start, quietHoursEnd: preset.end })}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? colors.primary : colors.inputBackground },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: selected ? "#FFFFFF" : colors.text }]}>{preset.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={[styles.quietBlock, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Saat dilimi</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {prefs.effectiveTimeZone} · Hatırlatmalar bu saat dilimine göre planlanır ve cihazından otomatik alınır.
          </Text>
        </View>
        <View style={[styles.quietBlock, styles.lastBlock]}>
          <Text style={[styles.title, { color: colors.text }]}>Cihaz izni</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{PERMISSION_TEXT[permission]}</Text>
          {permission === "denied" || permission === "undetermined" ? (
            <Pressable onPress={onPermissionPress} style={[styles.chip, styles.action, { backgroundColor: colors.primary }]}>
              <Text style={[styles.chipLabel, { color: "#FFFFFF" }]}>
                {permission === "denied" ? "Ayarları aç" : "Bildirimlere izin ver"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SettingsSection>
      {error ? <Text style={[styles.hint, styles.error, { color: colors.textSecondary }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  quietBlock: { paddingVertical: 12, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 15, fontWeight: "600" },
  hint: { fontSize: 12, lineHeight: 17 },
  error: { marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  lastBlock: { borderBottomWidth: 0 },
  action: { alignSelf: "flex-start", marginTop: 4 },
  chipLabel: { fontSize: 13, fontWeight: "600" },
});
