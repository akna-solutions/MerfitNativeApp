import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { RewardIcon } from "../types";

const ICONS: Record<RewardIcon, keyof typeof Ionicons.glyphMap> = {
  watch: "watch-outline",
  premium: "star-outline",
  bag: "bag-handle-outline",
  shoes: "footsteps-outline",
  training: "person-outline",
  shaker: "flask-outline",
  apparel: "shirt-outline",
  membership: "business-outline",
};

type Props = {
  icon: RewardIcon;
  size?: "large" | "medium" | "small";
};

export function RewardImage({ icon, size = "medium" }: Props) {
  const { colors } = useTheme();
  const dimension = size === "large" ? 160 : size === "medium" ? 110 : 72;
  const iconSize = size === "large" ? 48 : size === "medium" ? 34 : 24;

  return (
    <View style={[styles.wrapper, { height: dimension, backgroundColor: colors.card }]}>
      <LinearGradient
        colors={["rgba(0,102,255,0.16)", "rgba(0,168,255,0.02)"]}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons
        name={ICONS[icon]}
        size={iconSize}
        color={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,168,255,0.22)",
    overflow: "hidden",
  },
});
