import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError } from "../../../../services/api/client";
import { logWeight } from "../../../../services/api/progress";
import { useTheme } from "../../../../shared/theme/ThemeContext";

const MIN_WEIGHT = 20;
const MAX_WEIGHT = 400;

type Props = {
  /** Bugun girilmis kilo; yoksa null. */
  todayWeight: number | null;
  /** Son bilinen kilo; giris kutusunun baslangic degeri. */
  currentWeight: number;
  onLogged: () => void;
};

/** "82,4" ve "82.4" girislerini sayiya cevirir. */
function parseWeight(text: string): number | null {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value >= MIN_WEIGHT && value <= MAX_WEIGHT ? value : null;
}

export function WeightLogCard({ todayWeight, currentWeight, onLogged }: Props) {
  const { colors, isDark } = useTheme();
  const initial = todayWeight ?? (currentWeight > 0 ? currentWeight : null);
  const [text, setText] = useState(initial !== null ? String(initial) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ekran yeniden yuklendiginde (orn. baska bir gun) kutuyu guncel degere esitle.
  useEffect(() => {
    setText(initial !== null ? String(initial) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayWeight, currentWeight]);

  const value = parseWeight(text);

  const handleSave = async () => {
    if (value === null || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await logWeight({ weightKg: Math.round(value * 10) / 10 });
      onLogged();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Kilo kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.titleRow}>
        <Ionicons name="scale-outline" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Bugünkü Kilon</Text>
        {todayWeight !== null ? (
          <View style={[styles.badge, { backgroundColor: colors.cardActive }]}>
            <Ionicons name="checkmark" size={12} color={colors.primary} />
            <Text style={[styles.badgeLabel, { color: colors.primary }]}>Girildi</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {todayWeight !== null
          ? "Bugün tekrar girersen bugünkü kaydın güncellenir."
          : "Her gün aynı saatte tartılmak ilerlemeyi daha doğru gösterir."}
      </Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: value === null && text ? colors.danger : colors.border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            keyboardAppearance={isDark ? "dark" : "light"}
            placeholder="Örn. 78,5"
            placeholderTextColor={colors.textSecondary}
            selectTextOnFocus
            style={[styles.input, { color: colors.text }]}
            accessibilityLabel="Bugünkü kilo, kilogram"
          />
          <Text style={[styles.unit, { color: colors.textSecondary }]}>kg</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={value === null || isSaving}
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: value === null || isSaving ? 0.5 : 1 }]}
          accessibilityRole="button"
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveLabel}>{todayWeight !== null ? "Güncelle" : "Kaydet"}</Text>
          )}
        </Pressable>
      </View>

      {value === null && text ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {MIN_WEIGHT}-{MAX_WEIGHT} kg arasında bir değer girin.
        </Text>
      ) : null}
      {errorMessage ? <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, borderWidth: StyleSheet.hairlineWidth },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "700", flex: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeLabel: { fontSize: 11, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 6 },
  inputRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 18, fontWeight: "700", padding: 0 },
  unit: { fontSize: 14, fontWeight: "600" },
  saveButton: { height: 48, minWidth: 96, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  saveLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  errorText: { fontSize: 12, fontWeight: "600", marginTop: 8 },
});
