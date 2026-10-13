import { apiRequest } from "./client";
import { AssistantChatRequest, AssistantChatResponse, AssistantConversationResponse } from "./types";

const BASE_PATH = "/api/nutrition-assistant";

/** Model yaniti saniyeler surebilir; sunucu kendi zaman asimini (40 sn) uygular, istemci biraz daha bekler. */
export const ASSISTANT_TIMEOUT_MS = 60000;

/**
 * GET /api/nutrition-assistant/conversation - secili gunun sohbeti (varsa), gercek verilerle hazirlanan
 * acilis degerlendirmesi ve hizli sorular.
 */
export async function getAssistantConversation(date: string, signal?: AbortSignal): Promise<AssistantConversationResponse> {
  return apiRequest<AssistantConversationResponse>(`${BASE_PATH}/conversation`, { query: { date }, signal });
}

/**
 * POST /api/nutrition-assistant/chat - mesaji asistana iletir. Kullanici kimligi token'dan alinir;
 * conversationId sunucuda sahiplik icin dogrulanir. Limit asiminda 429, servis yoksa 503 doner.
 */
export async function sendAssistantMessage(request: AssistantChatRequest, signal?: AbortSignal): Promise<AssistantChatResponse> {
  return apiRequest<AssistantChatResponse>(`${BASE_PATH}/chat`, {
    method: "POST",
    body: request,
    signal,
    timeoutMs: ASSISTANT_TIMEOUT_MS,
  });
}
