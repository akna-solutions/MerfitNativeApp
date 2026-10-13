import type { AssistantChatResponse, AssistantConversationResponse, AssistantMessage } from "../../services/api/types";

/** Ekranda gosterilen sohbet ogesi. Kullanici mesaji sunucu onaylayana kadar "sending", hata alirsa "failed". */
export type ChatItem = {
  key: string;
  role: "user" | "assistant";
  content: string;
  status: "sent" | "sending" | "failed";
};

export type AssistantDayState = {
  status: "idle" | "loading" | "ready" | "error";
  loadError: string | null;
  conversationId: number | null;
  available: boolean;
  greeting: string | null;
  items: ChatItem[];
  suggestions: string[];
  remaining: number | null;
  sending: boolean;
  sendError: string | null;
};

/** Gun ("yyyy-MM-dd") -> o gunun sohbet durumu. Gun degisince onceki gunun sohbeti karismaz. */
export type AssistantState = Record<string, AssistantDayState>;

export const initialDayState: AssistantDayState = {
  status: "idle",
  loadError: null,
  conversationId: null,
  available: true,
  greeting: null,
  items: [],
  suggestions: [],
  remaining: null,
  sending: false,
  sendError: null,
};

export type AssistantAction =
  | { type: "loadStart"; date: string }
  | { type: "loadSuccess"; date: string; response: AssistantConversationResponse }
  | { type: "loadFailure"; date: string; message: string }
  | { type: "sendStart"; date: string; key: string; text: string }
  | { type: "sendSuccess"; date: string; key: string; response: AssistantChatResponse }
  | { type: "sendFailure"; date: string; key: string; message: string }
  | { type: "removeItem"; date: string; key: string };

export function toChatItem(message: AssistantMessage, fallbackKey: string): ChatItem {
  return {
    key: message.id != null ? `m${message.id}` : fallbackKey,
    role: message.role,
    content: message.content,
    status: "sent",
  };
}

function update(state: AssistantState, date: string, change: (day: AssistantDayState) => AssistantDayState): AssistantState {
  return { ...state, [date]: change(state[date] ?? initialDayState) };
}

export function assistantReducer(state: AssistantState, action: AssistantAction): AssistantState {
  switch (action.type) {
    case "loadStart":
      // Onceden yuklenmis sohbet varsa ekranda kalir; yalnizca ilk yuklemede "loading" gosterilir.
      return update(state, action.date, (day) => ({
        ...day,
        status: day.status === "ready" ? "ready" : "loading",
        loadError: null,
      }));

    case "loadSuccess":
      return update(state, action.date, (day) => {
        const serverItems = action.response.messages.map((m, i) => toChatItem(m, `s${i}`));
        // Gonderimi suren / basarisiz olmus yerel mesajlar sunucu listesinin sonunda korunur.
        const localItems = day.items.filter((item) => item.status !== "sent");
        return {
          ...day,
          status: "ready",
          loadError: null,
          conversationId: action.response.conversationId ?? day.conversationId,
          available: action.response.assistantAvailable,
          greeting: action.response.greeting.content,
          items: [...serverItems, ...localItems],
          suggestions: action.response.suggestedQuestions,
          remaining: action.response.remainingMessages,
        };
      });

    case "loadFailure":
      return update(state, action.date, (day) => ({
        ...day,
        status: day.status === "ready" ? "ready" : "error",
        loadError: action.message,
      }));

    case "sendStart":
      return update(state, action.date, (day) => ({
        ...day,
        sending: true,
        sendError: null,
        items: [...day.items, { key: action.key, role: "user", content: action.text, status: "sending" }],
      }));

    case "sendSuccess":
      return update(state, action.date, (day) => ({
        ...day,
        sending: false,
        sendError: null,
        conversationId: action.response.conversationId,
        items: [
          ...day.items.map((item) =>
            item.key === action.key ? toChatItem(action.response.userMessage, action.key) : item,
          ),
          toChatItem(action.response.message, `${action.key}-reply`),
        ],
        suggestions: action.response.suggestedQuestions,
        remaining: action.response.remainingMessages,
      }));

    case "sendFailure":
      return update(state, action.date, (day) => ({
        ...day,
        sending: false,
        sendError: action.message,
        items: day.items.map((item) => (item.key === action.key ? { ...item, status: "failed" } : item)),
      }));

    case "removeItem":
      return update(state, action.date, (day) => ({
        ...day,
        items: day.items.filter((item) => item.key !== action.key),
        sendError: null,
      }));

    default:
      return state;
  }
}
