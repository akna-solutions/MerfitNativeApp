import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";
import { StepRing } from "../../../../shared/steps/components/StepRing";
import { formatKcal, formatKm, formatPercent, formatSteps } from "../../../../shared/steps/format";
import { SensorStatus } from "../../../../shared/steps/stepSensor";
import { estimateFromSteps, goalProgress } from "../../../../shared/steps/stepState";
import type { StepSettings } from "../../../../services/api/steps";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  status: SensorStatus | "checking";
  ready: boolean;
  steps: number;
  goal: number;
  settings: StepSettings;
  mustOpenSettings: boolean;
  onPress: () => void;
  onEnable: () => void;
  onOpenSettings: () => void;
};

const RING_SIZE = 108;
const RING_STROKE = 11;

/**
 * Ana sayfadaki gunluk adim karti: dairesel ilerleme, adim/hedef, yuzde, kalan adim, tahmini kalori ve mesafe.
 * Izin verilmediyse ya da sensor yoksa ayni kart aciklama ve tek bir eylem gosterir; sahte deger gostermez.
 * Karta dokununca gunluk aktivite detayi acilir.
 */
export function StepActivityCard({ status, ready, steps, goal, settings, mustOpenSettings, onPress, onEnable, onOpenSettings }: Props) {
  const { colors } = useTheme();
  const progress = goalProgress(steps, goal);
  const { distanceKm, calories } = estimateFromSteps(steps, settings);
  // Izin butonu olan durumlarda kart dugme icinde dugme olmasin diye tiklanabilir degil; "Detay" baglantisi calisir.
  const hasInlineAction = ready && (status === "undetermined" || status === "denied");

  const detailLabel = (
    <>
      <Text style={[styles.detail, { color: colors.primary }]}>Detay</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
    </>
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={[styles.iconBadge, { backgroundColor: colors.cardActive }]}>
          <Ionicons name="footsteps" size={14} color={colors.primary} />
        </View>
        <Text style={[styles.badge, { color: colors.textSecondary }]}>GÜNLÜK ADIM</Text>
      </View>
      {hasInlineAction ? (
        <Pressable style={styles.headerRight} onPress={onPress} hitSlop={10} accessibilityRole="link">
          {detailLabel}
        </Pressable>
      ) : (
        <View style={styles.headerRight}>{detailLabel}</View>
      )}
    </View>
  );

  const renderBody = () => {
    if (!ready || status === "checking") {
      return (
        <View style={styles.loading}>
          <DumbbellSpinner color={colors.primary} />
        </View>
      );
    }

    if (status !== "granted") {
      const { icon, title, text, action, onAction } = notice(status, mustOpenSettings, onEnable, onOpenSettings);
      return (
        <View style={styles.notice} testID={`step-card-${status}`}>
          <Ionicons name={icon} size={26} color={colors.icon} />
          <View style={styles.noticeTexts}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{text}</Text>
            {action && onAction ? (
              <Pressable
                testID="step-card-action"
                onPress={onAction}
                accessibilityRole="button"
                style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? colors.primaryPressed : colors.primary }]}
              >
                <Text style={styles.actionLabel}>{action}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.body}>
        <StepRing ratio={progress.ratio} size={RING_SIZE} stroke={RING_STROKE} testID="step-ring">
          <Ionicons name="footsteps" size={16} color={colors.primary} />
          <Text style={[styles.ringPercent, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatPercent(progress.percent)}
          </Text>
        </StepRing>

        <View style={styles.stats}>
          <Text style={[styles.steps, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit testID="step-card-steps">
            {formatSteps(steps)}
            <Text style={[styles.goal, { color: colors.textSecondary }]}> / {formatSteps(goal)} adım</Text>
          </Text>
          <Text style={[styles.line, { color: progress.completed ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
            {progress.completed ? "Günlük hedef tamamlandı ✓" : `${formatPercent(progress.percent)} tamamlandı`}
          </Text>
          {!progress.completed ? (
            <Text style={[styles.line, { color: colors.textSecondary }]} numberOfLines={1}>
              {formatSteps(progress.remaining)} adım kaldı
            </Text>
          ) : null}
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="flame-outline" size={13} color={colors.iconActive} />
              <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{formatKcal(calories)}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="navigate-outline" size={13} color={colors.iconActive} />
              <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{formatKm(distanceKm)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const label =
    status === "granted"
      ? `Bugün ${formatSteps(steps)} adım, hedef ${formatSteps(goal)}. ${formatPercent(progress.percent)} tamamlandı. Detay için dokun`
      : "Günlük adım. Detay için dokun";

  if (hasInlineAction) {
    return (
      <View testID="step-activity-card" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {header}
        {renderBody()}
      </View>
    );
  }

  return (
    <Pressable
      testID="step-activity-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 }]}
    >
      {header}
      {renderBody()}
    </Pressable>
  );
}

function notice(
  status: SensorStatus,
  mustOpenSettings: boolean,
  onEnable: () => void,
  onOpenSettings: () => void,
): { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; action?: string; onAction?: () => void } {
  switch (status) {
    case "undetermined":
      return {
        icon: "walk-outline",
        title: "Adımlarını saymaya başla",
        text: "Telefonunun hareket sensörüyle günlük adımlarını, mesafeni ve yaktığın kaloriyi takip edelim.",
        action: "Adım sayarı başlat",
        onAction: onEnable,
      };
    case "denied":
      return mustOpenSettings
        ? {
            icon: "lock-closed-outline",
            title: "Hareket izni kapalı",
            text: "Adımlarını sayabilmemiz için Ayarlar'dan MB Fit'e hareket ve fitness (Android'de fiziksel aktivite) izni ver.",
            action: "Ayarları aç",
            onAction: onOpenSettings,
          }
        : {
            icon: "lock-closed-outline",
            title: "Hareket izni verilmedi",
            text: "İzin olmadan adımlarını sayamayız. Dilediğin zaman yeniden izin verebilirsin.",
            action: "İzin ver",
            onAction: onEnable,
          };
    case "unavailable":
      return {
        icon: "phone-portrait-outline",
        title: "Adım sensörü bulunamadı",
        text: "Bu cihazda adım sayar sensörü yok ya da kapalı. Başka bir cihazda kaydettiğin adımları detay sayfasında görebilirsin.",
      };
    default:
      return {
        icon: "phone-portrait-outline",
        title: "Adım sayar telefonda çalışır",
        text: "Adımlarını saymak için MB Fit'i iPhone ya da Android telefonunda kullan.",
      };
  }
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  detail: { fontSize: 12, fontWeight: "700" },
  loading: { height: RING_SIZE, alignItems: "center", justifyContent: "center", marginTop: 12 },
  body: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 },
  ringPercent: { fontSize: 15, fontWeight: "800", marginTop: 2, maxWidth: RING_SIZE - RING_STROKE * 2 - 8 },
  stats: { flex: 1, minWidth: 0, gap: 3 },
  steps: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  goal: { fontSize: 14, fontWeight: "600", letterSpacing: 0 },
  line: { fontSize: 13, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: "700" },
  notice: { flexDirection: "row", gap: 12, marginTop: 12 },
  noticeTexts: { flex: 1, gap: 4 },
  noticeTitle: { fontSize: 15, fontWeight: "800" },
  noticeText: { fontSize: 13, lineHeight: 18 },
  actionButton: { alignSelf: "flex-start", marginTop: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  actionLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
