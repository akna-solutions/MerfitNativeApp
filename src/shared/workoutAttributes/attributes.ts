import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { WorkoutAttributeScoreDto } from "../../services/api/types";

/**
 * Backend Domain.Enums.WorkoutAttributeType ile ayni sirada (0-5) tutulur; sayisal
 * serilestirmede indeks bu siraya gore cozulur. Sira degisirse backend enum'u da kontrol edilmeli.
 */
export const WORKOUT_ATTRIBUTE_TYPES = [
  "Hypertrophy",
  "Strength",
  "Cardio",
  "Endurance",
  "Mobility",
  "CoreStability",
] as const;

export type WorkoutAttributeType = (typeof WORKOUT_ATTRIBUTE_TYPES)[number];

/** Normalize edilmis, ekranlarda kullanilan antrenman ozellik puani (0-100, tam sayi). */
export type WorkoutAttributeScore = {
  type: WorkoutAttributeType;
  score: number;
};

export const WORKOUT_ATTRIBUTE_MIN_SCORE = 0;
export const WORKOUT_ATTRIBUTE_MAX_SCORE = 100;

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/** Her ozellik turu icin tek Turkce etiket ve ikon; tum ekranlar buradan okur. */
export const WORKOUT_ATTRIBUTE_META: Record<
  WorkoutAttributeType,
  { label: string; icon: IoniconName }
> = {
  Hypertrophy: { label: "Kas geliştirme", icon: "barbell-outline" },
  Strength: { label: "Kuvvet", icon: "fitness-outline" },
  Cardio: { label: "Kardiyo", icon: "heart-outline" },
  Endurance: { label: "Dayanıklılık", icon: "timer-outline" },
  Mobility: { label: "Hareketlilik ve esneklik", icon: "body-outline" },
  CoreStability: { label: "Merkez bölge kontrolü", icon: "ellipse-outline" },
};

function parseAttributeType(raw: unknown): WorkoutAttributeType | null {
  if (typeof raw === "number") {
    return Number.isInteger(raw) ? (WORKOUT_ATTRIBUTE_TYPES[raw] ?? null) : null;
  }
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    return WORKOUT_ATTRIBUTE_TYPES.find((type) => type.toLowerCase() === normalized) ?? null;
  }
  return null;
}

function isValidScore(raw: unknown): raw is number {
  return (
    typeof raw === "number" &&
    Number.isFinite(raw) &&
    raw >= WORKOUT_ATTRIBUTE_MIN_SCORE &&
    raw <= WORKOUT_ATTRIBUTE_MAX_SCORE
  );
}

/**
 * Ham API puanlarini ekranlarin kullandigi sekle cevirir. Puan HESAPLAMAZ:
 * - Alan yoksa/null ise bos liste doner (eski API yanitlari).
 * - Bilinmeyen tur veya 0-100 disi/sayi olmayan puanlar atlanir; eksik tur 0 ile DOLDURULMAZ.
 * - Ayni tur birden fazla gelirse ilk kayit kullanilir.
 * - Sonuc WORKOUT_ATTRIBUTE_TYPES sirasindadir, boylece her ekranda ayni sirada gorunur.
 */
export function normalizeWorkoutAttributeScores(
  raw: readonly WorkoutAttributeScoreDto[] | null | undefined,
): WorkoutAttributeScore[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const byType = new Map<WorkoutAttributeType, number>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const type = parseAttributeType(item.attributeType);
    if (!type || byType.has(type) || !isValidScore(item.score)) continue;
    byType.set(type, Math.round(item.score));
  }

  return WORKOUT_ATTRIBUTE_TYPES.filter((type) => byType.has(type)).map((type) => ({
    type,
    score: byType.get(type) as number,
  }));
}
