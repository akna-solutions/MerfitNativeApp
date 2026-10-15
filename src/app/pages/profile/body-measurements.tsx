import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BodyMeasurement,
  BodyMeasurementHistory,
  createBodyMeasurement,
  getBodyMeasurements,
} from "../../../services/api/bodyMeasurements";
import { isApiError } from "../../../services/api/client";
import {
  BodyMeasurementField,
  parseDecimal,
  validateMeasurement,
} from "../../../shared/bodyComposition/bodyFat";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";
import { useTheme } from "../../../shared/theme/ThemeContext";

type MeasurementKey = BodyMeasurementField;

const MEASUREMENT_INPUTS: { key: MeasurementKey; label: string; field: BodyMeasurementField }[] = [
  { key: "bodyFat", label: "Vücut yağ oranı (%, biliyorsan)", field: "bodyFat" },
  { key: "neck", label: "Boyun çevresi (cm)", field: "neck" },
  { key: "waist", label: "Bel çevresi (cm, göbek hizası)", field: "waist" },
  { key: "hip", label: "Kalça çevresi (cm)", field: "hip" },
  { key: "chest", label: "Göğüs çevresi (cm)", field: "chest" },
  { key: "arm", label: "Kol çevresi (cm)", field: "arm" },
  { key: "thigh", label: "Uyluk çevresi (cm)", field: "thigh" },
];

const EMPTY_MEASUREMENTS: Record<MeasurementKey, string> = {
  bodyFat: "", neck: "", waist: "", hip: "", chest: "", arm: "", thigh: "",
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

/** Gecmis satiri: girilen yag orani "olculen", hesaplanan "tahmini" olarak ayri gosterilir. */
function describeMeasurement(item: BodyMeasurement): string {
  const parts: string[] = [];
  if (item.weightKg != null) parts.push(`${item.weightKg} kg`);
  if (item.bodyFatPercentage != null) parts.push(`yağ %${item.bodyFatPercentage}`);
  else if (item.estimatedBodyFatPercentage != null) parts.push(`yağ %${item.estimatedBodyFatPercentage} (tahmini)`);
  if (item.waistCm != null) parts.push(`bel ${item.waistCm} cm`);
  if (item.neckCm != null) parts.push(`boyun ${item.neckCm} cm`);
  if (item.hipCm != null) parts.push(`kalça ${item.hipCm} cm`);
  if (item.chestCm != null) parts.push(`göğüs ${item.chestCm} cm`);
  if (item.armCm != null) parts.push(`kol ${item.armCm} cm`);
  if (item.thighCm != null) parts.push(`uyluk ${item.thighCm} cm`);
  return parts.join(" · ") || "Ölçüm";
}

export default function BodyMeasurementsRoute() {
  const router = useRouter();
  const { profile, updateProfile, isLoading } = useProfile();
  const { colors } = useTheme();

  // 0 = backend'de kayitli deger yok; kutuyu bos gosteririz (sahte "0" yerine).
  const toInput = (value: number) => (value > 0 ? `${value}` : "");
  const [height, setHeight] = useState(toInput(profile.height));
  const [weight, setWeight] = useState(toInput(profile.weight));
  const [targetWeight, setTargetWeight] = useState(toInput(profile.targetWeight));
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS);
  const [history, setHistory] = useState<BodyMeasurementHistory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // bkz. edit.tsx - ekran profil yuklenmeden once acildiysa formu gercek verilerle senkronize et.
  useEffect(() => {
    if (isLoading) return;
    setHeight(toInput(profile.height));
    setWeight(toInput(profile.weight));
    setTargetWeight(toInput(profile.targetWeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    const controller = new AbortController();
    getBodyMeasurements(controller.signal)
      .then(setHistory)
      .catch((error) => {
        if (!controller.signal.aborted) console.warn("Ölçüm geçmişi alınamadı:", error);
      });
    return () => controller.abort();
  }, []);

  const heightUnit = profile.unitSystem === "metric" ? "cm" : "ft";
  const weightUnit = profile.unitSystem === "metric" ? "kg" : "lb";
  const isFemale = (history?.gender ?? (profile.gender === "Kadın" ? "female" : null)) === "female";
  const visibleInputs = MEASUREMENT_INPUTS;

  const errors: Partial<Record<MeasurementKey, string>> = {};
  visibleInputs.forEach((input) => {
    const raw = measurements[input.key];
    if (!raw.trim()) return;
    const value = parseDecimal(raw);
    const error = value === null ? "Geçerli bir sayı gir." : validateMeasurement(input.field, value);
    if (error) errors[input.key] = error;
  });
  const hasErrors = Object.keys(errors).length > 0;

  const handleSave = async () => {
    if (hasErrors || isSaving) return;
    // Yalnizca gecerli (pozitif) degerler gonderilir; bos birakilan alan degistirilmez.
    const patch: { height?: number; weight?: number; targetWeight?: number } = {};
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const t = parseFloat(targetWeight);
    if (h > 0) patch.height = h;
    if (w > 0) patch.weight = w;
    if (t > 0) patch.targetWeight = t;

    const bodyFatPercentage = parseDecimal(measurements.bodyFat);
    const neckCm = parseDecimal(measurements.neck);
    const waistCm = parseDecimal(measurements.waist);
    const hipCm = parseDecimal(measurements.hip);
    const chestCm = parseDecimal(measurements.chest);
    const armCm = parseDecimal(measurements.arm);
    const thighCm = parseDecimal(measurements.thigh);
    const hasMeasurement = [bodyFatPercentage, neckCm, waistCm, hipCm, chestCm, armCm, thighCm].some(
      (value) => value !== null,
    );

    if (hasMeasurement) {
      // Her kayit yeni bir olcum olarak eklenir; onceki olcumler degistirilmez.
      setIsSaving(true);
      setSaveError(null);
      try {
        await createBodyMeasurement({ bodyFatPercentage, neckCm, waistCm, hipCm, chestCm, armCm, thighCm });
      } catch (error) {
        setSaveError(isApiError(error) ? error.message : "Ölçüm kaydedilemedi. Lütfen tekrar dene.");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    if (Object.keys(patch).length > 0) updateProfile(patch);
    router.back();
  };

  const bodyFat = history?.bodyFat;

  return (
    <ProfileDetailShell
      title="Vücut Ölçümleri"
      footer={
        <OnboardingButton
          label="Değişiklikleri Kaydet"
          onPress={handleSave}
          disabled={hasErrors}
          isLoading={isSaving}
        />
      }
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Boy ({heightUnit})</Text>
      <OnboardingInput
        value={height}
        onChangeText={(text) => setHeight(text.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>Kilo ({weightUnit})</Text>
      <OnboardingInput
        value={weight}
        onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>
        Hedef Kilo ({weightUnit})
      </Text>
      <OnboardingInput
        value={targetWeight}
        onChangeText={(text) => setTargetWeight(text.replace(/[^0-9.]/g, ""))}
        placeholder="Belirlenmedi"
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Hedef kilon, hedefine ve boyuna göre otomatik hesaplanır. Hedefini değiştirince yeniden hesaplanır;
        istersen buradan kendin de belirleyebilirsin.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Yeni ölçüm ekle</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Yağ oranını bilmiyorsan boyun ve bel{isFemale ? " ile kalça" : ""} ölçülerinden tahmin ederiz (US Navy yöntemi).
        Her kayıt geçmişe eklenir; önceki ölçümlerin silinmez.
      </Text>
      {visibleInputs.map((input) => (
        <View key={input.key}>
          <Text style={[styles.label, styles.gapTop, { color: colors.textSecondary }]}>{input.label}</Text>
          <OnboardingInput
            value={measurements[input.key]}
            onChangeText={(text) =>
              setMeasurements((prev) => ({ ...prev, [input.key]: text.replace(/[^0-9.,]/g, "").slice(0, 5) }))
            }
            accessibilityLabel={input.label}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          {errors[input.key] ? (
            <Text style={[styles.error, { color: colors.danger }]}>{errors[input.key]}</Text>
          ) : null}
        </View>
      ))}
      {saveError ? <Text style={[styles.error, { color: colors.danger }]}>{saveError}</Text> : null}

      {bodyFat && bodyFat.percentage != null ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {bodyFat.source === "estimated" ? "Tahmini yağ oranı" : "Yağ oranı"}: %{bodyFat.percentage}
            {bodyFat.marginOfErrorPercent != null ? ` (±${bodyFat.marginOfErrorPercent})` : ""}
          </Text>
          {bodyFat.lowThreshold != null && bodyFat.highThreshold != null ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Yaşın ve cinsiyetin için referans aralık: %{bodyFat.lowThreshold}–%{bodyFat.highThreshold}
            </Text>
          ) : null}
        </View>
      ) : null}

      {history?.showLowBodyFatWarning && history.lowBodyFatWarningMessage ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.hint, { color: colors.text }]}>{history.lowBodyFatWarningMessage}</Text>
        </View>
      ) : null}

      {history && history.measurements.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ölçüm geçmişi</Text>
          {history.measurements.slice(0, 10).map((item) => (
            <View key={item.id} style={[styles.historyRow, { borderColor: colors.border }]}>
              <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{formatDate(item.recordedAt)}</Text>
              <Text style={[styles.historyValue, { color: colors.text }]}>{describeMeasurement(item)}</Text>
            </View>
          ))}
        </>
      ) : null}
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  gapTop: { marginTop: 20 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  input: { fontSize: 20, fontWeight: "700" },
  error: { fontSize: 12, marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 28 },
  card: { marginTop: 16, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  historyRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  historyDate: { fontSize: 11, fontWeight: "600" },
  historyValue: { fontSize: 13, marginTop: 2 },
});
