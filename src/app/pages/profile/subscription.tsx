import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { SubscriptionInfo, SubscriptionProductItem } from "../../../services/api/types";
import { PLUS_BENEFITS } from "../../../shared/plus/featureRegistry";
import { usePlus } from "../../../shared/plus/PlusContext";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";

// Abonelikler App Store / Google Play uzerinden yonetilir; iptal ve plan degisikligi oradan yapilir.
const STORE_SUBSCRIPTION_URLS = {
  Apple: "https://apps.apple.com/account/subscriptions",
  Google: "https://play.google.com/store/account/subscriptions",
} as const;

const STATUS_LABELS: Record<SubscriptionInfo["status"], string> = {
  Active: "Aktif",
  Expired: "Süresi doldu",
  Cancelled: "İptal edildi",
  Refunded: "İade edildi",
  Paused: "Duraklatıldı",
  GracePeriod: "Ödeme bekleniyor",
};

const PERIOD_LABELS: Record<SubscriptionProductItem["billingPeriod"], string> = {
  Monthly: "ay",
  Yearly: "yıl",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(product: SubscriptionProductItem) {
  const amount = product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount} ${product.currency} / ${PERIOD_LABELS[product.billingPeriod]}`;
}

export default function SubscriptionRoute() {
  const { colors } = useTheme();
  const { isPlusUser, subscription, reloadSubscription, openPlusModal } = usePlus();
  const [isLoading, setIsLoading] = useState(subscription === null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setErrorMessage(null);
    reloadSubscription()
      .catch(() => setErrorMessage("Abonelik bilgin alınamadı."))
      .finally(() => setIsLoading(false));
  }, [reloadSubscription]);

  useFocusEffect(load);

  const current = subscription?.current ?? null;
  const storeKey = current?.provider ?? (Platform.OS === "android" ? "Google" : "Apple");
  const storeName = storeKey === "Google" ? "Google Play" : "App Store";

  return (
    <ProfileDetailShell
      title="Aboneliği Yönet"
      footer={
        isPlusUser ? (
          <OnboardingButton
            label={storeKey === "Google" ? "Google Play'de Yönet" : "App Store'da Yönet"}
            onPress={() => Linking.openURL(STORE_SUBSCRIPTION_URLS[storeKey])}
          />
        ) : (
          <OnboardingButton label="MB FIT Plus'a Geç" onPress={() => openPlusModal()} />
        )
      }
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {errorMessage ? (
            <Pressable onPress={load} style={[styles.errorBox, { borderColor: colors.border }]}>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>
                {errorMessage} Tekrar denemek için dokun.
              </Text>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.card,
              {
                backgroundColor: isPlusUser ? colors.cardActive : colors.card,
                borderColor: isPlusUser ? colors.borderActive : colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={[styles.planName, { color: colors.text }]}>
                {isPlusUser ? current?.product?.name ?? "MB FIT Plus" : "Ücretsiz Plan"}
              </Text>
              {current ? (
                <Text style={[styles.badge, { color: colors.primary, borderColor: colors.borderActive }]}>
                  {STATUS_LABELS[current.status]}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>
              {isPlusUser
                ? "Tüm Plus özelliklerine erişimin var."
                : "Gelişmiş özellikleri açmak için Plus'a geçebilirsin."}
            </Text>

            {current ? (
              <View style={styles.details}>
                {current.product ? <Detail label="Ücret" value={formatPrice(current.product)} /> : null}
                <Detail label="Başlangıç" value={formatDate(current.startedAt)} />
                <Detail
                  label={isPlusUser && current.autoRenew ? "Yenilenme tarihi" : "Bitiş tarihi"}
                  value={formatDate(current.expiresAt)}
                />
                <Detail label="Otomatik yenileme" value={current.autoRenew ? "Açık" : "Kapalı"} />
                <Detail label="Mağaza" value={current.provider === "Google" ? "Google Play" : "App Store"} />
              </View>
            ) : null}
          </View>

          {isPlusUser ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Planını değiştirmek veya aboneliğini iptal etmek için {storeName} abonelik ayarlarını kullan.
              İptal ettiğinde Plus özellikleri dönem sonuna kadar açık kalır.
            </Text>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Plus ile neler açılır?</Text>
              {PLUS_BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={[styles.benefit, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}

              {subscription && subscription.products.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Planlar</Text>
                  {subscription.products.map((product) => (
                    <View
                      key={product.id}
                      style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                      <Text style={[styles.muted, { color: colors.textSecondary }]}>{formatPrice(product)}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </>
          )}
        </>
      )}
    </ProfileDetailShell>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  const { colors } = useTheme();
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  errorBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  planName: { flex: 1, fontSize: 17, fontWeight: "700" },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  muted: { fontSize: 13, lineHeight: 19 },
  details: { marginTop: 8, gap: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  hint: { fontSize: 12, lineHeight: 18, marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "600", marginTop: 24, marginBottom: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  benefit: { fontSize: 14, flex: 1 },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  productName: { fontSize: 14, fontWeight: "700" },
});
