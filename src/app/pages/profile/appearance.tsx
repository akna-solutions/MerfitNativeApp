import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { AppearanceMode } from "../../../shared/profile/types";
import { APPEARANCE_LABELS } from "../../../shared/theme/labels";
import { useTheme } from "../../../shared/theme/ThemeContext";

const OPTIONS: {
  value: AppearanceMode;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "system", description: "Cihazının temasını takip eder", icon: "phone-portrait-outline" },
  { value: "light", description: "Her zaman açık tema kullan", icon: "sunny-outline" },
  { value: "dark", description: "Her zaman koyu tema kullan", icon: "moon-outline" },
];

export default function AppearanceRoute() {
  const { mode, setThemeMode, colors } = useTheme();

  return (
    <ProfileDetailShell
      title="Görünüm"
      subtitle="Uygulamanın görünümünü seç; değişiklik anında uygulanır."
    >
      {OPTIONS.map((option) => {
        const selected = mode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setThemeMode(option.value)}
            style={[
              styles.card,
              { borderColor: colors.border, backgroundColor: colors.card },
              selected && { borderColor: colors.primary, backgroundColor: colors.cardActive },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name={option.icon} size={18} color={selected ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.label, { color: colors.text }]}>{APPEARANCE_LABELS[option.value]}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{option.description}</Text>
            </View>
            <View
              style={[
                styles.indicator,
                { borderColor: colors.border },
                selected && { borderColor: colors.primary, backgroundColor: colors.primary },
              ]}
            >
              {selected ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
          </Pressable>
        );
      })}
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 12, marginTop: 2 },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
