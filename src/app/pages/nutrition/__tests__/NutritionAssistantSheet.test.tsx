import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { Alert, Keyboard } from "react-native";

import { ApiError } from "../../../../services/api/client";
import { deleteAssistantConversation, getAssistantConversation, sendAssistantMessage } from "../../../../services/api/nutritionAssistant";
import { useNutritionAssistant } from "../../../../shared/nutritionAssistant/useNutritionAssistant";
import { mockThemeValue } from "../../../../test/mockTheme";
import { chatReply, conversation, deferred, msg } from "../../../../test/nutritionAssistantFixtures";
import { ASSISTANT_TITLE, dragReleaseAction, NutritionAssistantSheet } from "../components/assistant/NutritionAssistantSheet";
import { NutritionHeader } from "../components/NutritionHeader";
import { INSIGHT_FALLBACK_MESSAGE, NutritionInsight } from "../components/NutritionInsight";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../../../../services/api/nutritionAssistant", () => ({
  getAssistantConversation: jest.fn(),
  sendAssistantMessage: jest.fn(),
  deleteAssistantConversation: jest.fn(),
}));

const getMock = getAssistantConversation as jest.MockedFunction<typeof getAssistantConversation>;
const sendMock = sendAssistantMessage as jest.MockedFunction<typeof sendAssistantMessage>;
const deleteMock = deleteAssistantConversation as jest.MockedFunction<typeof deleteAssistantConversation>;
const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

/** Beslenme ekranindaki kullanimin aynisi: kart -> pencere, durum ekran seviyesinde tutulur. */
function Harness({ date = "2026-10-13" }: { date?: string }) {
  const [open, setOpen] = useState(false);
  const assistant = useNutritionAssistant(date);
  return (
    <>
      <NutritionInsight
        insight={{ status: "proteinBehind", message: "Protein hedefinin gerisindesin.", suggestedQuestion: null }}
        onViewSuggestions={() => setOpen(true)}
      />
      <NutritionAssistantSheet visible={open} onClose={() => setOpen(false)} controller={assistant} />
    </>
  );
}

async function openSheet() {
  fireEvent.press(screen.getByTestId("nutrition-insight"));
  await waitFor(() => expect(screen.queryByTestId("assistant-loading")).toBeNull());
}

beforeEach(() => {
  getMock.mockReset();
  sendMock.mockReset();
  deleteMock.mockReset();
});

describe("NutritionInsight", () => {
  it("sunucunun degerlendirmesini gosterir, yoksa varsayim icermeyen notr metne duser", () => {
    const { rerender } = render(
      <NutritionInsight
        insight={{ status: "goalsCompleted", message: "Bugünkü hedeflerini tamamladın.", suggestedQuestion: null }}
        onViewSuggestions={jest.fn()}
      />,
    );
    expect(screen.getByText("Bugünkü hedeflerini tamamladın.")).toBeTruthy();
    expect(screen.getByText("Önerileri görüntüle")).toBeTruthy();
    expect(screen.queryByText(/protein alımın düşük/)).toBeNull();

    rerender(<NutritionInsight onViewSuggestions={jest.fn()} />);
    expect(screen.getByText(INSIGHT_FALLBACK_MESSAGE)).toBeTruthy();
  });
});

describe("NutritionHeader", () => {
  it("sag ustteki asistan butonu asistani acar", () => {
    const onAssistantPress = jest.fn();
    const onNotificationsPress = jest.fn();
    render(<NutritionHeader onAssistantPress={onAssistantPress} onNotificationsPress={onNotificationsPress} />);
    fireEvent.press(screen.getByTestId("nutrition-assistant-button"));
    expect(onAssistantPress).toHaveBeenCalledTimes(1);
    expect(onNotificationsPress).not.toHaveBeenCalled();
  });
});

describe("dragReleaseAction", () => {
  it("basliktan asagi cekince pencere tam ekrandayken de kapanir", () => {
    expect(dragReleaseAction(150, 0.2, "collapsed")).toBe("close");
    expect(dragReleaseAction(150, 0.2, "expanded")).toBe("close");
    expect(dragReleaseAction(30, 1.5, "expanded")).toBe("close");
  });

  it("kisa surukleme pencereyi boyutlandirir, cok kisa surukleme yerinde birakir", () => {
    expect(dragReleaseAction(80, 0.1, "expanded")).toBe("collapsed");
    expect(dragReleaseAction(-80, -0.1, "collapsed")).toBe("expanded");
    expect(dragReleaseAction(10, 0.1, "expanded")).toBe("expanded");
  });
});

describe("NutritionAssistantSheet", () => {
  it("Onerileri goruntule'ye basinca pencere acilir, baslik ve karsilama gorunur", async () => {
    getMock.mockResolvedValue(conversation());
    render(<Harness />);
    expect(screen.queryByText(ASSISTANT_TITLE)).toBeNull();

    fireEvent.press(screen.getByTestId("nutrition-insight"));
    expect(screen.getByText(ASSISTANT_TITLE)).toBeTruthy();
    expect(screen.getByTestId("assistant-loading")).toBeTruthy();

    expect(await screen.findByText(/Merhaba Ayşe!/)).toBeTruthy();
    expect(getMock).toHaveBeenCalledWith("2026-10-13", expect.anything());
    // Henuz soru sorulmadiysa bos durum ipucu ve hizli sorular gorunur.
    expect(screen.getByTestId("assistant-empty")).toBeTruthy();
    expect(screen.getByText("Bugün protein ihtiyacımı nasıl tamamlayabilirim?")).toBeTruthy();
  });

  it("mesaj gonderir; yanit beklenirken yaziyor gostergesi gorunur, sonra yanit eklenir", async () => {
    getMock.mockResolvedValue(conversation());
    const pending = deferred<ReturnType<typeof chatReply>>();
    sendMock.mockReturnValue(pending.promise);
    render(<Harness />);
    await openSheet();

    fireEvent.changeText(screen.getByTestId("assistant-input"), "Akşam ne yiyeyim?");
    fireEvent.press(screen.getByTestId("assistant-send"));

    expect(screen.getByText("Akşam ne yiyeyim?")).toBeTruthy();
    expect(screen.getByTestId("assistant-typing")).toBeTruthy();
    expect(screen.getByTestId("assistant-input").props.value).toBe("");
    expect(screen.getByTestId("assistant-send").props.accessibilityState.disabled).toBe(true);

    await act(async () => pending.resolve(chatReply(5, "Akşam ne yiyeyim?", "Izgara balık ve salata iyi olur.")));

    expect(screen.getByText("Izgara balık ve salata iyi olur.")).toBeTruthy();
    expect(screen.queryByTestId("assistant-typing")).toBeNull();
    expect(screen.getAllByTestId("assistant-bubble-user")).toHaveLength(1);
    // Karsilama + yanit
    expect(screen.getAllByTestId("assistant-bubble-assistant")).toHaveLength(2);
  });

  it("hizli soruya dokunmak o soruyu gonderir; art arda dokunmalar tek istek olur", async () => {
    getMock.mockResolvedValue(conversation());
    sendMock.mockReturnValue(new Promise(() => undefined));
    render(<Harness />);
    await openSheet();

    const chip = screen.getByText("Akşam yemeğinde ne tercih etmeliyim?");
    fireEvent.press(chip);
    fireEvent.press(chip);
    fireEvent.changeText(screen.getByTestId("assistant-input"), "Bir soru daha");
    fireEvent.press(screen.getByTestId("assistant-send"));

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].message).toBe("Akşam yemeğinde ne tercih etmeliyim?");
  });

  it("hata durumunda mesaj basarisiz isaretlenir ve tekrar dene ile yeniden gonderilir", async () => {
    getMock.mockResolvedValue(conversation());
    sendMock.mockRejectedValueOnce(new ApiError(503, "Beslenme asistanı şu anda yanıt veremiyor."));
    sendMock.mockResolvedValueOnce(chatReply(5, "Protein?", "Yumurta ekleyebilirsin."));
    render(<Harness />);
    await openSheet();

    fireEvent.changeText(screen.getByTestId("assistant-input"), "Protein?");
    await act(async () => fireEvent.press(screen.getByTestId("assistant-send")));

    expect(screen.getByTestId("assistant-send-error")).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText("Gönderilemedi · Tekrar dene")));

    expect(screen.getByText("Yumurta ekleyebilirsin.")).toBeTruthy();
    expect(screen.queryByText("Gönderilemedi · Tekrar dene")).toBeNull();
    expect(screen.getAllByText("Protein?")).toHaveLength(1);
  });

  it("sohbet yuklenemezse hata ve tekrar dene gosterir", async () => {
    getMock.mockRejectedValueOnce(new ApiError(500, "x"));
    getMock.mockResolvedValueOnce(conversation());
    render(<Harness />);
    fireEvent.press(screen.getByTestId("nutrition-insight"));

    expect(await screen.findByTestId("assistant-load-error")).toBeTruthy();
    expect(screen.getByTestId("assistant-send").props.accessibilityState.disabled).toBe(true);
    await act(async () => fireEvent.press(screen.getByText("Tekrar dene")));
    expect(await screen.findByText(/Merhaba Ayşe!/)).toBeTruthy();
  });

  it("kapatilip yeniden acildiginda ayni gunun sohbeti geri gelir", async () => {
    getMock.mockResolvedValueOnce(conversation());
    sendMock.mockResolvedValueOnce(chatReply(5, "Merhaba", "Selam, nasıl yardımcı olabilirim?"));
    render(<Harness />);
    await openSheet();
    fireEvent.changeText(screen.getByTestId("assistant-input"), "Merhaba");
    await act(async () => fireEvent.press(screen.getByTestId("assistant-send")));

    jest.useFakeTimers();
    fireEvent.press(screen.getByTestId("assistant-close"));
    act(() => jest.advanceTimersByTime(1000));
    jest.useRealTimers();
    expect(screen.queryByText(ASSISTANT_TITLE)).toBeNull();

    getMock.mockResolvedValueOnce(
      conversation({ conversationId: 7, messages: [msg(5, "user", "Merhaba"), msg(6, "assistant", "Selam, nasıl yardımcı olabilirim?")] }),
    );
    fireEvent.press(screen.getByTestId("nutrition-insight"));
    // Sunucu yaniti gelmeden once de onceki mesajlar ekrandadir.
    expect(screen.getByText("Selam, nasıl yardımcı olabilirim?")).toBeTruthy();
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(screen.getAllByTestId("assistant-bubble-user")).toHaveLength(1);
  });

  it("model yanitindaki HTML'i yorumlamadan duz metin olarak gosterir", async () => {
    const html = '<img src=x onerror="alert(1)"><b>kalın</b>';
    getMock.mockResolvedValue(conversation({ conversationId: 7, messages: [msg(1, "user", "Soru"), msg(2, "assistant", html)] }));
    render(<Harness />);
    await openSheet();
    expect(screen.getByText(html)).toBeTruthy();
  });

  it("asistan kullanilamiyorsa veya gunluk limit dolduysa gonderim kapanir", async () => {
    getMock.mockResolvedValueOnce(conversation({ assistantAvailable: false }));
    const { unmount } = render(<Harness />);
    await openSheet();
    expect(screen.getByTestId("assistant-unavailable")).toBeTruthy();
    expect(screen.getByTestId("assistant-input").props.editable).toBe(false);
    expect(screen.queryByTestId("assistant-quick-questions")).toBeNull();
    unmount();

    getMock.mockResolvedValueOnce(conversation({ remainingMessages: 0 }));
    render(<Harness />);
    await openSheet();
    expect(screen.getByTestId("assistant-limit")).toBeTruthy();
    expect(screen.getByTestId("assistant-input").props.editable).toBe(false);
  });

  it("klavye acilinca icerik klavye yuksekligi kadar yukari tasinir", async () => {
    getMock.mockResolvedValue(conversation());
    const listeners: Record<string, (e: unknown) => void> = {};
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation((event, handler) => {
      listeners[event] = handler as (e: unknown) => void;
      return { remove: jest.fn() } as never;
    });
    render(<Harness />);
    await openSheet();

    const showEvent = Object.keys(listeners).find((k) => k.endsWith("Show"))!;
    const hideEvent = Object.keys(listeners).find((k) => k.endsWith("Hide"))!;
    const padding = () => flat(screen.getByTestId("assistant-body").props.style).paddingBottom;

    act(() => listeners[showEvent]({ endCoordinates: { height: 320 } }));
    expect(padding()).toBe(320);
    act(() => listeners[hideEvent]({}));
    expect(padding()).not.toBe(320);
    spy.mockRestore();
  });

  it("sohbet sil onaylaninca gecmis temizlenir, karsilama kalir", async () => {
    getMock.mockResolvedValue(conversation({ conversationId: 7, messages: [msg(1, "user", "Tavuk istemiyorum"), msg(2, "assistant", "Tamam")] }));
    deleteMock.mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const destructive = buttons?.find((b) => b.style === "destructive");
      void destructive?.onPress?.();
    });
    render(<Harness />);
    await openSheet();
    expect(screen.getByText("Tavuk istemiyorum")).toBeTruthy();

    await act(async () => fireEvent.press(screen.getByTestId("assistant-clear")));

    expect(deleteMock).toHaveBeenCalledWith("2026-10-13", expect.anything());
    expect(screen.queryByText("Tavuk istemiyorum")).toBeNull();
    expect(screen.getByText(/Merhaba Ayşe!/)).toBeTruthy();
    expect(screen.queryByTestId("assistant-clear")).toBeNull();
    alertSpy.mockRestore();
  });
});
