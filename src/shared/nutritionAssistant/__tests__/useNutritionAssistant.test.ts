import { act, renderHook } from "@testing-library/react-native";

import { ApiError, NetworkError } from "../../../services/api/client";
import { deleteAssistantConversation, getAssistantConversation, sendAssistantMessage } from "../../../services/api/nutritionAssistant";
import { chatReply, conversation, deferred, msg } from "../../../test/nutritionAssistantFixtures";
import { assistantErrorMessage, useNutritionAssistant } from "../useNutritionAssistant";

jest.mock("../../../services/api/nutritionAssistant", () => ({
  getAssistantConversation: jest.fn(),
  sendAssistantMessage: jest.fn(),
  deleteAssistantConversation: jest.fn(),
}));

const getMock = getAssistantConversation as jest.MockedFunction<typeof getAssistantConversation>;
const sendMock = sendAssistantMessage as jest.MockedFunction<typeof sendAssistantMessage>;
const deleteMock = deleteAssistantConversation as jest.MockedFunction<typeof deleteAssistantConversation>;

beforeEach(() => {
  getMock.mockReset();
  sendMock.mockReset();
  deleteMock.mockReset();
});

describe("useNutritionAssistant", () => {
  it("acilista gunun sohbetini ve karsilamayi sunucudan yukler", async () => {
    getMock.mockResolvedValue(
      conversation({ conversationId: 7, messages: [msg(1, "user", "Merhaba"), msg(2, "assistant", "Selam")] }),
    );
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    expect(result.current.state.status).toBe("idle");

    await act(() => result.current.load());

    expect(getMock).toHaveBeenCalledWith("2026-10-13", expect.anything());
    expect(result.current.state.status).toBe("ready");
    expect(result.current.state.conversationId).toBe(7);
    expect(result.current.state.greeting).toContain("Merhaba Ayşe");
    expect(result.current.state.items.map((i) => i.content)).toEqual(["Merhaba", "Selam"]);
  });

  it("mesaji gonderir, sunucunun dondurdugu sohbet kimligini sonraki mesajda kullanir", async () => {
    getMock.mockResolvedValue(conversation());
    sendMock.mockResolvedValueOnce(chatReply(10, "Ne yemeliyim?", "Yoğurt deneyebilirsin."));
    sendMock.mockResolvedValueOnce(chatReply(12, "Peki akşam?", "Izgara tavuk iyi olur."));
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());

    await act(async () => {
      expect(await result.current.send("  Ne yemeliyim?  ")).toBe(true);
    });
    expect(sendMock).toHaveBeenLastCalledWith({ message: "Ne yemeliyim?", conversationId: null, date: "2026-10-13" }, expect.anything());

    await act(() => result.current.send("Peki akşam?"));
    expect(sendMock).toHaveBeenLastCalledWith({ message: "Peki akşam?", conversationId: 7, date: "2026-10-13" }, expect.anything());
    expect(result.current.state.items.map((i) => [i.role, i.content, i.status])).toEqual([
      ["user", "Ne yemeliyim?", "sent"],
      ["assistant", "Yoğurt deneyebilirsin.", "sent"],
      ["user", "Peki akşam?", "sent"],
      ["assistant", "Izgara tavuk iyi olur.", "sent"],
    ]);
    expect(result.current.state.remaining).toBe(39);
    expect(result.current.state.suggestions).toEqual(["Antrenman sonrası ne yemeliyim?"]);
  });

  it("yanit beklenirken gelen ikinci gonderimi yok sayar (cift istek olmaz)", async () => {
    getMock.mockResolvedValue(conversation());
    const pending = deferred<ReturnType<typeof chatReply>>();
    sendMock.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.send("Bir");
      second = result.current.send("İki");
    });
    expect(await second).toBe(false);
    expect(result.current.state.sending).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(chatReply(1, "Bir", "Yanıt"));
      await first;
    });
    expect(result.current.state.sending).toBe(false);
    expect(result.current.state.items).toHaveLength(2);
  });

  it("bos mesaj gondermez", async () => {
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(async () => {
      expect(await result.current.send("   ")).toBe(false);
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("basarisiz mesaji isaretler ve tekrar denemede ayni metni yeniden gonderir", async () => {
    getMock.mockResolvedValue(conversation());
    sendMock.mockRejectedValueOnce(new ApiError(503, "Beslenme asistanı şu anda yanıt veremiyor."));
    sendMock.mockResolvedValueOnce(chatReply(3, "Ne yemeliyim?", "Yoğurt."));
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());

    await act(() => result.current.send("Ne yemeliyim?"));
    const failed = result.current.state.items[0];
    expect(failed.status).toBe("failed");
    expect(result.current.state.sendError).toBe("Beslenme asistanı şu anda yanıt veremiyor.");

    await act(() => result.current.retry(failed.key));
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[1][0].message).toBe("Ne yemeliyim?");
    expect(result.current.state.items.map((i) => [i.content, i.status])).toEqual([
      ["Ne yemeliyim?", "sent"],
      ["Yoğurt.", "sent"],
    ]);
    expect(result.current.state.sendError).toBeNull();
  });

  it("yukleme hatasini gosterir; yeniden yukleme basarili olunca sohbet gelir", async () => {
    getMock.mockRejectedValueOnce(new NetworkError());
    getMock.mockResolvedValueOnce(conversation());
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));

    await act(() => result.current.load());
    expect(result.current.state.status).toBe("error");
    expect(result.current.state.loadError).toContain("Bağlantı kurulamadı");

    await act(() => result.current.load());
    expect(result.current.state.status).toBe("ready");
  });

  it("yeniden acilista onceki sohbet ekranda kalir ve sunucudan yenilenir", async () => {
    getMock.mockResolvedValueOnce(conversation({ conversationId: 7, messages: [msg(1, "user", "Merhaba")] }));
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());

    const refresh = deferred<ReturnType<typeof conversation>>();
    getMock.mockReturnValueOnce(refresh.promise);
    let loading!: Promise<void>;
    act(() => {
      loading = result.current.load();
    });
    // Yenileme surerken yukleniyor ekrani yerine eski sohbet gorunur.
    expect(result.current.state.status).toBe("ready");
    expect(result.current.state.items).toHaveLength(1);

    await act(async () => {
      refresh.resolve(conversation({ conversationId: 7, messages: [msg(1, "user", "Merhaba"), msg(2, "assistant", "Selam")] }));
      await loading;
    });
    expect(result.current.state.items).toHaveLength(2);
  });

  it("gun degisince yeni gunun sohbeti ayri tutulur", async () => {
    getMock.mockResolvedValueOnce(conversation({ conversationId: 7, messages: [msg(1, "user", "Dünkü soru")] }));
    getMock.mockResolvedValueOnce(conversation({ date: "2026-10-14", messages: [] }));
    const { result, rerender } = renderHook(({ date }: { date: string }) => useNutritionAssistant(date), { initialProps: { date: "2026-10-13" } });
    await act(() => result.current.load());

    rerender({ date: "2026-10-14" });
    expect(result.current.state.status).toBe("idle");
    await act(() => result.current.load());
    expect(getMock).toHaveBeenLastCalledWith("2026-10-14", expect.anything());
    expect(result.current.state.items).toHaveLength(0);
    expect(result.current.state.conversationId).toBeNull();

    rerender({ date: "2026-10-13" });
    expect(result.current.state.items.map((i) => i.content)).toEqual(["Dünkü soru"]);
  });

  it("ekran kapaninca bekleyen istek iptal edilir", async () => {
    getMock.mockResolvedValue(conversation());
    let signal: AbortSignal | undefined;
    sendMock.mockImplementation((_req, s) => {
      signal = s;
      return new Promise(() => undefined);
    });
    const { result, unmount } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());
    act(() => {
      void result.current.send("Merhaba");
    });
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});

describe("useNutritionAssistant clear", () => {
  it("sohbeti siler, mesajlari temizler ve sonraki mesaj yeni sohbet baslatir", async () => {
    getMock.mockResolvedValue(conversation({ conversationId: 7, messages: [msg(1, "user", "Tavuk istemiyorum")] }));
    deleteMock.mockResolvedValue(undefined);
    sendMock.mockResolvedValue(chatReply(20, "Merhaba", "Selam"));
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());

    await act(async () => {
      expect(await result.current.clear()).toBeNull();
    });
    expect(deleteMock).toHaveBeenCalledWith("2026-10-13", expect.anything());
    expect(result.current.state.items).toHaveLength(0);
    expect(result.current.state.conversationId).toBeNull();
    expect(result.current.state.greeting).toContain("Merhaba Ayşe");

    await act(() => result.current.send("Merhaba"));
    expect(sendMock.mock.calls[0][0].conversationId).toBeNull();
  });

  it("silme hatasinda sohbet korunur ve hata mesaji doner", async () => {
    getMock.mockResolvedValue(conversation({ conversationId: 7, messages: [msg(1, "user", "Soru")] }));
    deleteMock.mockRejectedValue(new NetworkError());
    const { result } = renderHook(() => useNutritionAssistant("2026-10-13"));
    await act(() => result.current.load());

    let error: string | null = null;
    await act(async () => {
      error = await result.current.clear();
    });
    expect(error).toContain("Bağlantı kurulamadı");
    expect(result.current.state.items).toHaveLength(1);
  });
});

describe("assistantErrorMessage", () => {
  it("hatalari anlasilir Turkce mesajlara cevirir", () => {
    expect(assistantErrorMessage(new ApiError(429, "Bugünkü mesaj limitine ulaştın."))).toBe("Bugünkü mesaj limitine ulaştın.");
    expect(assistantErrorMessage(new ApiError(503, "Beslenme asistanı şu an çok yoğun. Lütfen biraz sonra tekrar dene."))).toContain("çok yoğun");
    expect(assistantErrorMessage(new ApiError(401, "Unauthorized"))).toContain("Oturumunun süresi doldu");
    expect(assistantErrorMessage(new ApiError(500, "Internal"))).toContain("yanıt veremiyor");
    expect(assistantErrorMessage(new NetworkError("İstek zaman aşımına uğradı."))).toContain("uzun sürdü");
    expect(assistantErrorMessage(new Error("x"))).toBe("Bir sorun oluştu. Lütfen tekrar dene.");
  });
});
