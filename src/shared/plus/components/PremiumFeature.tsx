import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { usePlus } from "../PlusContext";
import { PLUS_FEATURES } from "../featureRegistry";
import { PlusFeature } from "../types";
import { LockedOverlay } from "./LockedOverlay";

type Props = {
  feature: PlusFeature;
  children: ReactNode;
  borderRadius?: number;
};

/**
 * isPlusUser ? children : dimmed children + locked overlay (Pressable, Plus modal'ı açar).
 * Tüm ekranlardaki premium içerik bu tek component'ten geçer.
 */
export function PremiumFeature({
  feature,
  children,
  borderRadius = 20,
}: Props) {
  const { isPlusUser, openPlusModal } = usePlus();

  if (isPlusUser) {
    return <>{children}</>;
  }

  const info = PLUS_FEATURES[feature];

  return (
    <Pressable onPress={() => openPlusModal(feature)}>
      <View style={[styles.wrapper, { borderRadius }]}>
        <View pointerEvents="none" style={styles.dimmed}>
          {children}
        </View>
        <LockedOverlay title={info.title} description={info.description} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: "hidden" },
  dimmed: { opacity: 0.35 },
});
