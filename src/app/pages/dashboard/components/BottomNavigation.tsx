import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export type NavTab = "home" | "workouts" | "progress" | "nutrition" | "profile";

const TABS: {
  id: NavTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "home", label: "Ana Sayfa", icon: "home-outline" },
  { id: "workouts", label: "Antrenmanlar", icon: "barbell-outline" },
  { id: "progress", label: "İlerleme", icon: "stats-chart-outline" },
  { id: "nutrition", label: "Beslenme", icon: "restaurant-outline" },
  { id: "profile", label: "Profil", icon: "person-outline" },
];

type Props = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
};

// Navbar'in ekranin altindan uzakligi ve kapsul yuksekligi.
const NAV_BOTTOM_GAP = 6;
const NAV_HEIGHT = 68;
// Navbar'in arkasindaki icerik, navbar'in ust kenarindan bu kadar yukarida solmaya baslar.
const FADE_START_ABOVE_NAV = 16;
// Solma navbar'in ortasinda tamamlanir; kapsul opak oldugu icin gecisin cogu onun arkasinda kalir.
const FADE_HEIGHT = FADE_START_ABOVE_NAV + NAV_HEIGHT / 2;
// Tek parca gradyan, ease-in egrisiyle opaklasir; seritli blur gibi bant/cizgi olusturmaz.
const FADE_STOPS: { alpha: number; at: number }[] = [
  { alpha: 0, at: 0 },
  { alpha: 0.12, at: 0.25 },
  { alpha: 0.35, at: 0.5 },
  { alpha: 0.65, at: 0.75 },
  { alpha: 1, at: 1 },
];

function withAlpha(hex: string, alpha: number) {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

export function BottomNavigation({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navBottom = insets.bottom + NAV_BOTTOM_GAP;
  const fadeAreaHeight = navBottom + NAV_HEIGHT + FADE_START_ABOVE_NAV;
  // Gradyanin tam opakliga ulastigi nokta: navbar'in ortasi.
  const fadeEnd = FADE_HEIGHT / fadeAreaHeight;

  // Her tab için ayrı bir scale değeri - basılan/aktif olan ikon hafifçe
  // "pulse" yapar. Navigation'ın kendisi sürekli hareket etmiyor,
  // sadece etkileşim anında çok kısa bir geri bildirim veriyor.
  const scales = useRef<Record<NavTab, Animated.Value>>(
    TABS.reduce(
      (acc, tab) => {
        acc[tab.id] = new Animated.Value(1);
        return acc;
      },
      {} as Record<NavTab, Animated.Value>,
    ),
  ).current;

  const handlePress = (tab: NavTab) => {
    const scale = scales[tab];
    scale.setValue(0.88);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 7,
    }).start();
    onChange(tab);
  };

  return (
    <>
      <View pointerEvents="none" style={[styles.fadeArea, { height: fadeAreaHeight }]}>
        <LinearGradient
          colors={FADE_STOPS.map((stop) => withAlpha(colors.background, stop.alpha)) as [string, string, ...string[]]}
          locations={FADE_STOPS.map((stop) => stop.at * fadeEnd) as [number, number, ...number[]]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View
        pointerEvents="box-none"
        style={[styles.wrapper, { bottom: navBottom }]}
      >
        <View style={[styles.capsule, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handlePress(tab.id)}
                hitSlop={6}
                style={styles.item}
              >
                <Animated.View
                  style={[
                    styles.iconWrap,
                    { transform: [{ scale: scales[tab.id] }] },
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={21}
                    color={isActive ? colors.iconActive : colors.icon}
                  />
                </Animated.View>
                {isActive ? (
                  <Text style={[styles.label, { color: colors.iconActive }]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Navbar'in arkasinda kalan sayfa icerigini arka plan rengine dogru soldurur.
  fadeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Ekranın altına yapışık değil - kenarlardan içeride, yüzen bir kapsül.
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
