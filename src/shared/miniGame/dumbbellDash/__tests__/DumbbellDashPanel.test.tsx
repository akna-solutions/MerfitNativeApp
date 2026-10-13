import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { ApiError, NetworkError } from "../../../../services/api/client";
import { finishMiniGameSession, startMiniGameSession } from "../../../../services/api/miniGames";
import type { MiniGameResult, MiniGameSession } from "../../../../services/api/types";
import { mockThemeValue } from "../../../../test/mockTheme";
import { DumbbellDashPanel } from "../DumbbellDashPanel";

jest.mock("../../../theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("../../../../services/api/miniGames", () => ({
  startMiniGameSession: jest.fn(),
  finishMiniGameSession: jest.fn(),
}));

// Oyun alani kendi testinde (DumbbellDashGame.test.tsx) dogrulanir; burada panelin odul akisini test
// etmek icin oyunu "bitiren" basit bir yer tutucu kullanilir.
const mockGameOver = { score: 52, ticks: 5274, flapTicks: [0, 30, 61] };
const defaultGameOver = { ...mockGameOver };
jest.mock("../DumbbellDashGame", () => ({
  DumbbellDashGame: (props: { seed: number; canStart: boolean; onGameOver: (r: typeof mockGameOver) => void }) => {
    const { Pressable: P, Text: T } = jest.requireActual("react-native");
    return (
      <P testID="mock-game" onPress={() => props.onGameOver(mockGameOver)} disabled={!props.canStart}>
        <T>{`seed:${props.canStart ? props.seed : "pending"}`}</T>
      </P>
    );
  },
}));

const startMock = startMiniGameSession as jest.MockedFunction<typeof startMiniGameSession>;
const finishMock = finishMiniGameSession as jest.MockedFunction<typeof finishMiniGameSession>;

const session = (overrides: Partial<MiniGameSession> = {}): MiniGameSession => ({
  rewardsEnabled: true,
  sessionId: 11,
  seed: 4294967295,
  engineVersion: 1,
  expiresAt: null,
  rules: {
    tiers: [
      { minScore: 10, points: 1 },
      { minScore: 20, points: 2 },
      { minScore: 30, points: 3 },
      { minScore: 50, points: 5 },
    ],
    maxPointsPerGame: 5,
    dailyPointLimit: 15,
  },
  earnedToday: 3,
  remainingToday: 12,
  ...overrides,
});

const rewarded = (overrides: Partial<MiniGameResult> = {}): MiniGameResult => ({
  sessionId: 11,
  status: "Rewarded",
  verifiedScore: 52,
  tierPoints: 5,
  awardedPoints: 5,
  dailyLimitReached: false,
  previousTotalPoints: 1200,
  totalPoints: 1205,
  earnedToday: 8,
  remainingToday: 7,
  nextTier: null,
  ...overrides,
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("DumbbellDashPanel (iki giris noktasinin ortak paneli)", () => {
  beforeEach(() => {
    Object.assign(mockGameOver, defaultGameOver);
    jest.useFakeTimers();
    startMock.mockReset();
    finishMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sunucu seed'iyle baslar, odul tablosunu gosterir ve sonucu dogrulatip puani gosterir", async () => {
    startMock.mockResolvedValue(session());
    finishMock.mockResolvedValue(rewarded());
    const onRewardGranted = jest.fn();

    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} onRewardGranted={onRewardGranted} />);
    await flush();

    expect(startMock).toHaveBeenCalledWith(1, expect.any(Object));
    expect(screen.getByText("seed:4294967295")).toBeTruthy();
    expect(screen.getByLabelText("10 skor, 1 puan")).toBeTruthy();
    expect(screen.getByLabelText("50 skor, 5 puan")).toBeTruthy();
    expect(screen.getByText("Bugün 12 / 15 puan daha kazanabilirsin")).toBeTruthy();

    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();

    expect(finishMock).toHaveBeenCalledWith(11, mockGameOver);
    expect(screen.getByTestId("dumbbell-dash-awarded").props.children).toEqual(["+", 5, " MB FIT puanı"]);
    expect(screen.getByText("Toplam: 1,200 → 1,205 puan")).toBeTruthy();
    expect(onRewardGranted).toHaveBeenCalledTimes(1);
  });

  it("odul yoksa skoru ve bir sonraki odul icin gereken skoru gosterir", async () => {
    startMock.mockResolvedValue(session());
    finishMock.mockResolvedValue(
      rewarded({ status: "NoReward", verifiedScore: 7, tierPoints: 0, awardedPoints: 0, nextTier: { minScore: 10, points: 1 } }),
    );
    const onRewardGranted = jest.fn();
    mockGameOver.score = 7;
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} onRewardGranted={onRewardGranted} />);
    await flush();
    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();

    expect(screen.getByText("Bu turda puan yok.")).toBeTruthy();
    expect(screen.getByText("Sonraki ödül: 10 skorda +1 puan")).toBeTruthy();
    expect(onRewardGranted).not.toHaveBeenCalled();
  });

  it("baglanti koparsa AYNI istegi yeniden dener; odul ve geri cagri yalnizca bir kez olur", async () => {
    startMock.mockResolvedValue(session());
    finishMock
      .mockRejectedValueOnce(new NetworkError())
      .mockRejectedValueOnce(new ApiError(503, "down"))
      .mockResolvedValueOnce(rewarded());
    const onRewardGranted = jest.fn();
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} onRewardGranted={onRewardGranted} />);
    await flush();
    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();
    expect(screen.getByText("Sonuç doğrulanıyor…")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });
    await flush();

    expect(finishMock).toHaveBeenCalledTimes(3);
    for (const call of finishMock.mock.calls) expect(call).toEqual([11, mockGameOver]);
    expect(onRewardGranted).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("dumbbell-dash-awarded")).toBeTruthy();
  });

  it("gonderim tamamen basarisiz olursa 'Tekrar Gönder' ayni oturumu tekrar gonderir", async () => {
    startMock.mockResolvedValue(session());
    finishMock.mockRejectedValue(new NetworkError());
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    await flush();
    fireEvent.press(screen.getByTestId("mock-game"));
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
    }
    expect(screen.getByText(/Sonuç sunucuya iletilemedi/)).toBeTruthy();

    finishMock.mockReset();
    finishMock.mockResolvedValue(rewarded());
    fireEvent.press(screen.getByText("Tekrar Gönder"));
    await flush();
    expect(finishMock).toHaveBeenCalledWith(11, mockGameOver);
    expect(screen.getByTestId("dumbbell-dash-awarded")).toBeTruthy();
  });

  it("oturum acilamazsa oyun puansiz oynanir ve sonuc sunucuya gonderilmez", async () => {
    startMock.mockRejectedValue(new NetworkError());
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    await flush();

    expect(screen.getByText(/Sunucuya bağlanılamadı; bu tur puan kazandırmaz/)).toBeTruthy();
    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();
    expect(finishMock).not.toHaveBeenCalled();
    expect(screen.getAllByText(/bu tur puan kazandırmaz/).length).toBeGreaterThan(0);
  });

  it("gunluk oyun siniri (429) mesajini gosterir ve puansiz oynatir", async () => {
    startMock.mockRejectedValue(new ApiError(429, "Bugün için oyun sınırına ulaştın."));
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    await flush();
    expect(screen.getByText(/Bugün için oyun sınırına ulaştın\. Bu tur puan kazandırmaz\./)).toBeTruthy();
  });

  it("Tekrar Oyna yeni oturum acar, skoru/durumu sifirlar; ayni sonuc tekrar gonderilmez", async () => {
    startMock.mockResolvedValueOnce(session()).mockResolvedValueOnce(session({ sessionId: 12, seed: 99 }));
    finishMock.mockResolvedValue(rewarded());
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    await flush();
    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();

    fireEvent.press(screen.getByText("Tekrar Oyna"));
    await flush();

    expect(startMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("seed:99")).toBeTruthy();
    expect(screen.queryByTestId("dumbbell-dash-summary")).toBeNull();
    expect(finishMock).toHaveBeenCalledTimes(1);
  });

  it("gunluk puan hakki dolduysa bunu tek satirda soyler", async () => {
    startMock.mockResolvedValue(session({ earnedToday: 15, remainingToday: 0 }));
    render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    await flush();
    expect(screen.getByText("Bugünkü puan hakkını doldurdun. Oyun puansız devam eder.")).toBeTruthy();
  });

  it("yeni tur engelliyse oyun baslamaz ve 'Tekrar Oyna' yerine verilen eylem gosterilir", async () => {
    startMock.mockResolvedValue(session());
    finishMock.mockResolvedValue(rewarded());
    const onAction = jest.fn();
    const blocked = { message: "Dinlenme bitti, sete devam", actionLabel: "Sonraki Sete Geç", onAction };
    const { rerender } = render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    await flush();
    // Tur oynanirken dinlenme biter: devam eden tur bitirilebilir.
    rerender(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} replayBlocked={blocked} />);
    expect(screen.getByText("seed:pending")).toBeTruthy(); // canStart=false
    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();
    expect(finishMock).not.toHaveBeenCalled();

    // Engel kalkmadan once biten bir tur (orn. engel geldiginde zaten oynaniyordu) icin eylem gosterilir.
    rerender(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} />);
    fireEvent.press(screen.getByTestId("mock-game"));
    await flush();
    rerender(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} replayBlocked={blocked} />);
    expect(screen.queryByText("Tekrar Oyna")).toBeNull();
    fireEvent.press(screen.getByText("Sonraki Sete Geç"));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("kapat butonu onClose'u cagirir", async () => {
    startMock.mockResolvedValue(session());
    const onClose = jest.fn();
    render(<DumbbellDashPanel subtitle="test" onClose={onClose} />);
    await flush();
    fireEvent.press(screen.getByLabelText("Oyunu kapat"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("panel kapatilsa bile bekleyen odul tamamlanir ve geri cagri yapilir", async () => {
    startMock.mockResolvedValue(session());
    let resolveFinish: (value: MiniGameResult) => void = () => undefined;
    finishMock.mockReturnValue(new Promise((resolve) => (resolveFinish = resolve)));
    const onRewardGranted = jest.fn();
    const { unmount } = render(<DumbbellDashPanel subtitle="test" onClose={jest.fn()} onRewardGranted={onRewardGranted} />);
    await flush();
    fireEvent.press(screen.getByTestId("mock-game"));
    unmount();

    await act(async () => resolveFinish(rewarded()));
    expect(onRewardGranted).toHaveBeenCalledTimes(1);
  });
});
