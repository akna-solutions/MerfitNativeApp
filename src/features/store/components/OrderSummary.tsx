import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { formatPrice } from "../utils/pricing";

type Props = {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  /** Ucretsiz kargoya kalan tutar bilgisi (yalnizca sepette). */
  remainingForFreeShipping?: number;
};

export function SummaryRow({ label, value, strong, positive, testID }: { label: string; value: string; strong?: boolean; positive?: boolean; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[strong ? styles.strongLabel : styles.label, { color: strong ? colors.text : colors.textSecondary }]}>{label}</Text>
      <Text testID={testID} style={[strong ? styles.strongValue : styles.value, { color: positive ? colors.primary : colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

/** Sepet, odeme ozeti ve siparis detayinda ayni toplam satirlari. Tutarlar sunucudan gelir; burada hesap yapilmaz. */
export function OrderSummary({ subtotal, discount, shippingCost, total, remainingForFreeShipping = 0 }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="order-summary">
      <SummaryRow label="Ara toplam" value={formatPrice(subtotal)} testID="summary-subtotal" />
      <SummaryRow label="İndirim" value={discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0)} positive={discount > 0} testID="summary-discount" />
      <SummaryRow label="Kargo" value={shippingCost > 0 ? formatPrice(shippingCost) : "Ücretsiz"} positive={shippingCost === 0 && total > 0} testID="summary-shipping" />
      {remainingForFreeShipping > 0 ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]} testID="summary-free-shipping-hint">
          {formatPrice(remainingForFreeShipping)} daha ekle, kargo ücretsiz olsun.
        </Text>
      ) : null}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <SummaryRow label="Genel toplam" value={formatPrice(total)} strong testID="summary-total" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },
  strongLabel: { fontSize: 16, fontWeight: "700" },
  strongValue: { fontSize: 18, fontWeight: "800" },
  hint: { fontSize: 12, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth },
});
