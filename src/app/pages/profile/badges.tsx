import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { getAchievements } from "../../../services/api/achievements";
import { ApiError } from "../../../services/api/client";
import { AchievementsResponse } from "../../../services/api/types";
import { BadgeGrid } from "../../../shared/achievements/BadgeGrid";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useTheme } from "../../../shared/theme/ThemeContext";

/** Profilim > Rozetlerim: kazanilan ve kazanilabilecek tum rozetler (kazanilanlar once). */
export default function BadgesRoute() {
  const { colors } = useTheme();
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setErrorMessage(null);
    getAchievements(signal)
      .then(setData)
      .catch((error) => {
        if (signal?.aborted) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Rozetler yüklenemedi.");
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  const sorted = data
    ? [...data.achievements].sort((a, b) => Number(b.earned) - Number(a.earned) || (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""))
    : [];

  return (
    <ProfileDetailShell title="Rozetlerim">
      {errorMessage && !data ? (
        <View style={styles.center}>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>{errorMessage}</Text>
          <Pressable onPress={() => load()} accessibilityRole="button">
            <Text style={[styles.retry, { color: colors.primary }]}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data.totalCount === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>Henüz tanımlı rozet yok.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={[styles.summary, { color: colors.text }]}>
            {data.earnedCount} / {data.totalCount} rozet kazandın
          </Text>
          <Text style={[styles.muted, { color: colors.textSecondary, textAlign: "left" }]}>
            Antrenman, seri, rekor ve kayıt alışkanlıklarınla yeni rozetler açılır.
          </Text>
          <View style={styles.gridGap}>
            <BadgeGrid achievements={sorted} />
          </View>
        </View>
      )}
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 48, gap: 10 },
  content: { gap: 6 },
  summary: { fontSize: 18, fontWeight: "800" },
  muted: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  retry: { fontSize: 14, fontWeight: "700" },
  gridGap: { marginTop: 12 },
});
