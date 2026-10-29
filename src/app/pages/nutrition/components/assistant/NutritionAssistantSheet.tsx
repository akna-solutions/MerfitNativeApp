import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { DumbbellSpinner } from "../../../../../shared/motion/DumbbellSpinner";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ChatItem } from "../../../../../shared/nutritionAssistant/chatState";
import type { NutritionAssistantController } from "../../../../../shared/nutritionAssistant/useNutritionAssistant";
import { useTheme } from "../../../../../shared/theme/ThemeContext";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessageBubble, AssistantTypingIndicator } from "./AssistantMessageBubble";
import { AssistantQuickQuestions } from "./AssistantQuickQuestions";

export const ASSISTANT_TITLE = "Mbfit Beslenme Asistanı";

/** Pencere acildiginda ekran yuksekliginin bu orani kadar yer kaplar; yukari surukleyince tam ekrana genisler. */
const COLLAPSED_RATIO = 0.8;
/** Basliktan bu kadar asagi surukleme (veya hizli bir asagi kaydirma) pencereyi kapatir; tam ekrandayken de. */
const CLOSE_DISTANCE = 120;
const SNAP_DISTANCE = 60;

/** Baslik birakildiginda pencerenin ne yapacagi: kapanir, tam ekrana acilir ya da varsayilan boyuna doner. */
export function dragReleaseAction(
  dy: number,
  vy: number,
  current: "collapsed" | "expanded",
): "close" | "collapsed" | "expanded" {
  if (dy > CLOSE_DISTANCE || vy > 1.2) return "close";
  if (dy < -SNAP_DISTANCE || vy < -0.8) return "expanded";
  if (dy > SNAP_DISTANCE || vy > 0.8) return "collapsed";
  return current;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  controller: NutritionAssistantController;
};

type Row = ChatItem | { key: "greeting"; role: "assistant"; content: string; status: "sent" };

/**
 * Beslenme asistani sohbeti icin alttan acilan pencere. Klavye acikken icerik klavyenin uzerinde kalir
 * (Android edge-to-edge'de pencere yeniden boyutlanmadigi icin klavye yuksekligi elle bosluk olarak
 * eklenir), yeni mesajlarda liste en alta kayar. Sohbet durumu ekranda tutuldugu icin pencere kapatilip
 * acildiginda ayni gunun sohbeti kaldigi yerden gelir.
 */
export function NutritionAssistantSheet({ visible, onClose, controller }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { state, load, send, retry, clear } = controller;

  const confirmClear = () => {
    Alert.alert("Sohbeti sil", "Bugünkü sohbet geçmişin silinecek. Bu işlem geri alınamaz.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const error = await clear();
          if (error) Alert.alert("Sohbet silinemedi", error);
        },
      },
    ]);
  };

  const collapsedHeight = Math.round(screenHeight * COLLAPSED_RATIO);
  const expandedHeight = Math.max(collapsedHeight, screenHeight - insets.top - 8);

  const [rendered, setRendered] = useState(visible);
  const renderedRef = useRef(rendered);
  renderedRef.current = rendered;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sheetHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const snap = useRef<"collapsed" | "expanded">("collapsed");
  const listRef = useRef<FlatList<Row>>(null);
  const dims = useRef({ collapsedHeight, expandedHeight, screenHeight });
  dims.current = { collapsedHeight, expandedHeight, screenHeight };

  const animateTo = useCallback(
    (target: "collapsed" | "expanded") => {
      snap.current = target;
      Animated.parallel([
        Animated.spring(sheetHeight, {
          toValue: target === "expanded" ? dims.current.expandedHeight : dims.current.collapsedHeight,
          useNativeDriver: false,
          bounciness: 0,
        }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: false, bounciness: 0 }),
      ]).start();
    },
    [sheetHeight, translateY],
  );

  // Acilis / kapanis animasyonu. Kapanirken Modal animasyon bitene kadar ekranda kalir.
  useEffect(() => {
    if (visible) {
      setRendered(true);
      snap.current = "collapsed";
      sheetHeight.setValue(dims.current.collapsedHeight);
      translateY.setValue(dims.current.screenHeight);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: false }),
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: false }),
      ]).start();
      void load();
      return;
    }
    if (!renderedRef.current) return;
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, { toValue: dims.current.screenHeight, duration: 220, useNativeDriver: false }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => {
      // Kapanis sirasinda yeniden acildiysa pencere ekranda kalir.
      if (!visibleRef.current) setRendered(false);
    });
    // load bilerek bagimlilik degil: yalnizca pencere her acildiginda yenilenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
      // Klavye acikken yazilanlarin gorunmesi icin pencere tam ekrana genisler.
      animateTo("expanded");
    };
    const onHide = () => setKeyboardHeight(0);
    const subs = [Keyboard.addListener(showEvent, onShow), Keyboard.addListener(hideEvent, onHide)];
    return () => subs.forEach((s) => s.remove());
  }, [rendered, animateTo]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Baslik alaninin bos yerine dokunus hemen yakalanir (butonlar kendi dokunusunu once alir); boylece
        // Android'de surukleme baska bir goruntuye kaptirilmaz.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => {
          const { collapsedHeight: min, expandedHeight: max } = dims.current;
          const base = snap.current === "expanded" ? max : min;
          const next = base - g.dy;
          if (next >= min) {
            sheetHeight.setValue(Math.min(next, max));
            translateY.setValue(0);
          } else {
            sheetHeight.setValue(min);
            translateY.setValue(min - next);
          }
        },
        onPanResponderRelease: (_, g) => {
          const action = dragReleaseAction(g.dy, g.vy, snap.current);
          if (action === "close") onClose();
          else animateTo(action);
        },
        onPanResponderTerminate: () => animateTo(snap.current),
      }),
    [sheetHeight, translateY, animateTo, onClose],
  );

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [];
    if (state.greeting) list.push({ key: "greeting", role: "assistant", content: state.greeting, status: "sent" });
    return list.concat(state.items);
  }, [state.greeting, state.items]);

  const limitReached = state.remaining !== null && state.remaining <= 0;
  const composerDisabled = !state.available || limitReached || state.status !== "ready";
  const showBody = state.status === "ready";

  const scrollToEnd = () => listRef.current?.scrollToEnd({ animated: true });

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" testID="assistant-backdrop" />
        </Animated.View>

        <Animated.View
          testID="assistant-sheet"
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY }], backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.header}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.titleRow}>
              <View style={[styles.titleIcon, { backgroundColor: colors.cardActive }]}>
                <Ionicons name="sparkles" size={15} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
                {ASSISTANT_TITLE}
              </Text>
              {state.items.length > 0 ? (
                <Pressable
                  testID="assistant-clear"
                  onPress={confirmClear}
                  disabled={state.sending}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Sohbeti sil"
                  style={[styles.close, { backgroundColor: colors.card }, state.sending && styles.disabledAction]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              ) : null}
              <Pressable
                testID="assistant-close"
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Asistanı kapat"
                style={[styles.close, { backgroundColor: colors.card }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View testID="assistant-body" style={[styles.body, { paddingBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom }]}>
            {state.status === "loading" || state.status === "idle" ? (
              <View style={styles.center} testID="assistant-loading">
                <DumbbellSpinner color={colors.primary} />
                <Text style={[styles.centerText, { color: colors.textSecondary }]}>Sohbet yükleniyor…</Text>
              </View>
            ) : state.status === "error" ? (
              <View style={styles.center} testID="assistant-load-error">
                <Ionicons name="cloud-offline-outline" size={28} color={colors.textSecondary} />
                <Text style={[styles.centerText, { color: colors.textSecondary }]}>{state.loadError}</Text>
                <Pressable
                  onPress={() => void load()}
                  accessibilityRole="button"
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.retryLabel}>Tekrar dene</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                testID="assistant-messages"
                data={rows}
                keyExtractor={(row) => row.key}
                renderItem={({ item }) => (
                  <AssistantMessageBubble item={item} onRetry={() => void retry(item.key)} />
                )}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onContentSizeChange={scrollToEnd}
                onLayout={scrollToEnd}
                ListFooterComponent={
                  <>
                    {state.items.length === 0 && !state.sending ? (
                      <Text style={[styles.emptyHint, { color: colors.textSecondary }]} testID="assistant-empty">
                        Öğünlerin, hedeflerin veya bugünkü durumunla ilgili istediğini sorabilirsin. Öneriler genel
                        bilgi amaçlıdır; doktor veya diyetisyen görüşünün yerini tutmaz.
                      </Text>
                    ) : null}
                    {state.sending ? <AssistantTypingIndicator /> : null}
                  </>
                }
              />
            )}

            {showBody && !state.available ? (
              <Text style={[styles.banner, { color: colors.textSecondary, backgroundColor: colors.card }]} testID="assistant-unavailable">
                Beslenme asistanı şu an kullanılamıyor. Lütfen daha sonra tekrar dene.
              </Text>
            ) : null}
            {showBody && state.available && limitReached ? (
              <Text style={[styles.banner, { color: colors.textSecondary, backgroundColor: colors.card }]} testID="assistant-limit">
                Bugünkü mesaj hakkın doldu. Yarın yeniden sorabilirsin.
              </Text>
            ) : null}
            {showBody && state.sendError ? (
              <Text style={[styles.sendError, { color: colors.danger }]} testID="assistant-send-error">
                {state.sendError}
              </Text>
            ) : null}

            {showBody && !composerDisabled ? (
              <AssistantQuickQuestions questions={state.suggestions} disabled={state.sending} onSelect={(q) => void send(q)} />
            ) : null}
            <AssistantComposer
              disabled={composerDisabled}
              sending={state.sending}
              onSend={(text) => void send(text)}
              onFocus={scrollToEnd}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: { paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16 },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 16, fontWeight: "700" },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  disabledAction: { opacity: 0.4 },
  body: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  centerText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyHint: { fontSize: 13, lineHeight: 19, marginTop: 8, marginHorizontal: 4 },
  banner: { fontSize: 13, lineHeight: 18, marginHorizontal: 16, marginBottom: 6, padding: 10, borderRadius: 12, overflow: "hidden" },
  sendError: { fontSize: 12, marginHorizontal: 16, marginBottom: 2 },
});
