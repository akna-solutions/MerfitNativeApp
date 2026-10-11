import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../shared/auth/AuthContext";
import { usePlus } from "../../../shared/plus/PlusContext";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { SettingsRow } from "../../../shared/profile/components/SettingsRow";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { GOAL_LABELS, ProfileData, WEEKDAY_SHORT_LABELS } from "../../../shared/profile/types";
import { APPEARANCE_LABELS } from "../../../shared/theme/labels";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { LogOutButton } from "./components/LogOutButton";
import { PlusStatusCard } from "./components/PlusStatusCard";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileIdentity } from "./components/ProfileIdentity";

export function ProfileScreen() {
  const router = useRouter();
  const { logout, status } = useAuth();
  const { isPlusUser, openPlusModal } = usePlus();
  const { profile, isLoaded, isLoading, error, reload } = useProfile();
  const { mode, colors } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const identityAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(110, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(identityAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardsAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, identityAnim, cardsAnim]);

  const fadeUp = (anim: Animated.Value, distance = 14) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  // Profil yuklenirken oturumun gecersiz oldugu anlasilirsa (401) ProfileContext oturumu kapatir;
  // diger ekranlardaki gibi kullaniciyi giris ekranina yonlendiririz.
  const isLoggingOutRef = useRef(false);
  useEffect(() => {
    if (status === "signedOut" && !isLoggingOutRef.current) router.replace("/pages/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Tab ekranlari yeniden mount olmadigi icin profil, sekmeye her donuste sunucudan tazelenir.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    isLoggingOutRef.current = true;
    logout().finally(() => router.replace("/pages/welcome"));
  };

  const handleMembershipRowPress = () => {
    if (isPlusUser) {
      router.push("/pages/profile/subscription" as never);
    } else {
      openPlusModal();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.padded, fadeUp(headerAnim, -8)]}>
            <ProfileHeader />
          </Animated.View>

          <Animated.View
            style={[styles.padded, styles.sectionGap, fadeUp(identityAnim)]}
          >
            {isLoaded ? (
              <ProfileIdentity
                fullName={`${profile.firstName} ${profile.lastName}`.trim()}
                username={profile.username ? `@${profile.username}` : ""}
                onEditPress={() => router.push("/pages/profile/edit" as never)}
                onAvatarPress={() => router.push("/pages/profile/edit" as never)}
              />
            ) : error && !isLoading ? (
              <View style={styles.stateBox}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                  {error}
                </Text>
                <Pressable
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={reload}
                >
                  <Text style={styles.retryLabel}>Tekrar dene</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.stateBox}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            )}
          </Animated.View>

          <Animated.View
            style={[styles.padded, styles.sectionGap, fadeUp(cardsAnim)]}
          >
            <PlusStatusCard
              isPlusUser={isPlusUser}
              onPress={handleMembershipRowPress}
            />
          </Animated.View>

          {isLoaded && (
          <View style={[styles.padded, styles.sectionGap]}>
            <SettingsSection title="Fitness Bilgilerin">
              <SettingsRow
                icon="person-outline"
                title="Kişisel Bilgiler"
                subtitle={personalSubtitle(profile)}
                onPress={() =>
                  router.push("/pages/profile/personal-information" as never)
                }
              />
              <SettingsRow
                icon="flag-outline"
                title="Hedefler"
                subtitle={GOAL_LABELS[profile.goal]}
                onPress={() => router.push("/pages/profile/goals" as never)}
              />
              <SettingsRow
                icon="pulse-outline"
                title="Vücut Ölçümleri"
                subtitle={bodySubtitle(profile)}
                onPress={() =>
                  router.push("/pages/profile/body-measurements" as never)
                }
              />
              <SettingsRow
                icon="calendar-outline"
                title="Antrenman Programım"
                subtitle={
                  profile.trainingDays.length > 0
                    ? profile.trainingDays.map((day) => WEEKDAY_SHORT_LABELS[day]).join(" · ")
                    : "Haftalık kişisel programın"
                }
                onPress={() => router.push("/pages/workout/plan" as never)}
              />
              <SettingsRow
                icon="barbell-outline"
                title="Antrenman Tercihleri"
                subtitle={trainingSubtitle(profile)}
                onPress={() =>
                  router.push("/pages/profile/workout-preferences" as never)
                }
                isLast
              />
            </SettingsSection>
          </View>
          )}

          <View style={[styles.padded, styles.sectionGap]}>
            <SettingsSection title="Üyelik">
              <SettingsRow
                icon="sparkles-outline"
                title="MB FIT Plus"
                subtitle={isPlusUser ? "Aktif" : "Gelişmiş özelliklerin kilidini aç"}
                onPress={handleMembershipRowPress}
              />
              <SettingsRow
                icon="card-outline"
                title="Aboneliği Yönet"
                subtitle="Üyeliğini yönet"
                onPress={() =>
                  router.push("/pages/profile/subscription" as never)
                }
                isLast
              />
            </SettingsSection>
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <SettingsSection title="Tercihler">
              <SettingsRow
                icon="notifications-outline"
                title="Bildirimler"
                subtitle="Antrenman hatırlatmaları"
                onPress={() =>
                  router.push("/pages/profile/notifications" as never)
                }
              />
              <SettingsRow
                icon="swap-vertical-outline"
                title="Birimler"
                subtitle={
                  profile.unitSystem === "metric" ? "Metrik" : "İngiliz"
                }
                onPress={() => router.push("/pages/profile/units" as never)}
              />
              <SettingsRow
                icon="moon-outline"
                title="Görünüm"
                subtitle={APPEARANCE_LABELS[mode]}
                onPress={() =>
                  router.push("/pages/profile/appearance" as never)
                }
                isLast
              />
            </SettingsSection>
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <SettingsSection title="Uygulama">
              <SettingsRow
                icon="shield-checkmark-outline"
                title="Gizlilik"
                onPress={() => router.push("/pages/profile/privacy" as never)}
              />
              <SettingsRow
                icon="help-circle-outline"
                title="Yardım ve Destek"
                onPress={() => router.push("/pages/profile/help" as never)}
              />
              <SettingsRow
                icon="information-circle-outline"
                title="MB FIT Hakkında"
                onPress={() => router.push("/pages/profile/about" as never)}
              />
              <SettingsRow
                icon="document-text-outline"
                title="Şartlar ve Koşullar"
                onPress={() => router.push("/pages/profile/terms" as never)}
              />
              <SettingsRow
                icon="lock-closed-outline"
                title="Gizlilik Politikası"
                onPress={() =>
                  router.push("/pages/profile/privacy-policy" as never)
                }
                isLast
              />
            </SettingsSection>
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <LogOutButton
              visible={logoutModalVisible}
              onRequestOpen={() => setLogoutModalVisible(true)}
              onConfirm={handleConfirmLogout}
              onCancel={() => setLogoutModalVisible(false)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function personalSubtitle(profile: ProfileData): string {
  const parts: string[] = [];
  if (profile.age > 0) parts.push(`${profile.age} yaş`);
  if (profile.gender !== "Belirtmek istemiyorum") parts.push(profile.gender);
  return parts.length > 0 ? parts.join(" · ") : "Ad, yaş ve temel bilgiler";
}

function bodySubtitle(profile: ProfileData): string {
  const parts: string[] = [];
  if (profile.height > 0) parts.push(`${profile.height} cm`);
  if (profile.weight > 0) parts.push(`${profile.weight} kg`);
  return parts.length > 0 ? parts.join(" · ") : "Boy ve kilonu ekle";
}

function trainingSubtitle(profile: ProfileData): string {
  const parts: string[] = [];
  if (profile.trainingDaysPerWeek > 0) {
    parts.push(`Haftada ${profile.trainingDaysPerWeek} gün`);
  }
  if (profile.workoutDurationMin > 0) parts.push(`${profile.workoutDurationMin} dk`);
  return parts.length > 0 ? parts.join(" · ") : "Antrenman sıklığı ve süresi";
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 24 },
  stateBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: { fontSize: 14, textAlign: "center" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 19,
  },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
