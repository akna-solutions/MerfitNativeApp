import type { AssistantChatResponse, AssistantConversationResponse, AssistantMessage } from "../services/api/types";

export const msg = (id: number | null, role: "user" | "assistant", content: string): AssistantMessage => ({
  id,
  role,
  content,
  createdAt: "2026-10-13T09:00:00Z",
});

export const conversation = (overrides: Partial<AssistantConversationResponse> = {}): AssistantConversationResponse => ({
  conversationId: null,
  date: "2026-10-13",
  assistantAvailable: true,
  greeting: msg(null, "assistant", "Merhaba Ayşe! Bugün 1.460 kcal aldın, protein hedefinin gerisindesin."),
  messages: [],
  suggestedQuestions: ["Bugün protein ihtiyacımı nasıl tamamlayabilirim?", "Akşam yemeğinde ne tercih etmeliyim?"],
  insight: { status: "proteinBehind", message: "Protein hedefinin gerisindesin.", suggestedQuestion: null },
  remainingMessages: 40,
  ...overrides,
});

export const chatReply = (userId: number, text: string, reply: string, overrides: Partial<AssistantChatResponse> = {}): AssistantChatResponse => ({
  conversationId: 7,
  date: "2026-10-13",
  userMessage: msg(userId, "user", text),
  message: msg(userId + 1, "assistant", reply),
  suggestedQuestions: ["Antrenman sonrası ne yemeliyim?"],
  remainingMessages: 39,
  ...overrides,
});

/** Disaridan cozulebilen promise: "yanit bekleniyor" durumlarini test etmek icin. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
