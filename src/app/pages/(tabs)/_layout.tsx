import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Easing, View } from "react-native";

import {
    BottomNavigation,
    NavTab,
    NavVariant,
} from "../dashboard/components/BottomNavigation";
import { useReducedMotion } from "../../../shared/motion/useReducedMotion";
import { CircleReveal, RevealLoader, RevealOrigin } from "../../../shared/navigation/CircleReveal";
import { circleTab, navbarRoute } from "../../../shared/navigation/navbarRoutes";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { useStore } from "../../../features/store/hooks";

// Yuvarlak buton gecisinde renkli (MB Shop kirmizi, MB Fit mavi) ekranda donen ikon ve altindaki baslik/aciklama.
const LOADERS: Partial<Record<NavTab, RevealLoader>> = {
  store: { icon: "bag-handle", title: "MB Shop", description: "Takviyeler, ekipmanlar ve kampanyalar" },
  home: { icon: "barbell", title: "MB Fit", description: "Antrenman, beslenme ve ilerlemen" },
};

// Tab route dosya adları ile navbar'daki NavTab id'leri birebir aynı değil
// ("dashboard" dosyası "home" tab'ına karşılık geliyor), bu yüzden ikisi
// arasında çeviri yapıyoruz. "progress" artık navbar'da bir menü değil; ana sayfanın sağ üstünden
// açılır ve ana sayfanın parçası gibi göründüğü için "home" vurgulanır.
const ROUTE_TO_TAB: Record<string, NavTab> = {
  dashboard: "home",
  workouts: "workouts",
  nutrition: "nutrition",
  store: "store",
  "store-categories": "categories",
  "store-orders": "orders",
  "store-profile": "profile",
  progress: "home",
  profile: "profile",
};

// Store bolumunun sekmeleri: bunlardayken navbar Store gorunumune gecer. Kategoriler ve Siparislerim de birer
// sekmedir; boylece navbar ekranla birlikte kaymaz, yerinde sabit kalir.
const STORE_ROUTES = new Set(["store", "store-categories", "store-orders", "store-profile"]);

export default function TabsLayout() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { colors } = useTheme();
  const { isLoading: storeLoading } = useStore();
  // Yuvarlak navbar butonundan (Store / uygulamaya don) buyuyen daire animasyonu; null iken animasyon yoktur.
  const [reveal, setReveal] = useState<{ origin: RevealOrigin; target: NavTab; variant: NavVariant } | null>(null);
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
        // Store sekmesindeyken navbar Store'a ozel menuleri (Anasayfa, Kategoriler, Siparislerim, Profilim) gosterir.
        const variant: NavVariant = STORE_ROUTES.has(activeRouteName) ? "store" : "main";

        return (
          <BottomNavigation
            variant={variant}
            active={active}
            // tabBar render-prop'undaki `navigation`'a baglanmak yerine router kullaniyoruz;
            // boylece prop eksik/bayat geldiginde bile gecis calisir.
            onChange={(tab) => router.navigate(navbarRoute(tab, variant))}
            // "Hareketi azalt" acikken daire animasyonu atlanir, gecis dogrudan yapilir.
            onCircleOpen={reducedMotion ? undefined : (origin) => setReveal({ origin, target: circleTab(variant), variant })}
          />
        );
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="nutrition" />
      <Tabs.Screen name="store" />
      <Tabs.Screen name="store-categories" />
      <Tabs.Screen name="store-orders" />
      <Tabs.Screen name="store-profile" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
    <CircleReveal
      origin={reveal?.origin ?? null}
      // MB Shop'a geciste kirmizi, MB Fit'e donuste mavi ekran.
      color={reveal?.target === "store" ? colors.accent : colors.primary}
      onCovered={() => reveal && router.navigate(navbarRoute(reveal.target, reveal.variant))}
      onDone={() => setReveal(null)}
      // MB Shop'a geciste market, MB Fit'e donuste dambil ikonu doner; MB Shop verisi yuklenene kadar ortu kalkmaz.
      loader={reveal ? LOADERS[reveal.target] : undefined}
      ready={reveal?.target === "store" ? !storeLoading : true}
    />
    </View>
  );
}
