import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Easing, View } from "react-native";

import {
    BottomNavigation,
    NavTab,
} from "../dashboard/components/BottomNavigation";
import { useReducedMotion } from "../../../shared/motion/useReducedMotion";
import { ProfileReveal, RevealOrigin } from "../../../shared/navigation/ProfileReveal";
import { useTheme } from "../../../shared/theme/ThemeContext";

// Tab route dosya adları ile navbar'daki NavTab id'leri birebir aynı değil
// ("dashboard" dosyası "home" tab'ına karşılık geliyor), bu yüzden ikisi
// arasında çeviri yapıyoruz. "progress" artık navbar'da bir menü değil; ana sayfanın sağ üstünden
// açılır ve ana sayfanın parçası gibi göründüğü için "home" vurgulanır.
const ROUTE_TO_TAB: Record<string, NavTab> = {
  dashboard: "home",
  workouts: "workouts",
  nutrition: "nutrition",
  store: "store",
  progress: "home",
  profile: "profile",
};

const TAB_TO_ROUTE: Record<NavTab, string> = {
  home: "dashboard",
  workouts: "workouts",
  nutrition: "nutrition",
  store: "store",
  profile: "profile",
};

export default function TabsLayout() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { colors } = useTheme();
  // Profil butonundan buyuyen daire animasyonunun baslangic noktasi; null iken animasyon yoktur.
  const [revealOrigin, setRevealOrigin] = useState<RevealOrigin | null>(null);
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        // Sekmeler arasi kisa, yumusak kayma; "Hareketi azalt" acikken animasyonsuz.
        animation: reducedMotion ? "none" : "shift",
        transitionSpec: { animation: "timing", config: { duration: 220, easing: Easing.out(Easing.cubic) } },
      }}
      tabBar={({ state }) => {
        const activeRouteName = state.routes[state.index].name;
        const active = ROUTE_TO_TAB[activeRouteName] ?? "home";

        return (
          <BottomNavigation
            active={active}
            // tabBar render-prop'undaki `navigation`'a baglanmak yerine router kullaniyoruz;
            // boylece prop eksik/bayat geldiginde bile gecis calisir.
            onChange={(tab) => router.navigate(`/pages/${TAB_TO_ROUTE[tab]}` as never)}
            // "Hareketi azalt" acikken daire animasyonu atlanir, profil dogrudan acilir.
            onProfileOpen={reducedMotion ? undefined : setRevealOrigin}
          />
        );
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="nutrition" />
      <Tabs.Screen name="store" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
    <ProfileReveal
      origin={revealOrigin}
      color={colors.accent}
      onCovered={() => router.navigate("/pages/profile" as never)}
      onDone={() => setRevealOrigin(null)}
    />
    </View>
  );
}
