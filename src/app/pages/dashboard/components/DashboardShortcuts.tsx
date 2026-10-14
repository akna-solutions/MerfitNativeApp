import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  /** Aylik MB FIT puani; henuz yuklenmediyse veya alinamadiysa null. */
  points: number | null;
  onMealPhotoPress: () => void;
  onGamePress: () => void;
  onAssistantPress: () => void;
  onScorePress: () => void;
};

type Shortcut = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Ikonun altinda etiketin yerine gosterilen deger (puan karti). */
  value?: string;
  accessibilityLabel: string;
  onPress: () => void;
};

/** Dashboard'un en ustundeki dort hizli erisim butonu: fotografla ogun, oyun, AI asistan ve MB FIT puani. */
export function DashboardShortcuts({ points, onMealPhotoPress, onGamePress, onAssistantPress, onScorePress }: Props) {
  const { colors } = useTheme();
  const pointsLabel = points == null ? "—" : points.toLocaleString("tr-TR");

  const shortcuts: Shortcut[] = [
    {
      id: "meal-photo",
      icon: "camera",
      label: "Öğün Gir",
      accessibilityLabel: "Kamerayla öğün gir",
      onPress: onMealPhotoPress,
    },
    {
      id: "game",
      icon: "game-controller",
      label: "Oyun",
      accessibilityLabel: "Dumbbell Dash oyununu aç",
      onPress: onGamePress,
    },
    {
      id: "assistant",
      icon: "sparkles",
      label: "MbFit AI",
      accessibilityLabel: "MbFit AI asistanı aç",
      onPress: onAssistantPress,
    },
    {
      id: "score",
      icon: "trophy",
      label: "MB FIT Puan",
      value: pointsLabel,
      accessibilityLabel: points == null ? "MB FIT puanı" : `MB FIT puanı, bu ay ${pointsLabel}`,
      onPress: onScorePress,
    },
  ];

  return (
    <View style={styles.row}>
      {shortcuts.map((item) => (
        <Pressable
          key={item.id}
          testID={`dashboard-shortcut-${item.id}`}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.accessibilityLabel}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.cardActive }]}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          {item.value ? (
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </Text>
          ) : null}
          <Text style={[styles.label, { color: item.value ? colors.textSecondary : colors.text }]} numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 14, fontWeight: "800", marginBottom: -4 },
  label: { fontSize: 11, fontWeight: "700" },
});
