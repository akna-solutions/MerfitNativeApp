import { apiRequest } from "./client";
import {
  CompleteWorkoutSessionRequest,
  LogWorkoutSetRequest,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionSummary,
} from "./types";

/** POST /api/workout-sessions - secilen antrenman icin yeni bir oturum baslatir. */
export async function startWorkoutSession(workoutId: number): Promise<WorkoutSession> {
  return apiRequest<WorkoutSession>("/api/workout-sessions", {
    method: "POST",
    body: { workoutId },
  });
}

/** GET /api/workout-sessions/{id} - oturumun guncel durumunu getirir (ekran yeniden acildiginda senkronize etmek icin). */
export async function getWorkoutSession(sessionId: number): Promise<WorkoutSession> {
  return apiRequest<WorkoutSession>(`/api/workout-sessions/${sessionId}`);
}

/** POST /api/workout-sessions/{id}/exercises/{sessionExerciseId}/sets - tek bir seti loglar. */
export async function logWorkoutSet(
  sessionId: number,
  sessionExerciseId: number,
  request: LogWorkoutSetRequest,
): Promise<WorkoutSessionExercise> {
  return apiRequest<WorkoutSessionExercise>(
    `/api/workout-sessions/${sessionId}/exercises/${sessionExerciseId}/sets`,
    { method: "POST", body: request },
  );
}

/** PUT /api/workout-sessions/{id}/complete - oturumu tamamlar, ozet + yeni rekorlari doner. */
export async function completeWorkoutSession(
  sessionId: number,
  request: CompleteWorkoutSessionRequest,
): Promise<WorkoutSessionSummary> {
  return apiRequest<WorkoutSessionSummary>(`/api/workout-sessions/${sessionId}/complete`, {
    method: "PUT",
    body: request,
  });
}

/** PUT /api/workout-sessions/{id}/cancel - oturumu yarim birakildi olarak isaretler. */
export async function cancelWorkoutSession(sessionId: number): Promise<void> {
  await apiRequest<void>(`/api/workout-sessions/${sessionId}/cancel`, { method: "PUT" });
}
