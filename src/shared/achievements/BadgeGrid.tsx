import { StyleSheet, Text, View } from "react-native";

import { AchievementItem } from "../../services/api/types";
import { useTheme } from "../theme/ThemeContext";
import { AchievementBadgeIcon } from "./AchievementBadgeIcon";

type Props = { achievements: AchievementItem[] };

/** Rozet izgarasi: kazanilanlar renkli ve tarihli, kazanilmayanlar soluk ve kosul aciklamasiyla. */
export function BadgeGrid({ achievements }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {achievements.map((item) => (
        <View
          key={item.id}
          testID={`badge-${item.id}`}
          accessible
          accessibilityLabel={`${item.title}, ${item.earned ? "kazanıldı" : "henüz kazanılmadı"}${item.description ? `. ${item.description}` : ""}`}
          style={[
            styles.card,
            { backgroundColor: item.earned ? colors.cardActive : colors.card, borderColor: item.earned ? colors.borderActive : colors.border },
            !item.earned && styles.locked,
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: item.earned ? colors.surface : colors.inputBackground }]}>
            <AchievementBadgeIcon icon={item.icon} size={24} color={item.earned ? colors.primary : colors.textSecondary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          {item.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>{item.description}</Text>
          ) : null}
          <Text style={[styles.meta, { color: item.earned ? colors.primary : colors.textSecondary }]}>
            {item.earned && item.earnedAt
              ? new Date(item.earnedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
              : item.earned
                ? "Kazanıldı"
                : `${item.points} puan`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", flexGrow: 1, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  locked: { opacity: 0.6 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 14, fontWeight: "800" },
  description: { fontSize: 11, lineHeight: 15 },
  meta: { fontSize: 11, fontWeight: "700", marginTop: 2 },
});
