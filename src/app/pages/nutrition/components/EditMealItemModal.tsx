import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../../services/api/client";
import { deleteMealItem, getMealItem, updateMealItem } from "../../../../services/api/nutrition";
import { MealItemDetail } from "../../../../services/api/types";
import { useDragToClose } from "../../../../shared/sheet/useDragToClose";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { MealEntry } from "../types";
import { FoodPortionPicker, PortionSelection } from "./FoodPortionPicker";

type Props = {
  /** Duzenlenen kaydin kimligi; null ise pencere kapalidir. */
  mealId: string | null;
  onUpdated: (entry: MealEntry) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Gunlukteki bir kayda dokununca acilir: miktari (g/ml ya da porsiyon) degistirir veya kaydi siler. */
export function EditMealItemModal({ mealId, onUpdated, onDeleted, onClose }: Props) {
  const { colors } = useTheme();
  const [detail, setDetail] = useState<MealItemDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { translateY: dragY, panHandlers } = useDragToClose(mealId !== null, onClose);

  useEffect(() => {
    if (!mealId) return;
    const controller = new AbortController();
    setDetail(null);
    setLoadError(null);
    setActionError(null);
    getMealItem(Number(mealId), controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setDetail(response);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(error, "Kayıt yüklenemedi."));
      });
    return () => controller.abort();
  }, [mealId, reloadKey]);

  const busy = isSaving || isDeleting;

  const handleSave = async (selection: PortionSelection) => {
    if (!detail || busy) return;
    setIsSaving(true);
    setActionError(null);
    try {
      const entry = await updateMealItem(detail.id, selection);
      onUpdated({ id: String(entry.id), type: entry.type, name: entry.name, calories: entry.calories });
    } catch (error) {
      setActionError(errorMessage(error, "Değişiklik kaydedilemedi. Lütfen tekrar deneyin."));
    } finally {
      setIsSaving(false);
    }
  };

  const runDelete = async () => {
    if (!detail || busy) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteMealItem(detail.id);
      onDeleted(String(detail.id));
    } catch (error) {
      setActionError(errorMessage(error, "Kayıt silinemedi. Lütfen tekrar deneyin."));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!detail) return;
    Alert.alert("Öğünden sil", `${detail.name} bugünkü kayıtlarından silinecek.`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => void runDelete() },
    ]);
  };

  return (
    <Modal visible={mealId !== null} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: dragY }] }]}>
          <SafeAreaView
            style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}
            edges={["bottom"]}
          >
            <View testID="edit-meal-drag-area" {...panHandlers}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.header}>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Öğünü Düzenle</Text>
                  {detail ? (
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{detail.type}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat"
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>

            {loadError ? (
              <View style={styles.stateBox}>
                <Text style={[styles.stateText, { color: colors.textSecondary }]}>{loadError}</Text>
                <Pressable onPress={() => setReloadKey((k) => k + 1)} hitSlop={8}>
                  <Text style={[styles.linkLabel, { color: colors.primary }]}>Tekrar dene</Text>
                </Pressable>
              </View>
            ) : !detail ? (
              <View style={styles.stateBox} testID="edit-meal-loading">
                <DumbbellSpinner color={colors.primary} />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {actionError ? <Text style={[styles.errorText, { color: colors.danger }]}>{actionError}</Text> : null}
                <FoodPortionPicker
                  key={detail.id}
                  food={detail.food}
                  initialValue={detail.amount ?? detail.quantity}
                  confirmLabel="Kaydet"
                  isSubmitting={isSaving}
                  onConfirm={handleSave}
                />
                <Pressable
                  testID="edit-meal-delete"
                  onPress={confirmDelete}
                  disabled={busy}
                  accessibilityRole="button"
                  style={[styles.deleteButton, { borderColor: colors.danger, opacity: busy ? 0.5 : 1 }]}
                >
                  {isDeleting ? (
                    <DumbbellSpinner color={colors.danger} />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={[styles.deleteLabel, { color: colors.danger }]}>Öğünden sil</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheetWrapper: { maxHeight: "85%" },
  sheet: {
    flexShrink: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, marginTop: 10 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stateBox: { alignItems: "center", gap: 12, paddingVertical: 40 },
  stateText: { fontSize: 13, textAlign: "center" },
  linkLabel: { fontSize: 13, fontWeight: "700" },
  errorText: { fontSize: 12, fontWeight: "600", marginTop: 12 },
  deleteButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  deleteLabel: { fontSize: 14, fontWeight: "700" },
});
