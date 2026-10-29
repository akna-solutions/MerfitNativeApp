import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { QuickStat } from "../types";

const ICONS: Record<QuickStat["icon"], keyof typeof Ionicons.glyphMap> = {
  scale: "speedometer-outline",
  flame: "flame-outline",
  trophy: "flash-outline",
  barbell: "barbell-outline",
};

/** Dokunulabilir ek kart (orn. MB FIT puani -> puan tablosu). */
export type QuickStatAction = {
  id: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  stats: QuickStat[];
  actions?: QuickStatAction[];
  /** Ekran kenar boslugu; kartlar bu bosluktan baslar ve kenara kadar kayar. */
  horizontalInset?: number;
};

export const QUICK_STAT_CARD_WIDTH = 136;
const GAP = 12;

/** Yatay kaydirilan, kartlara oturan (snap) hizli istatistikler. */
export function QuickStats({ stats, actions = [], horizontalInset = 24 }: Props) {
  const { colors } = useTheme();
  if (stats.length === 0 && actions.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: horizontalInset }]}>Hızlı İstatistikler</Text>
      <ScrollView
        testID="quick-stats-scroller"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={QUICK_STAT_CARD_WIDTH + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={[styles.row, { paddingHorizontal: horizontalInset }]}
      >
        {stats.map((stat) => (
          <View
            key={stat.id}
            accessible
            accessibilityLabel={`${stat.label}: ${stat.value}`}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name={ICONS[stat.icon]} size={18} color={colors.primary} />
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{stat.value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={2}>{stat.label}</Text>
          </View>
        ))}
        {actions.map((action) => (
          <Pressable
            key={action.id}
            testID={`quick-stat-${action.id}`}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${action.label}: ${action.value}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.cardActive, borderColor: colors.borderActive, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={styles.actionTop}>
              <Ionicons name={action.icon} size={18} color={colors.primary} />
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{action.value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={2}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  row: { gap: GAP },
  card: {
    width: QUICK_STAT_CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  value: { fontSize: 16, fontWeight: "700", marginTop: 10 },
  label: { fontSize: 11, marginTop: 2 },
});
