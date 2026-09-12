import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePlus } from "../../../shared/plus/PlusContext";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { SettingsRow } from "../../../shared/profile/components/SettingsRow";
import { SettingsSection } from "../../../shared/profile/components/SettingsSection";
import { GOAL_LABELS } from "../../../shared/profile/types";
import { LogOutButton } from "./components/LogOutButton";
import { PlusStatusCard } from "./components/PlusStatusCard";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileIdentity } from "./components/ProfileIdentity";
import { colors } from "./theme";

export function ProfileScreen() {
  const router = useRouter();
  const { isPlusUser, openPlusModal } = usePlus();
  const { profile } = useProfile();
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

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    // TODO: gerçek authentication sistemi bağlandığında mevcut auth
    // mimarisine göre token/session temizliği burada yapılacak.
    router.replace("/pages/welcome");
  };

  const handleMembershipRowPress = () => {
    if (isPlusUser) {
      router.push("/pages/profile/subscription" as never);
    } else {
      openPlusModal();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
            <ProfileIdentity
              firstName={profile.firstName}
              username={`@${profile.username}`}
              onEditPress={() => router.push("/pages/profile/edit" as never)}
              onAvatarPress={() => router.push("/pages/profile/edit" as never)}
            />
          </Animated.View>

          <Animated.View
            style={[styles.padded, styles.sectionGap, fadeUp(cardsAnim)]}
          >
            <PlusStatusCard
              isPlusUser={isPlusUser}
              onPress={handleMembershipRowPress}
            />
          </Animated.View>

          <View style={[styles.padded, styles.sectionGap]}>
            <SettingsSection title="Fitness Bilgilerin">
              <SettingsRow
                icon="person-outline"
                title="Kişisel Bilgiler"
                subtitle="Ad, yaş ve temel bilgiler"
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
                subtitle={`${profile.height} cm · ${profile.weight} kg`}
                onPress={() =>
                  router.push("/pages/profile/body-measurements" as never)
                }
              />
              <SettingsRow
                icon="barbell-outline"
                title="Antrenman Tercihleri"
                subtitle={`${profile.trainingDays.length} gün · ${profile.workoutDurationMin} dk`}
                onPress={() =>
                  router.push("/pages/profile/workout-preferences" as never)
                }
                isLast
              />
            </SettingsSection>
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <SettingsSection title="Üyelik">
              <SettingsRow
                icon="sparkles-outline"
                title="MERFIT Plus"
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
                subtitle="Koyu"
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
                title="MERFIT Hakkında"
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 24 },
});
