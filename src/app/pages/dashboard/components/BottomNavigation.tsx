import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { useReducedMotion } from "../../../../shared/motion/useReducedMotion";
import { clampIndicatorX, indicatorXForIndex, nearestIndex, settleIndex } from "../../../../shared/navigation/navbarDrag";
import { useTheme } from "../../../../shared/theme/ThemeContext";

/**
 * Navbar iki gorunumlu: "main" (uygulama) ve "store" (Store bolumu). Kapsulda dort menu, sagda tek yuvarlak buton
 * vardir. Ana gorunumde yuvarlak buton Store'a, Store gorunumunde uygulamaya (Ana Sayfa) doner.
 */
export type NavTab = "home" | "workouts" | "nutrition" | "store" | "profile" | "categories" | "orders";
export type NavVariant = "main" | "store";

type TabConfig = {
  id: NavTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};
type CircleConfig = { id: NavTab; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };

const VARIANTS: Record<NavVariant, { tabs: TabConfig[]; circle: CircleConfig }> = {
  main: {
    tabs: [
      { id: "home", label: "Ana Sayfa", icon: "home-outline", activeIcon: "home" },
      { id: "workouts", label: "Antrenman", icon: "barbell-outline", activeIcon: "barbell" },
      { id: "nutrition", label: "Beslenme", icon: "restaurant-outline", activeIcon: "restaurant" },
      { id: "profile", label: "Profilim", icon: "person-outline", activeIcon: "person" },
    ],
    circle: { id: "store", label: "MB Shop", hint: "MB Shop'u açar", icon: "bag-handle-outline", activeIcon: "bag-handle" },
  },
  store: {
    tabs: [
      { id: "store", label: "Anasayfa", icon: "storefront-outline", activeIcon: "storefront" },
      { id: "categories", label: "Kategoriler", icon: "grid-outline", activeIcon: "grid" },
      { id: "orders", label: "Siparişlerim", icon: "receipt-outline", activeIcon: "receipt" },
      { id: "profile", label: "Profilim", icon: "person-outline", activeIcon: "person" },
    ],
    circle: { id: "home", label: "MB Fit", hint: "MB Fit'e geri döner", icon: "barbell-outline", activeIcon: "barbell" },
  },
};

type Props = {
  /** Gorunum; varsayilan "main". */
  variant?: NavVariant;
  /** Secili sekme. `null` ise kapsulde gosterge gizlenir. */
  active: NavTab | null;
  onChange: (tab: NavTab) => void;
  /**
   * Verilirse yuvarlak butona basinca `onChange(<buton>)` yerine, butonun merkezi (pencere
   * koordinatlari) ile cagrilir; boylece gecis butondan buyuyen bir animasyonla yapilabilir.
   */
  onCircleOpen?: (origin: { x: number; y: number }) => void;
};

// Navbar'in ekranin altindan uzakligi ve kapsul yuksekligi.
const NAV_BOTTOM_GAP = 6;
const NAV_HEIGHT = 64;
const SIDE_MARGIN = 16;
const GAP = 10;
/** Kapsul ici dolgu; gosterge bu kadar iceride baslar. */
const PAD = 4;
const INDICATOR_HEIGHT = NAV_HEIGHT - PAD * 2;
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
const SPRING = { damping: 20, stiffness: 240, mass: 0.7 } as const;
const ACTIVE_CONTENT = "#FFFFFF";

function withAlpha(hex: string, alpha: number) {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

export function BottomNavigation({ variant = "main", active, onChange, onCircleOpen }: Props) {
  const { tabs, circle } = VARIANTS[variant];
  const tabCount = tabs.length;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const navBottom = insets.bottom + NAV_BOTTOM_GAP;
  const fadeAreaHeight = navBottom + NAV_HEIGHT + FADE_START_ABOVE_NAV;
  // Gradyanin tam opakliga ulastigi nokta: navbar'in ortasi.
  const fadeEnd = FADE_HEIGHT / fadeAreaHeight;

  const activeIndex = active ? tabs.findIndex((t) => t.id === active) : -1;

  // Surukleme durumu UI thread'inde (shared value) tutulur; JS tarafi yalnizca gorsel vurgu ve gecis icin bilgilendirilir.
  const itemWidth = useSharedValue(0);
  const indicatorX = useSharedValue(PAD);
  const indicatorOpacity = useSharedValue(activeIndex >= 0 ? 1 : 0);
  const armed = useSharedValue(false);
  const dragStartX = useSharedValue(PAD);
  const hoverIndex = useSharedValue(activeIndex);
  const [layoutWidth, setLayoutWidth] = useState(0);
  // Surukleme sirasinda gostergenin altindaki sekme (idle iken null).
  const [draggingOver, setDraggingOver] = useState<number | null>(null);

  const moveTo = useCallback(
    (index: number, animate: boolean) => {
      const target = indicatorXForIndex(index, itemWidth.get(), PAD);
      indicatorX.set(animate && !reducedMotion ? withSpring(target, SPRING) : target);
    },
    [indicatorX, itemWidth, reducedMotion],
  );

  const onPillLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    itemWidth.set((width - PAD * 2) / tabCount);
    setLayoutWidth(width);
  };

  // Disaridan (rota degisimi, geri tusu) gelen secimi gostergeye yansitir; surukleme sirasinda dokunmaz.
  useEffect(() => {
    if (layoutWidth === 0) return;
    if (activeIndex < 0) {
      indicatorOpacity.set(withTiming(0, { duration: reducedMotion ? 0 : 160 }));
      return;
    }
    const wasHidden = indicatorOpacity.get() === 0;
    hoverIndex.set(activeIndex);
    moveTo(activeIndex, !wasHidden);
    indicatorOpacity.set(withTiming(1, { duration: reducedMotion ? 0 : 160 }));
  }, [activeIndex, layoutWidth, moveTo, hoverIndex, indicatorOpacity, reducedMotion]);

  // Web'de (RN-web Pressable), surukleme bitince parmagin/imlecin basladigi menunun Pressable'i de "birakildi" olayi
  // alir ve onPress tetikleyip az once secilen menuyu geri alir. Surukleme sirasinda ve hemen sonrasinda
  // dokunma olaylari yok sayilir. (Native'de Gesture Handler zaten JS dokunuslarini iptal eder.)
  const suppressPressRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current); }, []);

  const beginDrag = useCallback((over: number) => {
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressPressRef.current = true;
    setDraggingOver(over);
  }, []);

  const endDrag = useCallback(() => {
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(() => {
      suppressPressRef.current = false;
    }, 300);
  }, []);

  const commit = useCallback(
    (index: number) => {
      setDraggingOver(null);
      onChange(tabs[index].id);
    },
    [onChange, tabs],
  );

  const handlePress = (index: number) => {
    if (suppressPressRef.current) return;
    hoverIndex.set(index);
    moveTo(index, true);
    onChange(tabs[index].id);
  };

  // Gosterge yalnizca kendi hucresinden tutulunca surulur; baska yerden baslayan yatay kaydirma yok sayilir.
  // activeOffsetX: kucuk titremeler dokunmayi (tap) bozmaz; failOffsetY: dikey hareket jesti iptal eder.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .withTestId("navbar-pan")
        .activeOffsetX([-6, 6])
        .failOffsetY([-32, 32])
        .onBegin((e) => {
          const w = itemWidth.get();
          const x = indicatorX.get();
          armed.set(indicatorOpacity.get() > 0.5 && e.x >= x && e.x <= x + w);
          dragStartX.set(x);
        })
        .onStart(() => {
          if (armed.get()) scheduleOnRN(beginDrag, hoverIndex.get());
        })
        .onUpdate((e) => {
          if (!armed.get()) return;
          const w = itemWidth.get();
          const next = clampIndicatorX(dragStartX.get() + e.translationX, w, tabCount, PAD);
          indicatorX.set(next);
          const over = nearestIndex(next, w, tabCount, PAD);
          if (over !== hoverIndex.get()) {
            hoverIndex.set(over);
            scheduleOnRN(setDraggingOver, over);
          }
        })
        .onEnd((e, success) => {
          if (!armed.get() || !success) return;
          const w = itemWidth.get();
          const target = settleIndex(indicatorX.get(), e.velocityX, w, tabCount, PAD);
          hoverIndex.set(target);
          indicatorX.set(withSpring(indicatorXForIndex(target, w, PAD), SPRING));
          scheduleOnRN(commit, target);
        })
        .onFinalize((_e, success) => {
          if (armed.get()) scheduleOnRN(endDrag);
          if (armed.get() && !success) {
            // Jest iptal edildi (orn. sistem jesti): gostergeyi onceki konumuna dondur.
            indicatorX.set(withSpring(dragStartX.get(), SPRING));
            scheduleOnRN(setDraggingOver, null);
          }
          armed.set(false);
        }),
    [armed, beginDrag, commit, dragStartX, endDrag, hoverIndex, indicatorOpacity, indicatorX, itemWidth, tabCount],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth.get(),
    opacity: indicatorOpacity.get(),
    transform: [{ translateX: indicatorX.get() }],
  }));

  const shownIndex = draggingOver ?? activeIndex;
  const circleActive = active === circle.id;
  const circleRef = useRef<ComponentRef<typeof Pressable>>(null);

  const handleCirclePress = () => {
    if (!onCircleOpen || circleActive || !circleRef.current) {
      onChange(circle.id);
      return;
    }
    circleRef.current.measureInWindow((x, y, width, height) => onCircleOpen({ x: x + width / 2, y: y + height / 2 }));
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
      {/* Android'de GestureDetector, bir GestureHandlerRootView altinda olmalidir; navbar kendi kokunu getirir. */}
      <GestureHandlerRootView pointerEvents="box-none" style={[styles.wrapper, { bottom: navBottom }]}>
        <View style={styles.row} pointerEvents="box-none">
          <GestureDetector gesture={pan}>
            <View
              testID="navbar-pill"
              onLayout={onPillLayout}
              style={[styles.capsule, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="tablist"
            >
              <Animated.View
                testID="navbar-indicator"
                pointerEvents="none"
                style={[styles.indicator, { backgroundColor: colors.primary }, indicatorStyle]}
              />
              {tabs.map((tab, index) => {
                const selected = index === activeIndex;
                const highlighted = index === shownIndex;
                const color = highlighted ? ACTIVE_CONTENT : colors.icon;
                return (
                  <Pressable
                    key={tab.id}
                    testID={`nav-${tab.id}`}
                    onPress={() => handlePress(index)}
                    style={styles.item}
                    accessibilityRole="tab"
                    accessibilityLabel={tab.label}
                    accessibilityState={{ selected }}
                    accessibilityHint={selected ? "Seçili menü. Sağa veya sola sürükleyerek de menü değiştirebilirsiniz." : undefined}
                  >
                    <Ionicons name={highlighted ? tab.activeIcon : tab.icon} size={21} color={color} />
                    <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GestureDetector>

          <Pressable
            ref={circleRef}
            testID="nav-circle"
            onPress={handleCirclePress}
            accessibilityRole="button"
            accessibilityLabel={circle.label}
            accessibilityHint={circle.hint}
            accessibilityState={{ selected: circleActive }}
            style={[
              styles.circle,
              {
                // Yuvarlak buton kapsuldaki mavi göstergeden ayrissin diye aksan (kirmizi) renkte dolu durur.
                backgroundColor: colors.accent,
                borderColor: circleActive ? ACTIVE_CONTENT : colors.accent,
                borderWidth: circleActive ? 2 : StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Ionicons name={circleActive ? circle.activeIcon : circle.icon} size={26} color={ACTIVE_CONTENT} />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: "#000000", shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 10 },
});

const styles = StyleSheet.create({
  // Navbar'in arkasinda kalan sayfa icerigini arka plan rengine dogru soldurur.
  fadeArea: { position: "absolute", left: 0, right: 0, bottom: 0 },
  // Ekranin altina yapisik degil - kenarlardan iceride, yuzen bir kapsul + ayri profil dairesi.
  wrapper: { position: "absolute", left: SIDE_MARGIN, right: SIDE_MARGIN },
  row: { flexDirection: "row", alignItems: "center", gap: GAP },
  capsule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    padding: PAD,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow,
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: PAD,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
  },
  item: { flex: 1, height: INDICATOR_HEIGHT, alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 2 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 0.1, maxWidth: "100%" },
  circle: {
    width: NAV_HEIGHT,
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
});
