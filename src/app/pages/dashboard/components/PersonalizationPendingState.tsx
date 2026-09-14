import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  /** true ise (poll siniri asildiysa) "hazırlanıyor" yerine sabirla bekleme mesaji gosterilir. */
  isTimedOut: boolean;
  /** PersonalizationJob Failed durumundaysa true. */
  isFailed: boolean;
  onRetry: () => void;
};

/**
 * Kayit sonrasi PersonalizationJob henuz Completed olmadiginda dashboard'da gosterilen
 * profesyonel yukleniyor/hata durumu. usePersonalizationStatus hook'u ile birlikte kullanilir.
 */
export function PersonalizationPendingState({ isTimedOut, isFailed, onRetry }: Props) {
  if (isFailed) {
    return (
      <View style={styles.card}>
        <View style={[styles.badge, styles.badgeError]}>
          <Text style={styles.badgeGlyph}>!</Text>
        </View>
        <Text style={styles.title}>Program hazırlanırken bir sorun oluştu.</Text>
        <Text style={styles.description}>
          Lütfen birazdan tekrar dene. Sorun devam ederse destek ekibimizle iletişime geç.
        </Text>
        <Text style={styles.retryLink} onPress={onRetry}>
          Tekrar dene
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ActivityIndicator color={colors.electricBlue} size="small" style={styles.spinner} />
      <Text style={styles.title}>
        {isTimedOut ? "Programın hazırlanması biraz uzun sürüyor." : "Programın hazırlanıyor."}
      </Text>
      <Text style={styles.description}>
        {isTimedOut
          ? "Bu genelde birkaç dakika içinde tamamlanır. Az sonra tekrar kontrol edebilirsin."
          : "Profiline göre kişisel antrenman ve beslenme programın oluşturuluyor. Bu birkaç dakika sürebilir."}
      </Text>
      {isTimedOut ? (
        <Text style={styles.retryLink} onPress={onRetry}>
          Şimdi kontrol et
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 28,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  spinner: { marginBottom: 18 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackgroundActive,
    borderWidth: 1.5,
    borderColor: colors.electricBlue,
    marginBottom: 18,
  },
  badgeError: { borderColor: "#FF6B6B" },
  badgeGlyph: { color: "#FF6B6B", fontSize: 24, fontWeight: "700" },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  retryLink: {
    color: colors.electricBlue,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
  },
});
