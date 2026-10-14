import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError } from "../../../../services/api/client";
import {
  analyzeFoodPhoto,
  confirmFoodAnalysis,
  FoodPhotoUpload,
  getFoodAnalysisStatus,
} from "../../../../services/api/foodAnalysis";
import { ApiMealType, FoodAnalysisItem, FoodAnalysisResult, FoodAnalysisStatus } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import {
  analysisErrorMessage,
  computeTotals,
  FALLBACK_DATA_NOTICE,
  formatGrams,
  formatMacro,
  isRetryableAnalysisError,
  MAX_GRAMS,
  MIN_GRAMS,
  nutrientsFor,
  parseGrams,
  PhotoSource,
  pickFoodPhoto,
  prepareFoodPhoto,
} from "../foodPhoto";
import { MealEntry } from "../types";
import { CapturedPhoto, FoodPhotoCamera } from "./FoodPhotoCamera";

type Phase = "choose" | "camera" | "analyzing" | "error" | "result";

type Props = {
  mealType: ApiMealType;
  /** "yyyy-MM-dd" */
  date: string;
  /** Onaydan sonra gunluge eklenen kayitlar. */
  onLogged: (entries: MealEntry[]) => void;
  onBack: () => void;
};

/**
 * Fotograftan ogun ekleme: kamera/galeri -> kucultme + JPEG -> sunucuda analiz -> kullanici porsiyonlari duzenler
 * ve onaylar -> mevcut ogun kaydina yazilir. Analiz sonucu kullanici "Öğüne kaydet"e basmadan kaydedilmez.
 */
export function FoodPhotoAnalysis({ mealType, date, onLogged, onBack }: Props) {
  const { colors, isDark } = useTheme();
  const [phase, setPhase] = useState<Phase>("choose");
  const [status, setStatus] = useState<FoodAnalysisStatus | null>(null);
  const [denied, setDenied] = useState<{ source: PhotoSource; canAskAgain: boolean } | null>(null);
  const [photo, setPhoto] = useState<FoodPhotoUpload | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [gramsText, setGramsText] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [portionChecked, setPortionChecked] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const analysisRef = useRef<AbortController | null>(null);
  const savedRef = useRef(false);

  // Kalan hak ve veri kullanimi bilgisi; sunucuya ulasilamazsa varsayilan bilgilendirme gosterilir.
  useEffect(() => {
    const controller = new AbortController();
    getFoodAnalysisStatus(controller.signal)
      .then(setStatus)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // Ekran kapanirsa suren analiz iptal edilir.
  useEffect(() => () => analysisRef.current?.abort(), []);

  const runAnalysis = async (upload: FoodPhotoUpload) => {
    const controller = new AbortController();
    analysisRef.current = controller;
    setPhase("analyzing");
    setError(null);
    try {
      const analysis = await analyzeFoodPhoto(upload, controller.signal);
      if (controller.signal.aborted) return;
      setResult(analysis);
      // Duz sayi: yerel binlik ayirici ("1.200") ondalik olarak okunmasin.
      setGramsText(Object.fromEntries(analysis.items.map((i) => [i.itemId, String(Math.round(i.estimatedGrams))])));
      setSelected(Object.fromEntries(analysis.items.map((i) => [i.itemId, true])));
      setPortionChecked({});
      setStatus((prev) => (prev ? { ...prev, remainingAnalyses: analysis.remainingAnalyses } : prev));
      setPhase("result");
    } catch (e) {
      if (controller.signal.aborted) return;
      setError({ message: analysisErrorMessage(e), retryable: isRetryableAnalysisError(e) });
      setPhase("error");
    } finally {
      if (analysisRef.current === controller) analysisRef.current = null;
    }
  };

  const handlePick = async (source: PhotoSource) => {
    setDenied(null);
    setError(null);
    try {
      const picked = await pickFoodPhoto(source);
      if (picked.status === "denied") {
        setDenied({ source: picked.source, canAskAgain: picked.canAskAgain });
        return;
      }
      if (picked.status === "canceled") return;
      await analyzePicked(picked);
    } catch (e) {
      setError({ message: analysisErrorMessage(e), retryable: false });
      setPhase("error");
    }
  };

  /** Secilen ya da cekilen fotografi kucultup analize gonderir. */
  const analyzePicked = async (picked: CapturedPhoto) => {
    setPhase("analyzing");
    try {
      const upload = await prepareFoodPhoto(picked);
      setPhoto(upload);
      await runAnalysis(upload);
    } catch (e) {
      setError({ message: analysisErrorMessage(e), retryable: false });
      setPhase("error");
    }
  };

  const handleCancelAnalysis = () => {
    analysisRef.current?.abort();
    analysisRef.current = null;
    setPhase("choose");
  };

  const startOver = () => {
    setResult(null);
    setPhoto(null);
    setError(null);
    setSaveError(null);
    setPhase("choose");
  };

  const items = result?.items ?? [];
  const grams = Object.fromEntries(items.map((i) => [i.itemId, parseGrams(gramsText[i.itemId] ?? "")]));
  const totals = computeTotals(items, grams, selected);
  const selectedItems = items.filter((i) => selected[i.itemId]);
  const hasInvalidGrams = selectedItems.some((i) => grams[i.itemId] == null);
  const needsCheck = selectedItems.filter((i) => i.needsPortionConfirmation && !portionChecked[i.itemId]);
  const canSave = selectedItems.length > 0 && !hasInvalidGrams && needsCheck.length === 0 && !isSaving;

  const handleSave = async () => {
    if (!result || !canSave || savedRef.current) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await confirmFoodAnalysis(result.analysisId, {
        date,
        mealType,
        items: selectedItems.map((i) => ({ itemId: i.itemId, grams: grams[i.itemId] as number })),
      });
      savedRef.current = true;
      onLogged(response.entries.map((e) => ({ id: String(e.id), type: e.type, name: e.name, calories: e.calories })));
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Öğün kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const notice = status?.dataNotice || FALLBACK_DATA_NOTICE;
  const disabled = status?.enabled === false;
  const outOfQuota = status != null && status.remainingAnalyses <= 0;

  const backRow = (
    <Pressable onPress={phase === "result" ? startOver : onBack} hitSlop={8} style={styles.backRow}>
      <Ionicons name="chevron-back" size={16} color={colors.primary} />
      <Text style={[styles.backLabel, { color: colors.primary }]}>{phase === "result" ? "Yeni fotoğraf" : "Geri"}</Text>
    </Pressable>
  );

  if (phase === "camera") {
    return <FoodPhotoCamera onCaptured={analyzePicked} onCancel={() => setPhase("choose")} />;
  }

  if (phase === "analyzing") {
    return (
      <View style={styles.centerBox} testID="food-photo-analyzing">
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.centerTitle, { color: colors.text }]}>Fotoğraf analiz ediliyor...</Text>
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>Bu işlem birkaç saniye sürebilir.</Text>
        <Pressable onPress={handleCancelAnalysis} hitSlop={8}>
          <Text style={[styles.linkLabel, { color: colors.textSecondary }]}>Vazgeç</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "error" && error) {
    return (
      <View style={styles.container}>
        {backRow}
        <View style={styles.centerBox} testID="food-photo-error">
          <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          <Text style={[styles.centerText, { color: colors.text }]}>{error.message}</Text>
          {error.retryable && photo ? (
            <Pressable onPress={() => runAnalysis(photo)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryLabel}>Tekrar dene</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={startOver} hitSlop={8}>
            <Text style={[styles.linkLabel, { color: colors.primary }]}>Başka fotoğraf seç</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === "result" && result) {
    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {backRow}
          <Text style={[styles.title, { color: colors.text }]}>{result.foodName}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Değerler fotoğraftan tahmin edildi; gramajları kontrol edip düzeltebilirsin.
          </Text>

          {result.warnings.length > 0 || result.unidentifiedItems.length > 0 ? (
            <View style={[styles.warningBox, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]} testID="food-photo-warnings">
              {result.warnings.map((w) => (
                <Text key={w} style={[styles.warningText, { color: colors.text }]}>• {w}</Text>
              ))}
              {result.unidentifiedItems.length > 0 ? (
                <Text style={[styles.warningText, { color: colors.text }]}>
                  • Tanımlanamayanlar: {result.unidentifiedItems.join(", ")}. Bunları listeden arayarak ekleyebilirsin.
                </Text>
              ) : null}
            </View>
          ) : null}

          {items.map((item) => (
            <ItemRow
              key={item.itemId}
              item={item}
              text={gramsText[item.itemId] ?? ""}
              grams={grams[item.itemId]}
              selected={!!selected[item.itemId]}
              checked={!!portionChecked[item.itemId]}
              isDark={isDark}
              onChangeText={(t) => setGramsText((prev) => ({ ...prev, [item.itemId]: t }))}
              onToggleSelected={() => setSelected((prev) => ({ ...prev, [item.itemId]: !prev[item.itemId] }))}
              onToggleChecked={() => setPortionChecked((prev) => ({ ...prev, [item.itemId]: !prev[item.itemId] }))}
            />
          ))}

          <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="food-photo-totals">
            <Text style={[styles.totalsLabel, { color: colors.textSecondary }]}>Toplam (tahmini) · {formatGrams(totals.grams)} g</Text>
            <Text style={[styles.totalsCalories, { color: colors.text }]}>{Math.round(totals.calories)} kcal</Text>
            <Text style={[styles.macroText, { color: colors.textSecondary }]}>
              Protein {formatMacro(totals.protein)} g · Karb. {formatMacro(totals.carbs)} g · Yağ {formatMacro(totals.fat)} g
            </Text>
          </View>

          {needsCheck.length > 0 ? (
            <Text style={[styles.hint, { color: colors.danger }]}>Kaydetmeden önce işaretli porsiyonları kontrol et.</Text>
          ) : null}
          {saveError ? <Text style={[styles.hint, { color: colors.danger }]}>{saveError}</Text> : null}

          <Pressable
            disabled={!canSave}
            onPress={handleSave}
            testID="food-photo-save"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            style={[styles.primaryButton, styles.saveButton, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 }]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryLabel}>Öğüne kaydet · {Math.round(totals.calories)} kcal</Text>
            )}
          </Pressable>
        </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {backRow}
      <Text style={[styles.title, { color: colors.text }]}>Fotoğrafla ekle</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tabağın tamamı görünecek şekilde, yukarıdan ve iyi ışıkta çek. Sonuçları kaydetmeden önce düzenleyebilirsin.
      </Text>

      {denied ? (
        <View style={[styles.warningBox, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]} testID="food-photo-denied">
          <Text style={[styles.warningText, { color: colors.text }]}>
            {denied.source === "camera"
              ? "Fotoğraf çekmek için kamera izni gerekiyor."
              : "Galeriden fotoğraf seçmek için fotoğraflara erişim izni gerekiyor."}
          </Text>
          {!denied.canAskAgain ? (
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={[styles.linkLabel, { color: colors.primary }]}>Ayarları aç</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {disabled ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Fotoğraf analizi şu anda kullanılamıyor. Öğünü listeden arayarak ekleyebilirsin.</Text>
      ) : outOfQuota ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Bugünlük fotoğraf analizi hakkın doldu. Öğünü listeden arayarak ekleyebilirsin.</Text>
      ) : (
        <View style={styles.sourceRow}>
          <SourceButton icon="camera-outline" label="Fotoğraf çek" onPress={() => {
              setDenied(null);
              setPhase("camera");
            }} testID="food-photo-camera" />
          <SourceButton icon="images-outline" label="Galeriden seç" onPress={() => handlePick("library")} testID="food-photo-library" />
        </View>
      )}

      {status && !disabled ? (
        <Text style={[styles.quota, { color: colors.textSecondary }]}>
          Bugün kalan analiz hakkın: {status.remainingAnalyses}/{status.dailyLimit}
        </Text>
      ) : null}

      <View style={[styles.noticeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.noticeText, { color: colors.textSecondary }]} testID="food-photo-notice">{notice}</Text>
      </View>
    </View>
  );
}

function SourceButton({ icon, label, onPress, testID }: { icon: "camera-outline" | "images-outline"; label: string; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={[styles.sourceButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
    >
      <Ionicons name={icon} size={26} color={colors.primary} />
      <Text style={[styles.sourceLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

type ItemRowProps = {
  item: FoodAnalysisItem;
  text: string;
  grams: number | null;
  selected: boolean;
  checked: boolean;
  isDark: boolean;
  onChangeText: (text: string) => void;
  onToggleSelected: () => void;
  onToggleChecked: () => void;
};

function ItemRow({ item, text, grams, selected, checked, isDark, onChangeText, onToggleSelected, onToggleChecked }: ItemRowProps) {
  const { colors } = useTheme();
  const values = grams != null ? nutrientsFor(item.per100g, grams) : null;
  const sourceLabel = item.nutritionSource === "catalog" ? "Besin kataloğu" : "Yapay zekâ tahmini";

  return (
    <View
      testID={`food-photo-item-${item.itemId}`}
      style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: selected ? 1 : 0.55 }]}
    >
      <View style={styles.itemHeader}>
        <Pressable onPress={onToggleSelected} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={`${item.foodName} dahil`} testID={`food-photo-include-${item.itemId}`}>
          <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.foodName}</Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            {sourceLabel} · tanıma güveni %{Math.round(item.confidence * 100)} · tahmini {formatGrams(item.minGrams)}–{formatGrams(item.maxGrams)} g
          </Text>
        </View>
      </View>

      {selected ? (
        <>
          <View style={styles.gramsRow}>
            <View style={[styles.inputWrapper, { borderColor: grams == null ? colors.danger : colors.border, backgroundColor: colors.inputBackground }]}>
              <TextInput
                value={text}
                onChangeText={onChangeText}
                keyboardType="decimal-pad"
                keyboardAppearance={isDark ? "dark" : "light"}
                selectTextOnFocus
                style={[styles.input, { color: colors.text }]}
                accessibilityLabel={`${item.foodName} gram`}
                testID={`food-photo-grams-${item.itemId}`}
              />
              <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>g</Text>
            </View>
            <View style={styles.itemValues}>
              <Text style={[styles.itemCalories, { color: colors.text }]} testID={`food-photo-kcal-${item.itemId}`}>
                {values ? `${Math.round(values.calories)} kcal` : "-"}
              </Text>
              {values ? (
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                  P {formatMacro(values.protein)} · K {formatMacro(values.carbs)} · Y {formatMacro(values.fat)} g
                </Text>
              ) : null}
            </View>
          </View>
          {grams == null ? (
            <Text style={[styles.hint, { color: colors.danger }]}>{MIN_GRAMS} ile {MAX_GRAMS} g arasında bir değer gir.</Text>
          ) : null}
          {item.note ? <Text style={[styles.itemMeta, styles.note, { color: colors.textSecondary }]}>{item.note}</Text> : null}
          {item.needsPortionConfirmation ? (
            <Pressable onPress={onToggleChecked} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked }} testID={`food-photo-confirm-${item.itemId}`}>
              <Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={18} color={checked ? colors.primary : colors.danger} />
              <Text style={[styles.checkLabel, { color: colors.text }]}>Porsiyon belirsiz; gramajı kontrol ettim</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingTop: 12, paddingBottom: 24 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  backLabel: { fontSize: 13, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "700", marginTop: 12 },
  subtitle: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  sourceRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  sourceButton: {
    flex: 1,
    height: 92,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sourceLabel: { fontSize: 13, fontWeight: "700" },
  quota: { fontSize: 12, fontWeight: "600", marginTop: 12 },
  noticeBox: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginTop: 16,
  },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  warningBox: { borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 14, gap: 6 },
  warningText: { fontSize: 12, lineHeight: 17 },
  centerBox: { alignItems: "center", gap: 12, paddingVertical: 36, paddingHorizontal: 12 },
  centerTitle: { fontSize: 15, fontWeight: "700" },
  centerText: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  linkLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  saveButton: { marginTop: 16 },
  primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  itemCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 12 },
  itemHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  itemName: { fontSize: 14, fontWeight: "700" },
  itemMeta: { fontSize: 11, marginTop: 2 },
  note: { marginTop: 8 },
  gramsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: 110,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, fontWeight: "700", padding: 0 },
  inputUnit: { fontSize: 13, fontWeight: "600" },
  itemValues: { flex: 1, alignItems: "flex-end" },
  itemCalories: { fontSize: 16, fontWeight: "800" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  checkLabel: { fontSize: 12, fontWeight: "600" },
  totalsCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginTop: 16 },
  totalsLabel: { fontSize: 12, fontWeight: "600" },
  totalsCalories: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  macroText: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  hint: { fontSize: 12, fontWeight: "600", marginTop: 8 },
});
