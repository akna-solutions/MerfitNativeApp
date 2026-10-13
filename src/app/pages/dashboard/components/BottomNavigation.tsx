import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
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
// Blur, icerik navbar'a degmeden bu kadar yukarida yavas yavas baslar.
const BLUR_FADE_HEIGHT = 56;
const BLUR_INTENSITY = 40;

export function BottomNavigation({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const navBottom = insets.bottom + NAV_BOTTOM_GAP;
  const blurHeight = navBottom + NAV_HEIGHT + BLUR_FADE_HEIGHT;
  // Gradyanin tam opakliga ulastigi nokta: navbar'in ust kenari.
  const fadeEnd = BLUR_FADE_HEIGHT / blurHeight;

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
      <View pointerEvents="none" style={[styles.blurArea, { height: blurHeight }]}>
        {/* Tek bir blur katmani, yukaridan asagi seffaftan opaga giden bir gradyanla
            maskelenir; boylece bulaniklik keskin bir kenar olmadan yavasca artar. */}
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)", "rgba(0,0,0,1)"]}
              locations={[0, fadeEnd / 2, fadeEnd]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={BLUR_INTENSITY}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
        <LinearGradient
          colors={[`${colors.background}00`, `${colors.background}73`]}
          locations={[0, fadeEnd]}
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
  // Navbar'in arkasinda kalan sayfa icerigini bulaniklastiran alan.
  blurArea: {
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
