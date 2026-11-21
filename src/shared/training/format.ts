import type { TrainingExercise, TrainingFocus, TrainingProgram } from "../../services/api/types";
import { rirLabel } from "../workout/progression";

export const FOCUS_OPTIONS: { value: TrainingFocus; label: string; description: string }[] = [
  { value: "Hypertrophy", label: "Kas gelişimi", description: "Orta tekrar, kas başına yeterli haftalık hacim" },
  { value: "Strength", label: "Kuvvet", description: "Ana hareketlerde düşük tekrar, uzun dinlenme" },
  { value: "FatLoss", label: "Yağ kaybı", description: "Kası korurken kısa dinlenme, orta tekrar" },
  { value: "GeneralFitness", label: "Genel fitness", description: "Dengeli, sürdürülebilir program" },
  { value: "Endurance", label: "Dayanıklılık", description: "Yüksek tekrar, kısa dinlenme" },
];

export const DAY_OPTIONS = [2, 3, 4, 5, 6] as const;
export const MINUTE_OPTIONS = [30, 45, 60, 75, 90] as const;

export const DAY_NAMES_TR: Record<string, string> = {
  Monday: "Pazartesi",
  Tuesday: "Salı",
  Wednesday: "Çarşamba",
  Thursday: "Perşembe",
  Friday: "Cuma",
  Saturday: "Cumartesi",
  Sunday: "Pazar",
};

export function focusLabel(focus: string | null | undefined): string | null {
  return FOCUS_OPTIONS.find((f) => f.value === focus)?.label ?? null;
}

/** "3 × 8-12 · RIR 2 · 90 sn" veya sureli egzersizde "3 × 45 sn". */
export function formatPrescription(e: Pick<TrainingExercise, "sets" | "repsMin" | "repsMax" | "durationSeconds" | "targetRir" | "restSeconds">): string {
  const parts: string[] = [];
  if (e.durationSeconds && e.durationSeconds > 0) {
    parts.push(`${e.sets} × ${e.durationSeconds} sn`);
  } else if (e.repsMin) {
    const reps = e.repsMax && e.repsMax > e.repsMin ? `${e.repsMin}-${e.repsMax}` : `${e.repsMin}`;
    parts.push(`${e.sets} × ${reps}`);
  } else {
    parts.push(`${e.sets} set`);
  }
  if (e.targetRir !== null && e.targetRir !== undefined) parts.push(`RIR ${rirLabel(e.targetRir)}`);
  if (e.restSeconds) parts.push(e.restSeconds >= 60 && e.restSeconds % 60 === 0 ? `${e.restSeconds / 60} dk dinlenme` : `${e.restSeconds} sn dinlenme`);
  return parts.join(" · ");
}

/** Haftalik set: 7.5 -> "7,5". */
export function formatSets(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

export function formatPercent(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${(Math.round(value * 10) / 10).toString().replace(".", ",")}%`;
}

export const STATUS_LABELS: Record<string, string> = {
  Active: "Aktif",
  Proposed: "Önerilen",
  Archived: "Arşiv",
  Rejected: "Reddedildi",
};

export const RECOVERY_LABELS: Record<string, string> = {
  Unknown: "Veri yetersiz",
  Good: "İyi",
  Watch: "Dikkat",
  DeloadRecommended: "Deload önerilir",
};

/** Program basligi alt satiri: "Üst / Alt (4 gün) · Kas gelişimi · Hafta 2/4". */
export function programSubtitle(program: Pick<TrainingProgram, "splitLabel" | "focus" | "currentWeek" | "blockWeeks" | "isDeload">): string {
  return [
    program.splitLabel,
    focusLabel(program.focus),
    program.currentWeek ? `Hafta ${Math.min(program.currentWeek, program.blockWeeks)}/${program.blockWeeks}` : null,
    program.isDeload ? "Deload" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
