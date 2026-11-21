import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getEquipmentList } from "../../../../services/api/equipment";
import { EquipmentListItem, TrainingFocus, TrainingPreferences } from "../../../../services/api/types";
import { DAY_OPTIONS, FOCUS_OPTIONS, MINUTE_OPTIONS } from "../../../../shared/training/format";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  initial: TrainingPreferences | null;
  /** Aktif program varken yeni versiyon "öneri" olarak olusur; metin buna gore degisir. */
  hasActiveProgram: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (request: TrainingPreferences) => void;
  onCancel?: () => void;
};

/** Program olusturma / tercih guncelleme formu: hedef, gun sayisi, seans suresi, ekipman. */
export function GenerateForm({ initial, hasActiveProgram, isSubmitting, error, onSubmit, onCancel }: Props) {
  const { colors } = useTheme();
  const [focus, setFocus] = useState<TrainingFocus>((initial?.focus as TrainingFocus) ?? "Hypertrophy");
  const [days, setDays] = useState<number>(initial?.daysPerWeek ?? 3);
  const [minutes, setMinutes] = useState<number>(initial?.sessionMinutes ?? 60);
  const [equipment, setEquipment] = useState<EquipmentListItem[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>(initial?.equipmentIds ?? []);

  useEffect(() => {
    getEquipmentList().then(setEquipment).catch(() => setEquipment([]));
  }, []);

  const chip = (selected: boolean) => [
    styles.chip,
    {
      backgroundColor: selected ? colors.primary : colors.inputBackground,
      borderColor: selected ? colors.primary : colors.border,
    },
  ];
  const chipText = (selected: boolean) => [styles.chipLabel, { color: selected ? "#FFFFFF" : colors.text }];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {hasActiveProgram ? "Tercihlerini güncelle" : "Kişisel programını oluştur"}
      </Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {hasActiveProgram
          ? "Yeni versiyon öneri olarak hazırlanır; sen onaylayana kadar aktif programın değişmez."
          : "Egzersizler uygulamadaki egzersiz veritabanından seçilir. Ağırlığını bilmediğin hareketlerde ilk seans kalibrasyonla başlar."}
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Hedef</Text>
      <View style={styles.wrap}>
        {FOCUS_OPTIONS.map((option) => (
          <Pressable key={option.value} style={chip(focus === option.value)} onPress={() => setFocus(option.value)} accessibilityRole="button">
            <Text style={chipText(focus === option.value)}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>{FOCUS_OPTIONS.find((f) => f.value === focus)?.description}</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Haftada kaç gün?</Text>
      <View style={styles.row}>
        {DAY_OPTIONS.map((value) => (
          <Pressable key={value} style={[...chip(days === value), styles.flex]} onPress={() => setDays(value)} accessibilityRole="button">
            <Text style={chipText(days === value)}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Seans süresi (dk)</Text>
      <View style={styles.row}>
        {MINUTE_OPTIONS.map((value) => (
          <Pressable key={value} style={[...chip(minutes === value), styles.flex]} onPress={() => setMinutes(value)} accessibilityRole="button">
            <Text style={chipText(minutes === value)}>{value}</Text>
          </Pressable>
        ))}
      </View>

      {equipment.length > 0 ? (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Kullanabildiğin ekipman</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Seçmezsen profilindeki bilgi kullanılır (salon = tüm ekipman). Seçersen yalnızca bunlarla yapılabilen egzersizler gelir.
          </Text>
          <View style={styles.wrap}>
            {equipment.map((item) => {
              const selected = selectedEquipment.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={chip(selected)}
                  onPress={() =>
                    setSelectedEquipment((prev) => (selected ? prev.filter((id) => id !== item.id) : [...prev, item.id]))
                  }
                  accessibilityRole="button"
                >
                  <Text style={chipText(selected)}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Pressable
        disabled={isSubmitting}
        onPress={() =>
          onSubmit({
            ...initial,
            focus,
            daysPerWeek: days,
            sessionMinutes: minutes,
            equipmentIds: selectedEquipment,
            equipmentMode: undefined,
          })
        }
        style={[styles.primary, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryLabel}>
          {isSubmitting ? "Hazırlanıyor..." : hasActiveProgram ? "Yeni versiyonu hazırla" : "Programı oluştur"}
        </Text>
      </Pressable>
      {onCancel ? (
        <Pressable onPress={onCancel} style={styles.secondary} accessibilityRole="button">
          <Text style={[styles.secondaryLabel, { color: colors.textSecondary }]}>Vazgeç</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 38, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  error: { fontSize: 12, fontWeight: "600" },
  primary: { marginTop: 6, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  secondary: { height: 36, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 13, fontWeight: "600" },
});
