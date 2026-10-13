import { apiRequest } from "./client";
import { FinishMiniGameRequest, MiniGameResult, MiniGameSession } from "./types";

const BASE_PATH = "/api/mini-games/dumbbell-dash/sessions";

/**
 * POST /api/mini-games/dumbbell-dash/sessions - yeni oyun oturumu (seed + odul tablosu) acar. Kullanicinin
 * bitirilmemis onceki oturumu sunucuda terk edilmis sayilir. Gunluk oturum siniri asilirsa 429 doner.
 */
export async function startMiniGameSession(engineVersion: number, signal?: AbortSignal): Promise<MiniGameSession> {
  return apiRequest<MiniGameSession>(BASE_PATH, { method: "POST", body: { engineVersion }, signal });
}

/**
 * POST /api/mini-games/dumbbell-dash/sessions/{id}/finish - sonucu dogrulatir ve odulu alir. Idempotenttir:
 * baglanti koptugunda ayni istek guvenle tekrar gonderilebilir, puan ikinci kez verilmez.
 */
export async function finishMiniGameSession(sessionId: number, request: FinishMiniGameRequest): Promise<MiniGameResult> {
  return apiRequest<MiniGameResult>(`${BASE_PATH}/${sessionId}/finish`, { method: "POST", body: request });
}
