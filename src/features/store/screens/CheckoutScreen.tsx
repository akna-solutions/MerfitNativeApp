import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { AddressFormFields } from "../components/AddressFormFields";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { ProductImage } from "../components/ProductImage";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { categoryIconFor } from "../components/categoryIcons";
import { PAYMENT_LABELS } from "../components/labels";
import { useAddresses, useCart, useOrders } from "../hooks";
import { storeRoutes } from "../navigation";
import { DeliveryAddress, PaymentMethod } from "../types";
import { formatPrice, variantLabel } from "../utils/pricing";
import { AddressErrors, AddressForm, EMPTY_ADDRESS_FORM, hasErrors, validateAddress } from "../utils/validation";

const STEPS = ["Teslimat", "Özet", "Ödeme"] as const;
const PAYMENT_OPTIONS: { id: PaymentMethod; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { id: "cash_on_delivery", icon: "cash-outline", description: "Demo: gerçek bir ödeme alınmaz." },
  { id: "bank_transfer", icon: "business-outline", description: "Demo: banka hesabı veya IBAN gösterilmez." },
  { id: "card_simulation", icon: "card-outline", description: "Yalnızca simülasyon: kart bilgisi istenmez ve saklanmaz." },
];

export function CheckoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, totals, productsById } = useCart();
  const { placeOrder } = useOrders();
  const { addresses, save } = useAddresses();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  // Kayitli adresler gec yuklenirse ilk adres, kullanici henuz bir sey secmediyse bir kez on doldurulur.
  const prefilledRef = useRef(false);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [payment, setPayment] = useState<PaymentMethod>("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Siparis tamamlandiktan sonra sepet bosalir; bos sepet ekranina dusmemek icin cift gonderimi ve yonlendirmeyi izle.
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const first = addresses[0];
    if (prefilledRef.current || !first) return;
    prefilledRef.current = true;
    setSelectedAddressId(first.id);
    setForm({ title: first.title, fullName: first.fullName, phone: first.phone, city: first.city, district: first.district, address: first.address });
  }, [addresses]);

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

  if (items.length === 0 && !completed) {
    return (
      <StoreScreenShell title="Ödeme">
        <EmptyState icon="cart-outline" title="Sepetin boş" message="Ödeme adımına geçmek için sepete ürün ekle." actionLabel="MB Shop'a dön" onAction={() => router.replace(storeRoutes.home())} testID="checkout-empty" />
      </StoreScreenShell>
    );
  }

  const pickAddress = (address: DeliveryAddress) => {
    prefilledRef.current = true;
    setSelectedAddressId(address.id);
    setForm({ title: address.title, fullName: address.fullName, phone: address.phone, city: address.city, district: address.district, address: address.address });
    setErrors({});
  };

  const next = async () => {
    if (step === 0) {
      const found = validateAddress(form);
      setErrors(found);
      if (hasErrors(found)) return;
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      await submit();
    }
  };

  const submit = async () => {
    if (submitting || completed) return;
    setSubmitting(true);
    setSubmitError(null);
    // Sepet siparisle birlikte bosalir; bu sirada "bos sepet" ekranina dusulmesin.
    setCompleted(true);
    // Kullanici adresi degistirdiyse adres defterine yeni/guncel kayit olarak yazilir.
    const existing = addresses.find((a) => a.id === selectedAddressId);
    const unchanged = existing && existing.title === form.title && existing.fullName === form.fullName && existing.phone === form.phone && existing.city === form.city && existing.district === form.district && existing.address === form.address;
    const address: DeliveryAddress = unchanged && existing ? existing : { ...form, id: `addr-checkout-${Date.now()}` };
    if (!unchanged) await save({ ...form });
    const result = await placeOrder({ deliveryAddress: address, paymentMethod: payment });
    setSubmitting(false);
    if (!result.ok) {
      setCompleted(false);
      setSubmitError(result.message);
      return;
    }
    router.replace(storeRoutes.orderSuccess(result.data.id));
  };

  const cta = step === 2 ? "Siparişi Onayla (Demo)" : "Devam Et";

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
            disabled={submitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting, busy: submitting }}
            style={[styles.cta, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaLabel}>{cta}</Text>}
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
                  {addresses.map((a) => (
                    <Pressable
                      key={a.id}
                      testID={`pick-address-${a.id}`}
                      onPress={() => pickAddress(a)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedAddressId === a.id }}
                      style={[styles.addressChip, { borderColor: selectedAddressId === a.id ? colors.primary : colors.border, backgroundColor: selectedAddressId === a.id ? colors.cardActive : colors.inputBackground }]}
                    >
                      <Ionicons name="location-outline" size={14} color={selectedAddressId === a.id ? colors.primary : colors.text} />
                      <Text style={[styles.addressChipLabel, { color: selectedAddressId === a.id ? colors.primary : colors.text }]}>{a.title}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    testID="new-address"
                    onPress={() => {
                      prefilledRef.current = true;
                      setSelectedAddressId(null);
                      setForm(EMPTY_ADDRESS_FORM);
                      setErrors({});
                    }}
                    accessibilityRole="button"
                    style={[styles.addressChip, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                  >
                    <Ionicons name="add" size={14} color={colors.text} />
                    <Text style={[styles.addressChipLabel, { color: colors.text }]}>Yeni adres</Text>
                  </Pressable>
                </ScrollView>
              ) : null}
              <AddressFormFields value={form} errors={errors} onChange={(next) => { prefilledRef.current = true; setForm(next); }} />
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.block} testID="step-summary">
              <Text style={[styles.heading, { color: colors.text }]}>Ürünler</Text>
              {items.map((item) => {
                const product = productsById.get(item.productId);
                if (!product) return null;
                const label = variantLabel(product, item.selectedVariant);
                return (
                  <View key={`${item.productId}-${label}`} style={[styles.summaryLine, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ProductImage uri={product.images[0]} icon={categoryIconFor(product.categoryId)} style={styles.summaryThumb} iconSize={20} />
                    <View style={styles.summaryText}>
                      <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      {label ? <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{label}</Text> : null}
                      <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                        {item.quantity} adet × {formatPrice(item.unitPrice)}
                      </Text>
                    </View>
                    <Text style={[styles.summaryPrice, { color: colors.text }]}>{formatPrice(item.unitPrice * item.quantity)}</Text>
                  </View>
                );
              })}
              <Text style={[styles.heading, { color: colors.text }]}>Teslimat adresi</Text>
              <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.summaryName, { color: colors.text }]}>
                  {form.title} · {form.fullName}
                </Text>
                <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{form.address}</Text>
                <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                  {form.district} / {form.city} · {form.phone}
                </Text>
              </View>
              <OrderSummary {...totals} />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.block} testID="step-payment">
              <View style={[styles.demoNote, { backgroundColor: colors.cardActive, borderColor: colors.borderActive }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.demoNoteText, { color: colors.text }]}>Bu bir demo akıştır. Gerçek ödeme alınmaz, kart bilgisi toplanmaz.</Text>
              </View>
              {PAYMENT_OPTIONS.map((option) => {
                const selected = payment === option.id;
                return (
                  <Pressable
                    key={option.id}
                    testID={`payment-${option.id}`}
                    onPress={() => setPayment(option.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected }}
                    accessibilityLabel={PAYMENT_LABELS[option.id]}
                    style={[styles.paymentCard, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.cardActive : colors.card }]}
                  >
                    <Ionicons name={option.icon} size={22} color={selected ? colors.primary : colors.text} />
                    <View style={styles.paymentText}>
                      <Text style={[styles.summaryName, { color: colors.text }]}>{PAYMENT_LABELS[option.id]}</Text>
                      <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>{option.description}</Text>
                    </View>
                    <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? colors.primary : colors.icon} />
                  </Pressable>
                );
              })}
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
  content: { paddingHorizontal: GUTTER, paddingBottom: 24, gap: 18 },
  steps: { flexDirection: "row", gap: 8 },
  stepItem: { flex: 1, gap: 6 },
  stepBar: { height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  block: { gap: 14 },
  heading: { fontSize: 15, fontWeight: "700" },
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
  demoNote: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  demoNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  paymentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  paymentText: { flex: 1, gap: 2 },
  footer: { gap: 8 },
  submitError: { fontSize: 13, fontWeight: "600" },
  cta: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
