import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Achievement, AchievementIcon } from "../types";

const ICONS: Record<AchievementIcon, keyof typeof Ionicons.glyphMap> = {
  streak: "flame-outline",
  workouts: "barbell-outline",
  pr: "trophy-outline",
  weekly: "calendar-outline",
};

type Props = { achievements: Achievement[] };

export function Achievements({ achievements }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Başarılar</Text>

      <View style={styles.grid}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              !achievement.earned && styles.cardLocked,
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.inputBackground },
                achievement.earned && { backgroundColor: colors.cardActive },
              ]}
            >
              {ICONS[achievement.icon] ? (
                <Ionicons
                  name={ICONS[achievement.icon]}
                  size={16}
                  color={
                    achievement.earned ? colors.primary : colors.textSecondary
                  }
                />
              ) : achievement.icon ? (
                // Admin panelinde simge emoji olarak girilir (orn. "🔥").
                <Text style={styles.emoji}>{achievement.icon}</Text>
              ) : (
                <Ionicons
                  name="ribbon-outline"
                  size={16}
                  color={achievement.earned ? colors.primary : colors.textSecondary}
                />
              )}
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {achievement.title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
              {achievement.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLocked: { opacity: 0.5 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  description: { fontSize: 10, marginTop: 2 },
});
