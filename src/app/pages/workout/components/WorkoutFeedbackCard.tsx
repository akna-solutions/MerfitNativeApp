import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ApiError } from "../../../../services/api/client";
import { submitWorkoutFeedback } from "../../../../services/api/workoutSessions";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Question = "difficulty" | "fatigue" | "recovery" | "satisfaction";

const QUESTIONS: { key: Question; label: string; low: string; high: string }[] = [
  { key: "difficulty", label: "Antrenman ne kadar zordu?", low: "Kolay", high: "Çok zor" },
  { key: "fatigue", label: "Şu an ne kadar yorgunsun?", low: "Dinç", high: "Bitkin" },
  { key: "recovery", label: "Önceki antrenmandan toparlanmış mıydın?", low: "Hiç", high: "Tamamen" },
  { key: "satisfaction", label: "Antrenmandan memnun musun?", low: "Değil", high: "Çok" },
];

type Props = {
  sessionId: number;
  exercises: { exerciseId?: number; name: string }[];
};

/**
 * Antrenman sonu kısa değerlendirme (4 soru + rahatsızlık). Sonraki program önerisini etkiler.
 * Opsiyoneldir; boş bırakılan sorular gönderilmez.
 */
export function WorkoutFeedbackCard({ sessionId, exercises }: Props) {
  const { colors } = useTheme();
  const [answers, setAnswers] = useState<Partial<Record<Question, number>>>({});
  const [hasDiscomfort, setHasDiscomfort] = useState(false);
  const [discomfortIds, setDiscomfortIds] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  const selectable = exercises.filter((e): e is { exerciseId: number; name: string } => typeof e.exerciseId === "number");
  const canSend = Object.keys(answers).length > 0 || hasDiscomfort;

  async function send() {
    setStatus("sending");
    setError(null);
    try {
      const result = await submitWorkoutFeedback(sessionId, {
        difficulty: answers.difficulty ?? null,
        fatigue: answers.fatigue ?? null,
        recovery: answers.recovery ?? null,
        satisfaction: answers.satisfaction ?? null,
        hasDiscomfort,
        discomfortExerciseIds: hasDiscomfort ? discomfortIds : [],
      });
      setSafetyMessage(result.safetyMessage);
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setError(e instanceof ApiError ? e.message : "Değerlendirme gönderilemedi.");
    }
  }

  if (status === "sent") {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Teşekkürler</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Değerlendirmen bir sonraki program önerisinde kullanılacak.
        </Text>
        {safetyMessage ? <Text style={[styles.safety, { color: colors.text }]}>{safetyMessage}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Kısa değerlendirme</Text>
      {QUESTIONS.map((q) => (
        <View key={q.key} style={styles.question}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{q.label}</Text>
          <View style={styles.scale}>
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = answers[q.key] === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.key]: selected ? undefined : value }))}
                  style={[
                    styles.scaleItem,
                    {
                      backgroundColor: selected ? colors.primary : colors.inputBackground,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${q.label} ${value}`}
                >
                  <Text style={[styles.scaleLabel, { color: selected ? "#FFFFFF" : colors.text }]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.scaleEnds}>
            <Text style={[styles.end, { color: colors.textSecondary }]}>{q.low}</Text>
            <Text style={[styles.end, { color: colors.textSecondary }]}>{q.high}</Text>
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => setHasDiscomfort((v) => !v)}
        style={[styles.discomfort, { borderColor: hasDiscomfort ? colors.primary : colors.border }]}
        accessibilityRole="switch"
        accessibilityState={{ checked: hasDiscomfort }}
      >
        <Text style={[styles.label, { color: colors.text }]}>Ağrı veya rahatsızlık hissettim</Text>
        <Text style={[styles.label, { color: hasDiscomfort ? colors.primary : colors.textSecondary }]}>
          {hasDiscomfort ? "Evet" : "Hayır"}
        </Text>
      </Pressable>

      {hasDiscomfort && selectable.length > 0 ? (
        <View style={styles.exerciseChips}>
          {selectable.map((e) => {
            const selected = discomfortIds.includes(e.exerciseId);
            return (
              <Pressable
                key={e.exerciseId}
                onPress={() =>
                  setDiscomfortIds((prev) => (selected ? prev.filter((id) => id !== e.exerciseId) : [...prev, e.exerciseId]))
                }
                style={[
                  styles.exerciseChip,
                  { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.inputBackground : "transparent" },
                ]}
              >
                <Text style={[styles.exerciseChipLabel, { color: selected ? colors.primary : colors.text }]} numberOfLines={1}>
                  {e.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Pressable
        disabled={!canSend || status === "sending"}
        onPress={send}
        style={[styles.send, { backgroundColor: colors.primary, opacity: !canSend || status === "sending" ? 0.5 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={styles.sendLabel}>{status === "sending" ? "Gönderiliyor..." : "Gönder"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 20, borderRadius: 16, padding: 16, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  title: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17 },
  safety: { fontSize: 13, lineHeight: 19 },
  question: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600" },
  scale: { flexDirection: "row", gap: 6 },
  scaleItem: { flex: 1, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  scaleLabel: { fontSize: 14, fontWeight: "700" },
  scaleEnds: { flexDirection: "row", justifyContent: "space-between" },
  end: { fontSize: 10 },
  discomfort: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 12 },
  exerciseChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exerciseChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, maxWidth: "100%" },
  exerciseChipLabel: { fontSize: 12, fontWeight: "600" },
  error: { fontSize: 12, fontWeight: "600" },
  send: { height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sendLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
