import { Pressable, StyleSheet, Text, View } from "react-native";

import { RIR_OPTIONS, rirLabel } from "../../../../shared/workout/progression";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  /** Secilen RIR; null = girilmedi (opsiyonel). */
  rir: number | null;
  onRirChange: (value: number | null) => void;
  /** Programdaki hedef RIR (yoksa gosterilmez). */
  targetRir: number | null;
  isWarmup: boolean;
  onWarmupChange: (value: boolean) => void;
  isFailed: boolean;
  onFailedChange: (value: boolean) => void;
  warmupCount: number;
};

/**
 * Set kalitesi: "kaç tekrar daha yapabilirdin" (RIR) seçimi, ısınma ve başarısız set işaretleri.
 * RIR opsiyoneldir; girilmezse sistem ağırlık artışı için kesin karar vermez.
 */
export function SetQualityInput({
  rir,
  onRirChange,
  targetRir,
  isWarmup,
  onWarmupChange,
  isFailed,
  onFailedChange,
  warmupCount,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {!isWarmup ? (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Kaç tekrar daha yapabilirdin? (RIR)</Text>
            {targetRir !== null ? (
              <Text style={[styles.target, { color: colors.primary }]}>Hedef {rirLabel(targetRir)}</Text>
            ) : null}
          </View>
          <View style={styles.chips}>
            {RIR_OPTIONS.map((value) => {
              const selected = rir === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => onRirChange(selected ? null : value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.inputBackground,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`RIR ${rirLabel(value)}`}
                >
                  <Text style={[styles.chipLabel, { color: selected ? "#FFFFFF" : colors.text }]}>{rirLabel(value)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            0 = son tekrardı. Boş bırakabilirsin; girersen ağırlık önerisi kesinleşir.
          </Text>
        </>
      ) : (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Isınma seti hacme ve ağırlık önerisine sayılmaz.
        </Text>
      )}

      <View style={styles.toggles}>
        <Toggle
          label={warmupCount > 0 ? `Isınma seti (${warmupCount})` : "Isınma seti"}
          active={isWarmup}
          onPress={() => onWarmupChange(!isWarmup)}
        />
        <Toggle label="Tamamlayamadım" active={isFailed} onPress={() => onFailedChange(!isFailed)} />
      </View>
    </View>
  );
}

function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggle,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.inputBackground : "transparent",
        },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
    >
      <View
        style={[
          styles.dot,
          { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : "transparent" },
        ]}
      />
      <Text style={[styles.toggleLabel, { color: active ? colors.text : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 20, padding: 16, borderWidth: StyleSheet.hairlineWidth, gap: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  label: { fontSize: 11, fontWeight: "600", flexShrink: 1 },
  target: { fontSize: 11, fontWeight: "700" },
  chips: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 11, lineHeight: 15 },
  toggles: { flexDirection: "row", gap: 8 },
  toggle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, height: 38 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  toggleLabel: { fontSize: 12, fontWeight: "600" },
});
