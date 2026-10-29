import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { Order } from "../types";
import { formatPrice } from "../utils/pricing";

type Props = { info: NonNullable<Order["bankTransfer"]>; total: number };

/** Havale/EFT ile verilen ve odemesi beklenen sipariste banka bilgisi (sunucudan gelir). */
export function BankTransferCard({ info, total }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="bank-transfer-info">
      <Text style={[styles.title, { color: colors.text }]}>Havale / EFT bilgileri</Text>
      {info.bankName ? <Row label="Banka" value={info.bankName} /> : null}
      <Row label="Alıcı" value={info.accountName} />
      <Row label="IBAN" value={info.iban} />
      <Row label="Açıklama" value={info.reference} />
      <Row label="Tutar" value={formatPrice(total)} />
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Açıklama alanına sipariş numaranı yazmayı unutma. Ödemen kontrol edildikten sonra sipariş hazırlanmaya başlar.
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  title: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  row: { flexDirection: "row", gap: 10 },
  label: { width: 72, fontSize: 12 },
  value: { flex: 1, fontSize: 13, fontWeight: "600" },
  note: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
