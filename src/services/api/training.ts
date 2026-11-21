import { apiRequest } from "./client";
import {
  TrainingAlternative,
  TrainingCoachResponse,
  TrainingCoachTopic,
  TrainingExerciseProgress,
  TrainingPreferences,
  TrainingProgram,
  TrainingProgramSummary,
  TrainingProgress,
  TrainingRecovery,
  TrainingUpdateRecommendation,
} from "./types";

/**
 * Kisisel antrenman motoru (MerfitCustomerApi /api/training). Egzersizler yalnizca mevcut katalogdan secilir;
 * aktif program kullanici onayi olmadan degismez (yeni versiyonlar "Proposed" olarak gelir).
 */

export function getTrainingPreferences(signal?: AbortSignal): Promise<TrainingPreferences> {
  return apiRequest<TrainingPreferences>("/api/training/preferences", { signal });
}

export function updateTrainingPreferences(request: TrainingPreferences): Promise<TrainingPreferences> {
  return apiRequest<TrainingPreferences>("/api/training/preferences", { method: "PUT", body: request });
}

/** Ilk programda aktif V1 olusur; aktif bir motor programi varsa yeni versiyon "Proposed" olarak doner. */
export function generateTrainingProgram(request: TrainingPreferences): Promise<TrainingProgram> {
  return apiRequest<TrainingProgram>("/api/training/programs/generate", { method: "POST", body: request });
}

/** Aktif motor programi yoksa null (204). */
export async function getActiveTrainingProgram(signal?: AbortSignal): Promise<TrainingProgram | null> {
  const result = await apiRequest<TrainingProgram | undefined>("/api/training/programs/active", { signal });
  return result ?? null;
}

export function getTrainingProgramVersions(signal?: AbortSignal): Promise<TrainingProgramSummary[]> {
  return apiRequest<TrainingProgramSummary[]>("/api/training/programs", { signal });
}

export function getTrainingProgram(id: number, signal?: AbortSignal): Promise<TrainingProgram> {
  return apiRequest<TrainingProgram>(`/api/training/programs/${id}`, { signal });
}

export function getTrainingUpdateRecommendation(signal?: AbortSignal): Promise<TrainingUpdateRecommendation> {
  return apiRequest<TrainingUpdateRecommendation>("/api/training/update-recommendation", { signal });
}

export function proposeTrainingUpdate(): Promise<TrainingProgram> {
  return apiRequest<TrainingProgram>("/api/training/proposals", { method: "POST" });
}

export function acceptTrainingProposal(id: number): Promise<TrainingProgram> {
  return apiRequest<TrainingProgram>(`/api/training/programs/${id}/accept`, { method: "POST" });
}

export async function rejectTrainingProposal(id: number): Promise<void> {
  await apiRequest<void>(`/api/training/programs/${id}/reject`, { method: "POST" });
}

export function getExerciseAlternatives(planExerciseId: number, signal?: AbortSignal): Promise<TrainingAlternative[]> {
  return apiRequest<TrainingAlternative[]>(`/api/training/exercises/${planExerciseId}/alternatives`, { signal });
}

/** Elle degisim yeni bir versiyon olusturur; eski versiyon ve gecmis korunur. */
export function swapTrainingExercise(planExerciseId: number, newExerciseId: number): Promise<TrainingProgram> {
  return apiRequest<TrainingProgram>(`/api/training/exercises/${planExerciseId}/swap`, {
    method: "POST",
    body: { newExerciseId },
  });
}

export function getTrainingProgress(signal?: AbortSignal): Promise<TrainingProgress> {
  return apiRequest<TrainingProgress>("/api/training/progress", { signal });
}

export async function getTrainingExerciseHistory(exerciseId: number, signal?: AbortSignal): Promise<TrainingExerciseProgress | null> {
  const result = await apiRequest<TrainingExerciseProgress | undefined>(`/api/training/exercises/${exerciseId}/history`, { signal });
  return result ?? null;
}

export function getTrainingRecovery(signal?: AbortSignal): Promise<TrainingRecovery> {
  return apiRequest<TrainingRecovery>("/api/training/recovery", { signal });
}

/** AI yalnizca aciklar; yanit backend'de dogrulanir, gecmezse kural tabanli metin doner. */
export function askTrainingCoach(topic: TrainingCoachTopic, question?: string): Promise<TrainingCoachResponse> {
  return apiRequest<TrainingCoachResponse>("/api/training/coach", { method: "POST", body: { topic, question } });
}
