import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePlus } from "../../../shared/plus/PlusContext";
import {
    BottomNavigation,
    NavTab,
} from "../dashboard/components/BottomNavigation";
import { BodyStats } from "./components/BodyStats";
import { FitnessGoalCard } from "./components/FitnessGoalCard";
import { LogOutButton } from "./components/LogOutButton";
import { MenuList } from "./components/MenuList";
import { PlusStatusCard } from "./components/PlusStatusCard";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileIdentity } from "./components/ProfileIdentity";
import { ProfileStats } from "./components/ProfileStats";
import { TrainingProfile } from "./components/TrainingProfile";
import { VersionFooter } from "./components/VersionFooter";
import { MOCK_PROFILE_DATA } from "./mockData";
import { colors } from "./theme";

export function ProfileScreen() {
  const router = useRouter();
  const { isPlusUser, openPlusModal } = usePlus();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // TODO: Backend/API + onboarding state bağlandığında MOCK_PROFILE_DATA
  // yerine gerçek kullanıcı verisi kullanılacak.
  const data = MOCK_PROFILE_DATA;

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

  const handleTabChange = (tab: NavTab) => {
    if (tab === "profile") return;
    router.push(
      tab === "home" ? "/pages/dashboard" : (`/pages/${tab}` as never),
    );
  };

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    // TODO: gerçek authentication sistemi bağlandığında burada sign-out
    // çağrısı yapılacak.
    router.replace("/pages/welcome");
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
            <ProfileHeader onSettingsPress={() => {}} />
          </Animated.View>

          <Animated.View
            style={[styles.padded, styles.sectionGap, fadeUp(identityAnim)]}
          >
            <ProfileIdentity
              firstName={data.firstName}
              username={data.username}
              onEditPress={() => router.push("/pages/profile/edit" as never)}
              onAvatarPress={() => router.push("/pages/profile/edit" as never)}
            />
          </Animated.View>

          <Animated.View
            style={[styles.padded, styles.sectionGap, fadeUp(cardsAnim)]}
          >
            <ProfileStats
              workouts={data.stats.workouts}
              streak={data.stats.streak}
              weight={data.stats.weight}
            />
          </Animated.View>

          <View style={[styles.padded, styles.sectionGap]}>
            <FitnessGoalCard
              goal={data.goal}
              description={data.goalDescription}
              onChangeGoal={() => router.push("/pages/profile/goal" as never)}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <PlusStatusCard
              isPlusUser={isPlusUser}
              onPress={() => {
                if (isPlusUser) {
                  // TODO: "Manage Subscription" ekranı eklendiğinde yönlendir.
                  return;
                }
                openPlusModal();
              }}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <BodyStats
              height={data.height}
              weight={data.weight}
              age={data.age}
              onEditPress={() => router.push("/pages/profile/edit" as never)}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <TrainingProfile
              experience={data.experience}
              activityLevel={data.activityLevel}
              trainingDays={data.trainingDays}
              workoutLocation={data.workoutLocation}
              equipment={data.equipment}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <MenuList
              title="Preferences"
              items={[
                {
                  id: "workout-preferences",
                  icon: "barbell-outline",
                  title: "Workout Preferences",
                  subtitle: "How often and where you train",
                  onPress: () =>
                    router.push("/pages/profile/workout-preferences" as never),
                },
                {
                  id: "nutrition-preferences",
                  icon: "restaurant-outline",
                  title: "Nutrition Preferences",
                  subtitle: "Manage your nutrition goals",
                  onPress: () =>
                    router.push(
                      "/pages/profile/nutrition-preferences" as never,
                    ),
                },
              ]}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <MenuList
              title="App Settings"
              items={[
                {
                  id: "notifications",
                  icon: "notifications-outline",
                  title: "Notifications",
                  subtitle: "Workout reminders",
                  onPress: () =>
                    router.push("/pages/profile/notifications" as never),
                },
                {
                  id: "appearance",
                  icon: "contrast-outline",
                  title: "Appearance",
                  subtitle: "Dark",
                  onPress: () =>
                    router.push("/pages/profile/appearance" as never),
                },
                {
                  id: "units",
                  icon: "swap-vertical-outline",
                  title: "Units",
                  subtitle:
                    data.unitSystem === "metric" ? "kg / cm" : "lb / ft",
                  onPress: () => router.push("/pages/profile/units" as never),
                },
                {
                  id: "language",
                  icon: "language-outline",
                  title: "Language",
                  subtitle: "English",
                  onPress: () =>
                    router.push("/pages/profile/language" as never),
                },
              ]}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <MenuList
              title="Account"
              items={[
                {
                  id: "personal-information",
                  icon: "person-outline",
                  title: "Personal Information",
                  onPress: () =>
                    router.push("/pages/profile/personal-information" as never),
                },
                {
                  id: "security",
                  icon: "lock-closed-outline",
                  title: "Security",
                  onPress: () =>
                    router.push("/pages/profile/security" as never),
                },
                {
                  id: "privacy",
                  icon: "shield-checkmark-outline",
                  title: "Privacy",
                  onPress: () => router.push("/pages/profile/privacy" as never),
                },
              ]}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <MenuList
              title="Help & Support"
              items={[
                {
                  id: "help-support",
                  icon: "help-circle-outline",
                  title: "Help & Support",
                  onPress: () => router.push("/pages/profile/help" as never),
                },
              ]}
            />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <LogOutButton
              visible={logoutModalVisible}
              onRequestOpen={() => setLogoutModalVisible(true)}
              onConfirm={handleConfirmLogout}
              onCancel={() => setLogoutModalVisible(false)}
            />
          </View>

          <VersionFooter />
        </ScrollView>
      </SafeAreaView>

      <BottomNavigation active="profile" onChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 24 },
});
