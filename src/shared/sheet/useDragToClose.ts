import { useEffect, useRef } from "react";
import { Animated, PanResponder, PanResponderInstance } from "react-native";

/** Basliktan bu kadar asagi cekilirse (ya da hizli kaydirilirsa) pencere kapanir. */
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.8;

/** Surukleme birakildiginda pencerenin kapanip kapanmayacagi. */
export function shouldDismissSheet(dy: number, vy: number): boolean {
  return dy > DISMISS_DISTANCE || (dy > 0 && vy > DISMISS_VELOCITY);
}

type Options = {
  /** Verilirse kapanirken pencere bu kadar asagi kayarak gizlenir, sonra onClose cagrilir. */
  slideOutDistance?: number;
};

/**
 * Alttan acilan pencereler icin "basliktan asagi cekince kapan" davranisi. panHandlers baslik alanina,
 * translateY pencereye verilir; yeterince cekilmezse pencere yerine geri yaylanir. Pencere her acildiginda
 * (visible true oldugunda) konum sifirlanir.
 */
export function useDragToClose(
  visible: boolean,
  onClose: () => void,
  { slideOutDistance }: Options = {},
): { translateY: Animated.Value; panHandlers: PanResponderInstance["panHandlers"] } {
  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const slideOutRef = useRef(slideOutDistance);
  slideOutRef.current = slideOutDistance;

  const panResponder = useRef(
    PanResponder.create({
      // Baslik alanindaki yazilarin ustunden baslayan dokunus da yakalanir; kapatma butonu gibi
      // dokunulabilir alt ogeler dokunusu once aldigi icin onlar etkilenmez.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      // Surukleme basladiktan sonra ic ice kaydirma alanlari hareketi elinden alamaz.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => translateY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (shouldDismissSheet(g.dy, g.vy)) {
          const distance = slideOutRef.current;
          if (distance) {
            Animated.timing(translateY, { toValue: distance, duration: 180, useNativeDriver: true }).start(() =>
              onCloseRef.current(),
            );
          } else {
            onCloseRef.current();
          }
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
      onPanResponderTerminate: () =>
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(),
    }),
  ).current;

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  return { translateY, panHandlers: panResponder.panHandlers };
}
