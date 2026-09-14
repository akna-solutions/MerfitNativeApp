import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();

  if (isFailed) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.badge, styles.badgeError, { backgroundColor: colors.cardActive }]}>
          <Text style={styles.badgeGlyph}>!</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Program hazırlanırken bir sorun oluştu.</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Lütfen birazdan tekrar dene. Sorun devam ederse destek ekibimizle iletişime geç.
        </Text>
        <Text style={[styles.retryLink, { color: colors.primary }]} onPress={onRetry}>
          Tekrar dene
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ActivityIndicator color={colors.primary} size="small" style={styles.spinner} />
      <Text style={[styles.title, { color: colors.text }]}>
        {isTimedOut ? "Programın hazırlanması biraz uzun sürüyor." : "Programın hazırlanıyor."}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {isTimedOut
          ? "Bu genelde birkaç dakika içinde tamamlanır. Az sonra tekrar kontrol edebilirsin."
          : "Profiline göre kişisel antrenman ve beslenme programın oluşturuluyor. Bu birkaç dakika sürebilir."}
      </Text>
      {isTimedOut ? (
        <Text style={[styles.retryLink, { color: colors.primary }]} onPress={onRetry}>
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  spinner: { marginBottom: 18 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 18,
  },
  badgeError: { borderColor: "#FF6B6B" },
  badgeGlyph: { color: "#FF6B6B", fontSize: 24, fontWeight: "700" },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  retryLink: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
  },
});
