import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { ProductImage } from "../components/ProductImage";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { FALLBACK_PRODUCT_ICON } from "../components/categoryIcons";
import { useAddresses, useCart, useCheckoutOptions, useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { PaymentMethod } from "../types";
import { formatPrice } from "../utils/pricing";
import { AddressErrors, AddressForm, EMPTY_ADDRESS_FORM, hasErrors, validateAddress } from "../utils/validation";

const STEPS = ["Teslimat", "Özet", "Ödeme"] as const;
const PAYMENT_ICONS: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  cash_on_delivery: "cash-outline",
  bank_transfer: "business-outline",
  card: "card-outline",
};
/** Bu kodlarla reddedilen sipariste kullanici guncel ozeti gormeli (sepet/fiyat/stok degisti). */
const RECHECK_CODES = ["PRICE_CHANGED", "CART_CHANGED", "OUT_OF_STOCK"];

/** Her siparis denemesi icin tekil anahtar: ag hatasindan sonra tekrar gonderilen istek ikinci siparis olusturmaz. */
function newIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function CheckoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isLoading: storeLoading, error: storeError, reload, placeOrder } = useStore();
  const { cart, items, totals, refresh } = useCart();
  const { addresses, save } = useAddresses();
  const { options, isLoading: optionsLoading, error: optionsError, reload: reloadOptions } = useCheckoutOptions();

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Siparis tamamlaninca sunucu sepeti bosaltir; basari ekranina gecerken "bos sepet" gorunmesin.
  const [completed, setCompleted] = useState(false);
  const idempotencyKeyRef = useRef(newIdempotencyKey());

  // Kayitli adres varsa varsayilan (yoksa ilk) adres secilir; hic yoksa yeni adres formu acilir.
  useEffect(() => {
    // Adresler sunucudan gelmeden "kayitli adres yok" sanilip form acilmasin.
    if (storeLoading) return;
    if (selectedAddressId && addresses.some((a) => a.id === selectedAddressId)) return;
    const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
    setSelectedAddressId(preferred?.id ?? null);
    if (!preferred) setAddingNew(true);
  }, [addresses, selectedAddressId, storeLoading]);

  useEffect(() => {
    if (payment || !options) return;
    setPayment(options.paymentMethods.find((m) => m.available)?.method ?? null);
  }, [options, payment]);

  const goBackStep = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else if (router.canGoBack()) router.back();
    else router.replace(storeRoutes.cart());
  }, [router, step]);

  // Android donanim geri tusu: onceki adima doner, ilk adimdaysa normal geri.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (step > 0) {
          setStep((s) => s - 1);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [step]),
  );

  if (storeError) {
    return (
      <StoreScreenShell title="Ödeme">
        <EmptyState icon="cloud-offline-outline" title="Bilgiler yüklenemedi" message={storeError} actionLabel="Tekrar dene" onAction={reload} testID="checkout-error-state" />
      </StoreScreenShell>
    );
  }
  if (storeLoading) {
    return (
      <StoreScreenShell title="Ödeme">
        <View style={styles.centered} testID="checkout-loading">
          <DumbbellSpinner color={colors.primary} size="large" />
        </View>
      </StoreScreenShell>
    );
  }
  if (items.length === 0 && !completed) {
    return (
      <StoreScreenShell title="Ödeme">
        <EmptyState icon="cart-outline" title="Sepetin boş" message="Ödeme adımına geçmek için sepete ürün ekle." actionLabel="MB Shop'a dön" onAction={() => router.replace(storeRoutes.home())} testID="checkout-empty" />
      </StoreScreenShell>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const selectedOption = options?.paymentMethods.find((m) => m.method === payment);

  const confirmAddress = async () => {
    if (!addingNew) {
      if (!selectedAddress) {
        setSubmitError("Teslimat adresi seçin.");
        return;
      }
      setStep(1);
      return;
    }
    const found = validateAddress(form);
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy(true);
    // Yeni adres once adres defterine kaydedilir; siparis yalnizca kayitli adresin id'siyle verilir.
    const result = await save({ ...form, isDefault: addresses.length === 0 });
    setBusy(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setSelectedAddressId(result.data.id);
    setAddingNew(false);
    setForm(EMPTY_ADDRESS_FORM);
    setStep(1);
  };

  const submit = async () => {
    if (busy || completed) return;
    if (!selectedAddress || !payment || !selectedOption?.available) {
      setSubmitError("Kullanılabilir bir ödeme yöntemi seçin.");
      return;
    }
    setBusy(true);
    setSubmitError(null);
    const result = await placeOrder({ addressId: selectedAddress.id, paymentMethod: payment, idempotencyKey: idempotencyKeyRef.current, expectedTotal: totals.total });
    if (result.ok) {
      setCompleted(true);
      setBusy(false);
      router.replace(storeRoutes.orderSuccess(result.data.id));
      return;
    }
    setBusy(false);
    setSubmitError(result.network ? `${result.message} Siparişin iki kez oluşmaz; tekrar deneyebilirsin.` : result.message);
    if (!result.network) {
      // Siparis olusmadi: sonraki deneme yeni bir istek sayilir.
      idempotencyKeyRef.current = newIdempotencyKey();
    }
    if (result.code && RECHECK_CODES.includes(result.code)) {
      setStep(1);
    }
  };

  const next = async () => {
    setSubmitError(null);
    if (step === 0) await confirmAddress();
    else if (step === 1) {
      if (!cart.canCheckout) {
        setSubmitError("Sepetinde satın alınamayan ürünler var. Sepetini güncelle.");
        return;
      }
      setStep(2);
    } else await submit();
  };

  const cta = step === 2 ? `Siparişi Onayla · ${formatPrice(totals.total)}` : "Devam Et";
  const ctaDisabled = busy || (step === 2 && (!selectedOption?.available || optionsLoading));

  return (
    <StoreScreenShell
      title="Ödeme"
      subtitle={`Adım ${step + 1} / ${STEPS.length} · ${STEPS[step]}`}
      onBack={goBackStep}
      testID="checkout-screen"
      footer={
        <View style={styles.footer}>
          {submitError ? (
            <Text style={[styles.submitError, { color: colors.danger }]} testID="checkout-error" accessibilityLiveRegion="polite">
              {submitError}
            </Text>
          ) : null}
          <Pressable
            testID="checkout-next"
            onPress={next}
            disabled={ctaDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: ctaDisabled, busy }}
            style={[styles.cta, { backgroundColor: colors.primary, opacity: ctaDisabled ? 0.6 : 1 }]}
          >
            {busy ? <DumbbellSpinner color="#FFFFFF" /> : <Text style={styles.ctaLabel}>{cta}</Text>}
          </Pressable>
        </View>
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <StepIndicator step={step} />

          {step === 0 ? (
            <View style={styles.block} testID="step-delivery">
              {addresses.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressChips}>
                  {addresses.map((a) => {
                    const selected = !addingNew && selectedAddressId === a.id;
                    return (
                      <Pressable
                        key={a.id}
                        testID={`pick-address-${a.id}`}
                        onPress={() => {
                          setSelectedAddressId(a.id);
                          setAddingNew(false);
                          setErrors({});
                          setSubmitError(null);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[styles.addressChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.cardActive : colors.inputBackground }]}
                      >
                        <Ionicons name="location-outline" size={14} color={selected ? colors.primary : colors.text} />
                        <Text style={[styles.addressChipLabel, { color: selected ? colors.primary : colors.text }]}>{a.title}</Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    testID="new-address"
                    onPress={() => {
                      setAddingNew(true);
                      setForm(EMPTY_ADDRESS_FORM);
                      setErrors({});
                      setSubmitError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: addingNew }}
                    style={[styles.addressChip, { borderColor: addingNew ? colors.primary : colors.border, backgroundColor: addingNew ? colors.cardActive : colors.inputBackground }]}
                  >
                    <Ionicons name="add" size={14} color={addingNew ? colors.primary : colors.text} />
                    <Text style={[styles.addressChipLabel, { color: addingNew ? colors.primary : colors.text }]}>Yeni adres</Text>
                  </Pressable>
                </ScrollView>
              ) : null}
              {addingNew ? (
                <AddressFormFields value={form} errors={errors} onChange={setForm} />
              ) : selectedAddress ? (
                <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="selected-address">
                  <Text style={[styles.summaryName, { color: colors.text }]}>
                    {selectedAddress.title} · {selectedAddress.fullName}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{selectedAddress.address}</Text>
                  <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                    {selectedAddress.district} / {selectedAddress.city} · {selectedAddress.phone}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.block} testID="step-summary">
              <Text style={[styles.heading, { color: colors.text }]}>Ürünler</Text>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[styles.summaryLine, { backgroundColor: colors.card, borderColor: item.isAvailable ? colors.border : colors.danger }]}
                  testID={`summary-line-${item.id}`}
                >
                  <ProductImage uri={item.image} icon={FALLBACK_PRODUCT_ICON} style={styles.summaryThumb} iconSize={20} />
                  <View style={styles.summaryText}>
                    <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.variantLabel ? <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{item.variantLabel}</Text> : null}
                    <Text style={[styles.summaryMeta, { color: item.isAvailable ? colors.textSecondary : colors.danger }]}>
                      {item.isAvailable ? `${item.quantity} adet × ${formatPrice(item.unitPrice)}` : item.unavailableReason}
                    </Text>
                  </View>
                  <Text style={[styles.summaryPrice, { color: colors.text }]}>{formatPrice(item.lineTotal)}</Text>
                </View>
              ))}
              {!cart.canCheckout ? (
                <Pressable onPress={() => router.replace(storeRoutes.cart())} accessibilityRole="button" testID="checkout-go-cart">
                  <Text style={[styles.link, { color: colors.primary }]}>Sepeti düzenle</Text>
                </Pressable>
              ) : null}
              <Text style={[styles.heading, { color: colors.text }]}>Teslimat adresi</Text>
              {selectedAddress ? (
                <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.summaryName, { color: colors.text }]}>
                    {selectedAddress.title} · {selectedAddress.fullName}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{selectedAddress.address}</Text>
                  <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                    {selectedAddress.district} / {selectedAddress.city} · {selectedAddress.phone}
                  </Text>
                </View>
              ) : null}
              <OrderSummary {...totals} />
              <Pressable onPress={() => void refresh()} accessibilityRole="button" testID="checkout-refresh">
                <Text style={[styles.link, { color: colors.primary }]}>Fiyatları güncelle</Text>
              </Pressable>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.block} testID="step-payment">
              {optionsLoading && !options ? (
                <View style={styles.centeredSmall}>
                  <DumbbellSpinner color={colors.primary} />
                </View>
              ) : optionsError ? (
                <EmptyState icon="cloud-offline-outline" title="Ödeme seçenekleri yüklenemedi" message={optionsError} actionLabel="Tekrar dene" onAction={reloadOptions} testID="payment-options-error" />
              ) : (
                options?.paymentMethods.map((option) => {
                  const selected = payment === option.method;
                  const disabled = !option.available;
                  return (
                    <Pressable
                      key={option.method}
                      testID={`payment-${option.method}`}
                      onPress={() => setPayment(option.method)}
                      disabled={disabled}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, checked: selected, disabled }}
                      accessibilityLabel={disabled ? `${option.label}, kullanılamıyor` : option.label}
                      style={[
                        styles.paymentCard,
                        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.cardActive : colors.card, opacity: disabled ? 0.55 : 1 },
                      ]}
                    >
                      <Ionicons name={PAYMENT_ICONS[option.method] ?? "wallet-outline"} size={22} color={selected ? colors.primary : colors.text} />
                      <View style={styles.paymentText}>
                        <Text style={[styles.summaryName, { color: colors.text }]}>{option.label}</Text>
                        <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{disabled ? option.unavailableReason ?? option.description : option.description}</Text>
                      </View>
                      <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? colors.primary : colors.icon} />
                    </Pressable>
                  );
                })
              )}
              <OrderSummary {...totals} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </StoreScreenShell>
  );
}

function StepIndicator({ step }: { step: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.steps} accessibilityLabel={`Adım ${step + 1} / ${STEPS.length}`}>
      {STEPS.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[styles.stepBar, { backgroundColor: i <= step ? colors.primary : colors.progressTrack }]} />
          <Text style={[styles.stepLabel, { color: i <= step ? colors.text : colors.textSecondary }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center" },
  centeredSmall: { minHeight: 120, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: GUTTER, paddingBottom: 24, gap: 18 },
  steps: { flexDirection: "row", gap: 8 },
  stepItem: { flex: 1, gap: 6 },
  stepBar: { height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  block: { gap: 14 },
  heading: { fontSize: 15, fontWeight: "700" },
  link: { fontSize: 13, fontWeight: "700" },
  addressChips: { gap: 8 },
  addressChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1 },
  addressChipLabel: { fontSize: 13, fontWeight: "600" },
  summaryLine: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  summaryThumb: { width: 56, height: 56, borderRadius: 8 },
  summaryText: { flex: 1, gap: 2 },
  summaryName: { fontSize: 14, fontWeight: "600" },
  summaryMeta: { fontSize: 12, lineHeight: 17 },
  summaryPrice: { fontSize: 14, fontWeight: "700" },
  addressCard: { padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 3 },
  paymentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  paymentText: { flex: 1, gap: 2 },
  footer: { gap: 8 },
  submitError: { fontSize: 13, fontWeight: "600" },
  cta: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
