import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { Achievement, AchievementIcon } from "../types";

const ICONS: Record<AchievementIcon, keyof typeof Ionicons.glyphMap> = {
  streak: "flame-outline",
  workouts: "barbell-outline",
  pr: "trophy-outline",
  weekly: "calendar-outline",
};

type Props = { achievements: Achievement[] };

export function Achievements({ achievements }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Başarılar</Text>

      <View style={styles.grid}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[styles.card, !achievement.earned && styles.cardLocked]}
          >
            <View
              style={[
                styles.iconWrap,
                achievement.earned && styles.iconWrapEarned,
              ]}
            >
              <Ionicons
                name={ICONS[achievement.icon]}
                size={16}
                color={
                  achievement.earned ? colors.electricBlue : colors.textMuted
                }
              />
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {achievement.title}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {achievement.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardLocked: { opacity: 0.5 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  iconWrapEarned: { backgroundColor: colors.cardBackgroundActive },
  title: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  description: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});
