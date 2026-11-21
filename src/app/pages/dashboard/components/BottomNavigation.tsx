import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { GlassGroup, GlassSurface } from "../../../../shared/glass/GlassSurface";
import { glassTokens, useLiquidGlass } from "../../../../shared/glass/liquidGlass";
import { useReducedMotion } from "../../../../shared/motion/useReducedMotion";
import { activePillWidth, dragIndex, isOnPill, navStep, settleIndex } from "../../../../shared/navigation/navbarDrag";
import { useTheme } from "../../../../shared/theme/ThemeContext";

/**
 * Navbar iki gorunumlu: "main" (uygulama) ve "store" (Store bolumu). Iki gorunumde de uc menu ve sagda tek yuvarlak
 * aksiyon butonu vardir. Navbar'da Profilim menusu yoktur: profile MB Fit'te Ana Sayfa'daki avatardan, MB Shop'ta
 * Store ana sayfasinin sag ustundeki profil butonundan gidilir; Siparislerim profil ekranindaki Alisveris bolumundedir. Ana gorunumde yuvarlak buton Store'a, Store gorunumunde uygulamaya (Ana Sayfa) doner.
 *
 * Gorunum: secili menu beyaz, genis bir hap icinde siyah ikon + etiket; diger menuler yari saydam, gri, yuvarlak ikon
 * butonlari; en sagda canli sari-yesil yuvarlak aksiyon butonu.
 *
 * iOS 26+ (Liquid Glass): uc menu tek bir yuzen cam kapsulun icinde durur, aksiyon butonu da ayri bir cam dairedir;
 * ikisi ayni `GlassContainer` icinde oldugu icin birbirine yakin kenarlarda akiskan bicimde kaynasir. Arkadaki sayfa
 * icerigi camdan gercek zamanli bulanik gorunur; bu yuzden alttaki opak solma burada hafifletilir. Secili menu cam
 * ustunde dolu bir hap olarak (koyu temada beyaz, acik temada siyah) yumusak bir gecisle belirir. Android, eski iOS
 * surumleri ve "Saydamligi azalt" acikken yukaridaki mevcut tasarim aynen kullanilir.
 */
export type NavTab = "home" | "workouts" | "nutrition" | "store" | "profile" | "categories" | "cart";
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
    ],
    circle: { id: "store", label: "MB Shop", hint: "MB Shop'u açar", icon: "bag-handle-outline", activeIcon: "bag-handle" },
  },
  store: {
    tabs: [
      { id: "store", label: "Anasayfa", icon: "storefront-outline", activeIcon: "storefront" },
      { id: "categories", label: "Kategoriler", icon: "grid-outline", activeIcon: "grid" },
      { id: "cart", label: "Sepetim", icon: "cart-outline", activeIcon: "cart" },
    ],
    circle: { id: "home", label: "MB Fit", hint: "MB Fit'e geri döner", icon: "barbell-outline", activeIcon: "barbell" },
  },
};

type Props = {
  /** Gorunum; varsayilan "main". */
  variant?: NavVariant;
  /** Secili sekme. `null` ise hicbir menu genis hap olarak gosterilmez. */
  active: NavTab | null;
  onChange: (tab: NavTab) => void;
  /**
   * Verilirse yuvarlak butona basinca `onChange(<buton>)` yerine, butonun merkezi (pencere
   * koordinatlari) ile cagrilir; boylece gecis butondan buyuyen bir animasyonla yapilabilir.
   */
  onCircleOpen?: (origin: { x: number; y: number }) => void;
};

// Navbar'in ekranin altindan uzakligi.
const NAV_BOTTOM_GAP = 6;
/** Buton yuksekligi (yuvarlak butonlarin capi); iki gorunumde de uc menu oldugu icin aynidir. */
const NAV_ITEM_SIZES: Record<NavVariant, number> = { main: 56, store: 56 };
export function navItemSize(variant: NavVariant) {
  return NAV_ITEM_SIZES[variant];
}
const SIDE_MARGIN = 12;
const GAP = 6;
/** Secili hap genis ekranlarda bundan fazla uzamaz; navbar ortada toplu durur. */
const MAX_PILL_WIDTH = 180;
// Navbar'in arkasindaki icerik, navbar'in ust kenarindan bu kadar yukarida solmaya baslar.
const FADE_START_ABOVE_NAV = 28;
// Solma navbar'in ust kenarinda tamamlanir; butonlarin arasindaki bosluklardan ve arkasindan icerik gorunmez.
const FADE_HEIGHT = FADE_START_ABOVE_NAV;
/** Buyuk butonlarda ikon ve etiket de buyur. */
const contentSizes = (itemSize: number) => (itemSize >= 56 ? { icon: 23, font: 15, circleIcon: 25 } : { icon: 20, font: 13, circleIcon: 22 });
// Tek parca gradyan, ease-in egrisiyle opaklasir; seritli blur gibi bant/cizgi olusturmaz.
const FADE_STOPS: { alpha: number; at: number }[] = [
  { alpha: 0, at: 0 },
  { alpha: 0.12, at: 0.25 },
  { alpha: 0.35, at: 0.5 },
  { alpha: 0.65, at: 0.75 },
  { alpha: 1, at: 1 },
];
const SPRING = { damping: 20, stiffness: 240, mass: 0.7 } as const;
/** Cam kapsulun ic boslugu; menuler bu kadar kuculur ki kapsul aksiyon butonuyla ayni yukseklikte kalsin. */
const GLASS_PADDING = 4;
/** Cam ustundeki secili hap: MB Fit'in siyah/beyaz kimligi, her iki temada da yuksek kontrast. */
const GLASS_PILL = {
  dark: { bg: "#FFFFFF", content: "#0B0D12" },
  light: { bg: "#0B0D12", content: "#FFFFFF" },
} as const;
// Cam yolunda arkadaki icerik camdan gorunmelidir; solma yalnizca navbar'in altinda hafif bir okunabilirlik zemini birakir.
const GLASS_FADE_STOPS: { alpha: number; at: number }[] = [
  { alpha: 0, at: 0 },
  { alpha: 0.18, at: 0.55 },
  { alpha: 0.4, at: 1 },
];

/** Referans tasarimin renkleri: beyaz secili hap + siyah icerik, sari-yesil aksiyon butonu. */
const PILL_BG = "#FFFFFF";
const PILL_CONTENT = "#0B0D12";
export const NAV_ACCENT = "#EBFF4A";
const ACCENT_CONTENT = "#0B0D12";
// Pasif butonlar opaktir (arka plan uzerine %8 beyaz / %5 siyah karisiminin karsiligi); arkadaki yazilar seffaf
// zeminden gorunmez.
const INACTIVE = {
  dark: { bg: "#19191B", border: "#2B2B2E", icon: "rgba(255,255,255,0.55)" },
  light: { bg: "#E9EAEC", border: "#FFFFFF", icon: "rgba(11,13,18,0.38)" },
} as const;

function withAlpha(hex: string, alpha: number) {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

type TabButtonProps = {
  tab: TabConfig;
  selected: boolean;
  highlighted: boolean;
  pillWidth: number;
  itemSize: number;
  animate: boolean;
  palette: (typeof INACTIVE)[keyof typeof INACTIVE];
  /** Liquid Glass: zemin camdan gelir; secili hap cam ustunde solarak belirir. */
  glass: { pillBg: string; pillContent: string; inactiveIcon: string } | null;
  onPress: () => void;
};

function TabButton({ tab, selected, highlighted, pillWidth, itemSize, animate, palette, glass, onPress }: TabButtonProps) {
  const target = highlighted ? pillWidth : itemSize;
  const sizes = contentSizes(itemSize);
  const widthStyle = useAnimatedStyle(() => ({ width: animate ? withSpring(target, SPRING) : target }), [target, animate]);
  const pillOpacity = highlighted ? 1 : 0;
  const pillStyle = useAnimatedStyle(
    () => ({ opacity: animate ? withTiming(pillOpacity, { duration: 180 }) : pillOpacity }),
    [pillOpacity, animate],
  );
  const color = glass ? (highlighted ? glass.pillContent : glass.inactiveIcon) : highlighted ? PILL_CONTENT : palette.icon;

  return (
    <Animated.View style={widthStyle}>
      <Pressable
        testID={`nav-${tab.id}`}
        onPress={onPress}
        style={[
          styles.item,
          { height: itemSize, borderRadius: itemSize / 2 },
          glass
            ? styles.glassItem
            : highlighted
              ? [styles.pill, { backgroundColor: PILL_BG, borderColor: PILL_BG }]
              : { backgroundColor: palette.bg, borderColor: palette.border },
        ]}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected }}
        accessibilityHint={selected ? "Seçili menü. Sağa veya sola sürükleyerek de menü değiştirebilirsiniz." : undefined}
      >
        {glass ? (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: itemSize / 2, backgroundColor: glass.pillBg }, pillStyle]}
          />
        ) : null}
        <Ionicons name={highlighted ? tab.activeIcon : tab.icon} size={sizes.icon} color={color} />
        {highlighted ? (
          <Text style={[styles.label, { color, fontSize: sizes.font }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {tab.label}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function BottomNavigation({ variant = "main", active, onChange, onCircleOpen }: Props) {
  const { tabs, circle } = VARIANTS[variant];
  const tabCount = tabs.length;
  const itemSize = navItemSize(variant);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const palette = isDark ? INACTIVE.dark : INACTIVE.light;
  const reducedMotion = useReducedMotion();
  const liquidGlass = useLiquidGlass();
  const glassColors = useMemo(() => {
    if (!liquidGlass) return null;
    const pill = isDark ? GLASS_PILL.dark : GLASS_PILL.light;
    return { pillBg: pill.bg, pillContent: pill.content, inactiveIcon: glassTokens(isDark).inactiveIcon };
  }, [liquidGlass, isDark]);
  // Cam kapsulde menuler ic bosluk kadar kuculur; kapsulun toplam yuksekligi aksiyon butonuyla esit kalir.
  const tabSize = liquidGlass ? itemSize - GLASS_PADDING * 2 : itemSize;
  const step = navStep(tabSize, GAP);
  const navBottom = insets.bottom + NAV_BOTTOM_GAP;
  const fadeAreaHeight = navBottom + itemSize + FADE_START_ABOVE_NAV;
  // Gradyanin tam opakliga ulastigi nokta: navbar'in ortasi.
  const fadeEnd = FADE_HEIGHT / fadeAreaHeight;
  const fadeStops = liquidGlass ? GLASS_FADE_STOPS : FADE_STOPS;
  const fadeSpan = liquidGlass ? 1 : fadeEnd;

  const activeIndex = active ? tabs.findIndex((t) => t.id === active) : -1;

  const [barWidth, setBarWidth] = useState(0);
  const pillWidth =
    barWidth > 0
      ? activePillWidth(barWidth - (liquidGlass ? GLASS_PADDING * 2 : 0), tabSize, GAP, MAX_PILL_WIDTH, tabCount, itemSize)
      : MAX_PILL_WIDTH;

  // Surukleme durumu UI thread'inde (shared value) tutulur; JS tarafi yalnizca gorsel vurgu ve gecis icin bilgilendirilir.
  const pillWidthSV = useSharedValue(pillWidth);
  const armed = useSharedValue(false);
  const dragStartIndex = useSharedValue(activeIndex);
  const hoverIndex = useSharedValue(activeIndex);
  // Surukleme sirasinda hapin ustunde durdugu sekme (idle iken null).
  const [draggingOver, setDraggingOver] = useState<number | null>(null);

  useEffect(() => {
    pillWidthSV.set(pillWidth);
  }, [pillWidth, pillWidthSV]);

  // Disaridan (rota degisimi, geri tusu) gelen secimi surukleme durumuna yansitir.
  useEffect(() => {
    hoverIndex.set(activeIndex);
  }, [activeIndex, hoverIndex]);

  const onBarLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

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
    onChange(tabs[index].id);
  };

  // Hap yalnizca kendisinden tutulunca surulur; baska yerden baslayan yatay kaydirma yok sayilir.
  // activeOffsetX: kucuk titremeler dokunmayi (tap) bozmaz; failOffsetY: dikey hareket jesti iptal eder.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .withTestId("navbar-pan")
        .activeOffsetX([-6, 6])
        .failOffsetY([-32, 32])
        .onBegin((e) => {
          const start = hoverIndex.get();
          armed.set(isOnPill(e.x, start, step, pillWidthSV.get()));
          dragStartIndex.set(start);
        })
        .onStart(() => {
          if (armed.get()) scheduleOnRN(beginDrag, hoverIndex.get());
        })
        .onUpdate((e) => {
          if (!armed.get()) return;
          const over = dragIndex(dragStartIndex.get(), e.translationX, step, tabCount);
          if (over !== hoverIndex.get()) {
            hoverIndex.set(over);
            scheduleOnRN(setDraggingOver, over);
          }
        })
        .onEnd((e, success) => {
          if (!armed.get() || !success) return;
          const target = settleIndex(dragStartIndex.get(), e.translationX, e.velocityX, step, tabCount);
          hoverIndex.set(target);
          scheduleOnRN(commit, target);
        })
        .onFinalize((_e, success) => {
          if (armed.get()) scheduleOnRN(endDrag);
          if (armed.get() && !success) {
            // Jest iptal edildi (orn. sistem jesti): hapi onceki sekmeye dondur.
            hoverIndex.set(dragStartIndex.get());
            scheduleOnRN(setDraggingOver, null);
          }
          armed.set(false);
        }),
    [armed, beginDrag, commit, dragStartIndex, endDrag, hoverIndex, pillWidthSV, step, tabCount],
  );

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
          colors={fadeStops.map((stop) => withAlpha(colors.background, stop.alpha)) as [string, string, ...string[]]}
          locations={fadeStops.map((stop) => stop.at * fadeSpan) as [number, number, ...number[]]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Android'de GestureDetector, bir GestureHandlerRootView altinda olmalidir; navbar kendi kokunu getirir. */}
      <GestureHandlerRootView pointerEvents="box-none" style={[styles.wrapper, { bottom: navBottom }]}>
        <View testID="navbar-bar" onLayout={onBarLayout} style={styles.bar} pointerEvents="box-none">
          <GlassGroup enabled={liquidGlass} spacing={GAP * 2} style={styles.row} pointerEvents="box-none">
            <GlassSurface
              enabled={liquidGlass}
              interactive
              style={liquidGlass ? [styles.glassCapsule, { borderRadius: itemSize / 2 }] : undefined}
              pointerEvents="box-none"
            >
              {/* Surukleme koordinatlari menu dizisine gore hesaplanir; jest bu yuzden kapsulun ic boslugu disinda kalir. */}
              <GestureDetector gesture={pan}>
                <View testID="navbar-pill" style={styles.tabs} accessibilityRole="tablist">
                  {tabs.map((tab, index) => (
                    <TabButton
                      key={tab.id}
                      tab={tab}
                      selected={index === activeIndex}
                      highlighted={index === shownIndex}
                      pillWidth={pillWidth}
                      itemSize={tabSize}
                      animate={!reducedMotion}
                      palette={palette}
                      glass={glassColors}
                      onPress={() => handlePress(index)}
                    />
                  ))}
                </View>
              </GestureDetector>
            </GlassSurface>

            <Pressable
              ref={circleRef}
              testID="nav-circle"
              onPress={handleCirclePress}
              accessibilityRole="button"
              accessibilityLabel={circle.label}
              accessibilityHint={circle.hint}
              accessibilityState={{ selected: circleActive }}
              style={({ pressed }) => [
                styles.circle,
                { width: itemSize, height: itemSize, borderRadius: itemSize / 2 },
                // Cam ustunde opaklik degistirilmez (efekt bozulur); basili geri bildirim hafif kuculmedir.
                liquidGlass && pressed && !reducedMotion ? styles.glassPressed : null,
                liquidGlass
                  ? styles.glassCircle
                  : {
                      backgroundColor: NAV_ACCENT,
                      borderColor: circleActive ? ACCENT_CONTENT : NAV_ACCENT,
                      borderWidth: circleActive ? 2 : StyleSheet.hairlineWidth,
                    },
              ]}
            >
              {liquidGlass ? (
                // Aksiyon butonu da camdir; vurgu rengiyle tonlanir ki navbar'daki tek aksiyon oldugu belli olsun.
                <GlassSurface
                  enabled
                  tintColor={NAV_ACCENT}
                  pointerEvents="none"
                  style={[styles.glassCircleFill, { borderRadius: itemSize / 2 }]}
                >
                  <Ionicons name={circleActive ? circle.activeIcon : circle.icon} size={contentSizes(itemSize).circleIcon} color={ACCENT_CONTENT} />
                </GlassSurface>
              ) : (
                <Ionicons name={circleActive ? circle.activeIcon : circle.icon} size={contentSizes(itemSize).circleIcon} color={ACCENT_CONTENT} />
              )}
            </Pressable>
          </GlassGroup>
        </View>
      </GestureHandlerRootView>
    </>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  // Navbar'in arkasinda kalan sayfa icerigini arka plan rengine dogru soldurur.
  fadeArea: { position: "absolute", left: 0, right: 0, bottom: 0 },
  // Ekranin altina yapisik degil - kenarlardan iceride, ortalanmis, yuzen bir buton dizisi.
  wrapper: { position: "absolute", left: SIDE_MARGIN, right: SIDE_MARGIN },
  bar: { alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: GAP },
  tabs: { flexDirection: "row", alignItems: "center", gap: GAP },
  item: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  pill: { ...shadow },
  // Cam yolunda menulerin kendi zemini/kenari yoktur; zemin kapsulun camidir.
  glassItem: { backgroundColor: "transparent", borderWidth: 0 },
  glassCapsule: { padding: GLASS_PADDING },
  glassCircle: { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  glassPressed: { transform: [{ scale: 0.94 }] },
  glassCircleFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  label: { flexShrink: 1, fontWeight: "700", letterSpacing: 0.1 },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
});
