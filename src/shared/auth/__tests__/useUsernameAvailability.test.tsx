import { act, renderHook } from "@testing-library/react-native";

import { checkUsernameAvailability } from "../../../services/api/auth";
import { NetworkError } from "../../../services/api/client";
import { useUsernameAvailability } from "../useUsernameAvailability";

jest.mock("../../../services/api/auth", () => ({ checkUsernameAvailability: jest.fn() }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

async function flush(ms = 400) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useUsernameAvailability", () => {
  it("yazmayı bırakınca bir kez sorar; alınmışsa sunucu mesajını döner", async () => {
    (checkUsernameAvailability as jest.Mock).mockResolvedValue({ username: "mert", available: false, message: "Bu kullanıcı adı zaten kullanılıyor." });
    const { result, rerender } = renderHook(({ name }: { name: string }) => useUsernameAvailability(name), { initialProps: { name: "mer" } });

    rerender({ name: "Mert" });
    expect(result.current).toEqual({ state: "checking" });
    await flush();

    expect(checkUsernameAvailability).toHaveBeenCalledTimes(1);
    expect((checkUsernameAvailability as jest.Mock).mock.calls[0][0]).toBe("mert");
    expect(result.current).toEqual({ state: "unavailable", message: "Bu kullanıcı adı zaten kullanılıyor." });
  });

  it("uygun kullanıcı adında 'available' döner", async () => {
    (checkUsernameAvailability as jest.Mock).mockResolvedValue({ username: "mert_2", available: true });
    const { result } = renderHook(() => useUsernameAvailability("mert_2"));
    await flush();
    expect(result.current).toEqual({ state: "available" });
  });

  it("3 karakterden kısa veya boşken sormaz", async () => {
    const { result } = renderHook(() => useUsernameAvailability("ab"));
    await flush();
    expect(result.current).toEqual({ state: "idle" });
    expect(checkUsernameAvailability).not.toHaveBeenCalled();
  });

  it("ağ hatasında devamı engellemez ('unknown')", async () => {
    (checkUsernameAvailability as jest.Mock).mockRejectedValue(new NetworkError("offline"));
    const { result } = renderHook(() => useUsernameAvailability("mert"));
    await flush();
    expect(result.current).toEqual({ state: "unknown" });
  });
});
