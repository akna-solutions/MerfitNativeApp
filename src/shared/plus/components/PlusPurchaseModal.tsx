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
import { colors } from "../theme";
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
          style={StyleSheet.absoluteFillObject}
          onPress={state === "processing" ? undefined : onClose}
        />

        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={colors.textPrimary} />
          </Pressable>

          {state === "processing" ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.electricBlue} size="large" />
              <Text style={styles.centerTitle}>Processing...</Text>
            </View>
          ) : state === "success" ? (
            <View style={styles.centerState}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.centerTitle}>Welcome to MERFIT Plus.</Text>
              <Text style={styles.centerSubtitle}>
                Your premium features are now unlocked.
              </Text>
              <Pressable onPress={onPurchased} style={styles.primaryButton}>
                <Text style={styles.primaryLabel}>Continue</Text>
              </Pressable>
            </View>
          ) : state === "error" ? (
            <View style={styles.centerState}>
              <Text style={styles.centerTitle}>Something went wrong.</Text>
              <Text style={styles.centerSubtitle}>Please try again.</Text>
              <Pressable onPress={handlePurchase} style={styles.primaryButton}>
                <Text style={styles.primaryLabel}>Try Again</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>Close</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              <Text style={styles.brand}>MERFIT+</Text>
              <Text style={styles.title}>
                {info
                  ? `Unlock ${info.title}`
                  : "Train smarter. Progress further."}
              </Text>
              {info ? (
                <Text style={styles.subtitle}>{info.description}</Text>
              ) : null}

              <View style={styles.benefits}>
                {PLUS_BENEFITS.map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.electricBlue}
                    />
                    <Text style={styles.benefitLabel}>{benefit}</Text>
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
                      style={[styles.planPill, active && styles.planPillActive]}
                    >
                      <Text
                        style={[
                          styles.planPillLabel,
                          active && styles.planPillLabelActive,
                        ]}
                      >
                        {option === "monthly" ? "Monthly" : "Yearly"}
                      </Text>
                      {option === "yearly" ? (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveBadgeLabel}>SAVE 20%</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {selectedProduct ? (
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>
                    {plan === "monthly" ? "MONTHLY" : "YEARLY"}
                  </Text>
                  <Text style={styles.price}>${selectedProduct.price}</Text>
                  <Text style={styles.pricePeriod}>
                    {selectedProduct.period}
                  </Text>
                </View>
              ) : null}

              <Pressable onPress={handlePurchase} style={styles.primaryButton}>
                <Text style={styles.primaryLabel}>Continue with Plus</Text>
              </Pressable>

              <Pressable
                onPress={handleRestore}
                hitSlop={8}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>Restore Purchase</Text>
              </Pressable>

              <Text style={styles.legal}>Terms · Privacy</Text>
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  scroll: { marginTop: 4 },
  brand: {
    color: colors.electricBlue,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  benefits: { marginTop: 24, gap: 12 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  planToggle: { flexDirection: "row", gap: 10, marginTop: 26 },
  planPill: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: "row",
    gap: 6,
  },
  planPillActive: {
    backgroundColor: colors.cardBackgroundActive,
    borderColor: colors.electricBlue,
  },
  planPillLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  planPillLabelActive: { color: colors.textPrimary },
  saveBadge: {
    paddingHorizontal: 6,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.buttonElectricBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBadgeLabel: { color: "#FFFFFF", fontSize: 8, fontWeight: "700" },
  priceCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },
  pricePeriod: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  primaryButton: {
    marginTop: 20,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  textButton: { marginTop: 16, alignItems: "center" },
  textButtonLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  legal: {
    color: colors.textMuted,
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
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  centerSubtitle: {
    color: colors.textMuted,
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
    backgroundColor: colors.buttonElectricBlue,
  },
});
