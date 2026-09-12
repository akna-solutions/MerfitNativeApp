import { Tabs } from "expo-router";

import {
    BottomNavigation,
    NavTab,
} from "../dashboard/components/BottomNavigation";

// Tab route dosya adları ile navbar'daki NavTab id'leri birebir aynı değil
// ("dashboard" dosyası "home" tab'ına karşılık geliyor), bu yüzden ikisi
// arasında çeviri yapıyoruz.
const ROUTE_TO_TAB: Record<string, NavTab> = {
  dashboard: "home",
  workouts: "workouts",
  progress: "progress",
  nutrition: "nutrition",
  profile: "profile",
};

const TAB_TO_ROUTE: Record<NavTab, string> = {
  home: "dashboard",
  workouts: "workouts",
  progress: "progress",
  nutrition: "nutrition",
  profile: "profile",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const activeRouteName = state.routes[state.index].name;
        const active = ROUTE_TO_TAB[activeRouteName] ?? "home";

        return (
          <BottomNavigation
            active={active}
            onChange={(tab) => navigation.navigate(TAB_TO_ROUTE[tab])}
          />
        );
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="nutrition" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
