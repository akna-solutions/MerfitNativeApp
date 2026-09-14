import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PLUS_BENEFITS, PLUS_FEATURES } from "../featureRegistry";
import { subscriptionService } from "../subscription/MockSubscriptionService";
import { Product, SubscriptionPlan } from "../subscription/SubscriptionService";
import { useTheme } from "../../theme/ThemeContext";
import { PlusFeature } from "../types";

type PurchaseState = "idle" | "processing" | "success" | "error";

type Props = {
  visible: boolean;
  feature: PlusFeature | null;
  onClose: () => void;
  onPurchased: () => void;
};

export function PlusPurchaseModal({
  visible,
  feature,
  onClose,
  onPurchased,
}: Props) {
  const { colors } = useTheme();
  const [plan, setPlan] = useState<SubscriptionPlan>("monthly");
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<PurchaseState>("idle");

  useEffect(() => {
    if (!visible) return;
    setState("idle");
    setPlan("monthly");
    subscriptionService.getProducts().then(setProducts);
  }, [visible]);

  const selectedProduct = products.find((product) => product.plan === plan);
  const info = feature ? PLUS_FEATURES[feature] : null;

  async function handlePurchase() {
    setState("processing");
    try {
      await subscriptionService.purchasePlus(plan);
      setState("success");
    } catch {
      setState("error");
    }
  }

  async function handleRestore() {
    setState("processing");
    try {
      const status = await subscriptionService.restorePurchases();
      if (status.membership === "PLUS") {
        setState("success");
      } else {
        setState("idle");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={state === "processing" ? undefined : onClose}
        />

        <SafeAreaView
          style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}
          edges={["bottom"]}
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>

          {state === "processing" ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.centerTitle, { color: colors.text }]}>İşleniyor...</Text>
            </View>
          ) : state === "success" ? (
            <View style={styles.centerState}>
              <View style={[styles.successBadge, { backgroundColor: colors.primaryPressed }]}>
                <Ionicons name="checkmark" size={26} color="#FFFFFF" />
              </View>
              <Text style={[styles.centerTitle, { color: colors.text }]}>MB FIT Plus'a hoş geldin.</Text>
              <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>
                Premium özelliklerinin kilidi artık açık.
              </Text>
              <Pressable
                onPress={onPurchased}
                style={[styles.primaryButton, { backgroundColor: colors.primaryPressed }]}
              >
                <Text style={styles.primaryLabel}>Devam Et</Text>
              </Pressable>
            </View>
          ) : state === "error" ? (
            <View style={styles.centerState}>
              <Text style={[styles.centerTitle, { color: colors.text }]}>Bir şeyler ters gitti.</Text>
              <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>Lütfen tekrar dene.</Text>
              <Pressable
                onPress={handlePurchase}
                style={[styles.primaryButton, { backgroundColor: colors.primaryPressed }]}
              >
                <Text style={styles.primaryLabel}>Tekrar Dene</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.textButton}
              >
                <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>Kapat</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              <Text style={[styles.brand, { color: colors.primary }]}>MB FIT+</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {info
                  ? `${info.title} kilidini aç`
                  : "Daha akıllı antrenman yap. Daha ileri git."}
              </Text>
              {info ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{info.description}</Text>
              ) : null}

              <View style={styles.benefits}>
                {PLUS_BENEFITS.map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={[styles.benefitLabel, { color: colors.text }]}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.planToggle}>
                {(["monthly", "yearly"] as SubscriptionPlan[]).map((option) => {
                  const active = option === plan;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setPlan(option)}
                      style={[
                        styles.planPill,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        active && { backgroundColor: colors.cardActive, borderColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.planPillLabel,
                          { color: active ? colors.text : colors.textSecondary },
                        ]}
                      >
                        {option === "monthly" ? "Aylık" : "Yıllık"}
                      </Text>
                      {option === "yearly" ? (
                        <View style={[styles.saveBadge, { backgroundColor: colors.primaryPressed }]}>
                          <Text style={styles.saveBadgeLabel}>%20 TASARRUF</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {selectedProduct ? (
                <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    {plan === "monthly" ? "AYLIK" : "YILLIK"}
                  </Text>
                  <Text style={[styles.price, { color: colors.text }]}>${selectedProduct.price}</Text>
                  <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                    {selectedProduct.period}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handlePurchase}
                style={[styles.primaryButton, { backgroundColor: colors.primaryPressed }]}
              >
                <Text style={styles.primaryLabel}>Plus ile Devam Et</Text>
              </Pressable>

              <Pressable
                onPress={handleRestore}
                hitSlop={8}
                style={styles.textButton}
              >
                <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>Satın Almayı Geri Yükle</Text>
              </Pressable>

              <Text style={[styles.legal, { color: colors.textSecondary }]}>Şartlar · Gizlilik</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { marginTop: 4 },
  brand: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  benefits: { marginTop: 24, gap: 12 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitLabel: { fontSize: 13, fontWeight: "600" },
  planToggle: { flexDirection: "row", gap: 10, marginTop: 26 },
  planPill: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 6,
  },
  planPillLabel: { fontSize: 13, fontWeight: "700" },
  saveBadge: {
    paddingHorizontal: 6,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBadgeLabel: { color: "#FFFFFF", fontSize: 8, fontWeight: "700" },
  priceCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  price: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },
  pricePeriod: { fontSize: 11, marginTop: 2 },
  primaryButton: {
    marginTop: 20,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  textButton: { marginTop: 16, alignItems: "center" },
  textButtonLabel: { fontSize: 12, fontWeight: "600" },
  legal: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 12,
    opacity: 0.7,
  },
  centerState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 12,
  },
  centerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  centerSubtitle: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 19,
  },
  successBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
