import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { EmptyState } from "../components/EmptyState";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { useAddresses, useStore } from "../hooks";
import { DeliveryAddress } from "../types";
import { AddressErrors, AddressForm, EMPTY_ADDRESS_FORM, hasErrors, validateAddress } from "../utils/validation";

export function AddressesScreen() {
  const { colors } = useTheme();
  const { isLoading, error: storeError, reload } = useStore();
  const { addresses, save, remove } = useAddresses();
  const [editing, setEditing] = useState<{ id?: string; isDefault?: boolean } | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openNew = () => {
    setForm(EMPTY_ADDRESS_FORM);
    setErrors({});
    setNotice(null);
    setEditing({});
  };
  const openEdit = (a: DeliveryAddress) => {
    setForm({ title: a.title, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, address: a.address });
    setErrors({});
    setNotice(null);
    setEditing({ id: a.id, isDefault: a.isDefault });
  };
  const submit = async () => {
    if (busy) return;
    const found = validateAddress(form);
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy("form");
    setNotice(null);
    // Ilk adres sunucuda otomatik varsayilan olur; duzenlemede mevcut varsayilan bilgisi korunur.
    const result = await save({ ...form, id: editing?.id, isDefault: editing?.isDefault });
    setBusy(null);
    if (result.ok) setEditing(null);
    else setNotice(result.message);
  };
  const doRemove = async (a: DeliveryAddress) => {
    setBusy(a.id);
    setNotice(null);
    const result = await remove(a.id);
    setBusy(null);
    if (!result.ok) setNotice(result.message);
  };
  const makeDefault = async (a: DeliveryAddress) => {
    setBusy(a.id);
    setNotice(null);
    const { id, isDefault: _ignored, ...rest } = a;
    const result = await save({ ...rest, id, isDefault: true });
    setBusy(null);
    if (!result.ok) setNotice(result.message);
  };
  const confirmRemove = (a: DeliveryAddress) =>
    Alert.alert("Adresi sil", `“${a.title}” adresi silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => void doRemove(a) },
    ]);

  const banner = notice ? (
    <View style={[styles.banner, { backgroundColor: colors.dangerBackground }]} testID="address-notice" accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Text style={[styles.bannerText, { color: colors.danger }]}>{notice}</Text>
    </View>
  ) : null;

  if (editing) {
    return (
      <StoreScreenShell
        title={editing.id ? "Adresi Düzenle" : "Yeni Adres"}
        onBack={() => setEditing(null)}
        testID="address-form"
        footer={
          <Pressable
            onPress={submit}
            disabled={busy === "form"}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy === "form", busy: busy === "form" }}
            testID="save-address"
            style={[styles.cta, { backgroundColor: colors.primary, opacity: busy === "form" ? 0.7 : 1 }]}
          >
            {busy === "form" ? <DumbbellSpinner color="#FFFFFF" /> : <Text style={styles.ctaLabel}>Kaydet</Text>}
          </Pressable>
        }
      >
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {banner}
            <AddressFormFields value={form} errors={errors} onChange={setForm} />
          </ScrollView>
        </KeyboardAvoidingView>
      </StoreScreenShell>
    );
  }

  if (storeError || isLoading) {
    return (
      <StoreScreenShell title="Adreslerim" testID="addresses-screen">
        {storeError ? (
          <EmptyState icon="cloud-offline-outline" title="Adresler yüklenemedi" message={storeError} actionLabel="Tekrar dene" onAction={reload} testID="addresses-error" />
        ) : (
          <View style={styles.centered} testID="addresses-loading">
            <DumbbellSpinner color={colors.primary} size="large" />
          </View>
        )}
      </StoreScreenShell>
    );
  }

  return (
    <StoreScreenShell
      title="Adreslerim"
      testID="addresses-screen"
      right={
        <Pressable onPress={openNew} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yeni adres ekle" testID="add-address" style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      }
    >
      <FlatList
        data={addresses}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: item.isDefault ? colors.primary : colors.border, opacity: busy === item.id ? 0.6 : 1 }]} testID={`address-${item.id}`}>
            <View style={styles.cardTop}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              {item.isDefault ? <Text style={[styles.badge, { color: colors.primary }]}>Varsayılan</Text> : null}
              <Pressable onPress={() => openEdit(item)} disabled={busy !== null} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${item.title} adresini düzenle`}>
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => confirmRemove(item)} disabled={busy !== null} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${item.title} adresini sil`} testID={`delete-address-${item.id}`}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
            <Text style={[styles.meta, { color: colors.text }]}>{item.fullName}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.address}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {item.district} / {item.city} · {item.phone}
            </Text>
            {!item.isDefault ? (
              <Pressable onPress={() => void makeDefault(item)} disabled={busy !== null} accessibilityRole="button" testID={`default-address-${item.id}`} style={styles.defaultLink}>
                <Text style={[styles.defaultLabel, { color: colors.primary }]}>Varsayılan yap</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        ListHeaderComponent={banner ?? undefined}
        ItemSeparatorComponent={Sep}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="location-outline" title="Kayıtlı adresin yok" message="Siparişlerinde kullanmak için adres ekleyebilirsin." actionLabel="Adres ekle" onAction={openNew} testID="addresses-empty" />}
        showsVerticalScrollIndicator={false}
      />
    </StoreScreenShell>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingBottom: 32 },
  sep: { height: 12 },
  centered: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 12 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: "600" },
  badge: { fontSize: 11, fontWeight: "700" },
  defaultLink: { alignSelf: "flex-start", marginTop: 6 },
  defaultLabel: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 13, lineHeight: 18 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cta: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
