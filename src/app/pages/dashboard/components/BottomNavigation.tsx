import { Ionicons } from "@expo/vector-icons";
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

import { colors } from "../theme";

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

export function BottomNavigation({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();

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
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 14 }]}
    >
      <View style={styles.capsule}>
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
                  color={isActive ? colors.navActive : colors.navInactive}
                />
              </Animated.View>
              {isActive ? (
                <Text style={styles.label} numberOfLines={1}>
                  {tab.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Ekranın altına yapışık değil - kenarlardan içeride, yüzen bir kapsül.
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    height: 68,
    borderRadius: 34,
    paddingHorizontal: 6,
    backgroundColor: colors.navBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
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
    color: colors.navActive,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
