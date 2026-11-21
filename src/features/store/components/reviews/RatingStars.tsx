import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export const RATING_LABELS: Record<number, string> = { 1: "Çok kötü", 2: "Kötü", 3: "Orta", 4: "İyi", 5: "Çok iyi" };

/** Salt okunur yildizlar; ortalama icin yarim yildiz gosterir. */
export function RatingStars({ value, size = 14, testID }: { value: number; size?: number; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} testID={testID} accessibilityLabel={`5 üzerinden ${value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} puan`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const name = value >= n - 0.25 ? "star" : value >= n - 0.75 ? "star-half" : "star-outline";
        return <Ionicons key={n} name={name} size={size} color={name === "star-outline" ? colors.textSecondary : colors.primary} />;
      })}
    </View>
  );
}

/** Puan secici: 44pt dokunma alanli yildizlar, secilen puanin metni. */
export function RatingInput({ value, onChange, showError }: { value: number; onChange: (n: number) => void; showError?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.inputWrap}>
      <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel="Puan">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            testID={`rating-${n}`}
            onPress={() => onChange(n)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${n} yıldız`}
            accessibilityState={{ selected: value === n }}
            style={styles.starButton}
          >
            <Ionicons name={value >= n ? "star" : "star-outline"} size={34} color={value >= n ? colors.primary : showError ? colors.danger : colors.textSecondary} />
          </Pressable>
        ))}
      </View>
      <Text style={[styles.inputLabel, { color: value ? colors.text : showError ? colors.danger : colors.textSecondary }]}>
        {value ? RATING_LABELS[value] : showError ? "Lütfen puan ver" : "Puanını seç"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  inputWrap: { alignItems: "center", gap: 6 },
  starButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  inputLabel: { fontSize: 14, fontWeight: "700" },
});
