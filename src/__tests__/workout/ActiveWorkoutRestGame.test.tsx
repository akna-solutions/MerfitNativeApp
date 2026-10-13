import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";

import { ActiveWorkout } from "../../app/pages/workout/ActiveWorkout";
import { NetworkError } from "../../services/api/client";
import { startMiniGameSession } from "../../services/api/miniGames";
import type { WorkoutSession } from "../../services/api/types";
import {
  completeWorkoutSession,
  logWorkoutSet,
  startWorkoutSession,
} from "../../services/api/workoutSessions";
import { mockThemeValue } from "../../test/mockTheme";

jest.mock("../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock fabrikasi import kullanamaz
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
// Gercek expo-router'daki gibi kararli (her render'da ayni) router nesnesi.
const mockRouter = { replace: jest.fn(), back: jest.fn(), push: jest.fn(), canGoBack: () => true };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../app/pages/workout/components/ExerciseVideo", () => ({ ExerciseVideo: () => null }));
jest.mock("../../services/api/workoutSessions", () => ({
  startWorkoutSession: jest.fn(),
  logWorkoutSet: jest.fn(),
  completeWorkoutSession: jest.fn(),
  cancelWorkoutSession: jest.fn(),
}));
jest.mock("../../services/api/miniGames", () => ({
  startMiniGameSession: jest.fn(),
  finishMiniGameSession: jest.fn(),
}));

const REST_SEC = 30;

const apiSession: WorkoutSession = {
  id: 501,
  workoutId: 9,
  title: "Full Body",
  status: "InProgress" as WorkoutSession["status"],
  startedAt: "2026-10-13T08:00:00Z",
  completedAt: null,
  durationSeconds: null,
  caloriesBurned: null,
  exercises: [
    {
      sessionExerciseId: 77,
      exerciseId: 3,
      name: "Şınav",
      order: 1,
      targetSets: 2,
      targetReps: 10,
      restSeconds: REST_SEC,
      durationSeconds: null,
      videoUrl: null,
      imageUrl: null,
      completedSets: [],
      previousBest: null,
      requiresWeight: false,
      lastPerformance: null,
    },
  ],
};

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

const remaining = () => screen.getByTestId("rest-timer-remaining").props.children as string;

async function startAndCompleteFirstSet() {
  render(<ActiveWorkout workoutId="9" />);
  await screen.findByText("SET 1 / 2");
  fireEvent.press(screen.getByText("Seti Tamamla"));
  await flush();
  expect(remaining()).toBe("00:30");
}

describe("ActiveWorkout - dinlenme sayaci ve mini oyun", () => {
  let appStateListeners: ((state: AppStateStatus) => void)[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    appStateListeners = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      appStateListeners.push(listener as (state: AppStateStatus) => void);
      return {
        remove: () => {
          appStateListeners = appStateListeners.filter((l) => l !== listener);
        },
      } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    (startWorkoutSession as jest.Mock).mockResolvedValue(apiSession);
    (logWorkoutSet as jest.Mock).mockResolvedValue({});
    (completeWorkoutSession as jest.Mock).mockResolvedValue({
      sessionId: 501,
      durationSeconds: 120,
      caloriesBurned: 20,
      newPersonalRecords: [],
    });
    // Mini oyun sunucusuna ulasilamiyor: oyun yine de (puansiz) oynanabilmeli.
    (startMiniGameSession as jest.Mock).mockRejectedValue(new NetworkError());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("oyun hic acilmadan dinlenme biter ve otomatik olarak sonraki sete gecilir (mevcut davranis)", async () => {
    await startAndCompleteFirstSet();
    expect(screen.getByText("Dinlenirken Oyna")).toBeTruthy();
    advance(REST_SEC * 1000);
    expect(screen.getByText("SET 2 / 2")).toBeTruthy();
  });

  it("oyun acikken sayac ayni hizda calisir; oyunu acip kapatmak sayaci sifirlamaz veya cogaltmaz", async () => {
    await startAndCompleteFirstSet();
    advance(5_000);
    expect(remaining()).toBe("00:25");

    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();
    expect(screen.getByTestId("dumbbell-dash-panel")).toBeTruthy();

    // Oyunu baslat: JS dongusu calisirken bile sayac gercek zamana gore ilerler.
    fireEvent(screen.getByTestId("dumbbell-dash-board"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 229 } } });
    fireEvent(screen.getByTestId("dumbbell-dash-board"), "touchStart");
    advance(10_000);
    expect(remaining()).toBe("00:15");

    fireEvent.press(screen.getByLabelText("Oyunu kapat"));
    expect(screen.queryByTestId("dumbbell-dash-panel")).toBeNull();
    expect(remaining()).toBe("00:15");

    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();
    advance(5_000);
    expect(remaining()).toBe("00:10");
  });

  it("sure oyun acikken dolarsa otomatik gecmez, 'Sonraki Sete Geç' gosterir; basinca sete gecer ve oyun kapanir", async () => {
    await startAndCompleteFirstSet();
    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();

    advance(REST_SEC * 1000 + 2_000);
    expect(remaining()).toBe("00:00");
    expect(screen.getByText("DİNLENME BİTTİ")).toBeTruthy();
    expect(screen.queryByText("SET 2 / 2")).toBeNull();

    fireEvent.press(screen.getByText("Sonraki Sete Geç"));
    expect(screen.getByText("SET 2 / 2")).toBeTruthy();
    expect(screen.queryByTestId("dumbbell-dash-panel")).toBeNull();
  });

  it("dinlenme bittiyse yeni oyun baslatilamaz; kullanici sete yonlendirilir", async () => {
    await startAndCompleteFirstSet();
    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();
    const board = screen.getByTestId("dumbbell-dash-board");
    fireEvent(board, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 229 } } });

    advance(REST_SEC * 1000 + 1_000);
    expect(screen.getByText("Dinlenme bitti, sete devam")).toBeTruthy();
    fireEvent(board, "touchStart");
    advance(1_000);
    expect(screen.getByText("Dinlenme bitti, sete devam")).toBeTruthy();
    expect(screen.queryByText("Başlamak için dokun")).toBeNull();
  });

  it("sure dolduktan sonra oyun kapatilirsa mevcut otomatik gecis calisir", async () => {
    await startAndCompleteFirstSet();
    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();
    advance(REST_SEC * 1000);

    fireEvent.press(screen.getByLabelText("Oyunu kapat"));
    expect(screen.getByText("SET 2 / 2")).toBeTruthy();
  });

  it("sonraki sete erken gecis oyunu tamamen durdurur", async () => {
    await startAndCompleteFirstSet();
    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();
    fireEvent(screen.getByTestId("dumbbell-dash-board"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 229 } } });
    fireEvent(screen.getByTestId("dumbbell-dash-board"), "touchStart");
    advance(500);

    const cancelSpy = jest.spyOn(globalThis, "cancelAnimationFrame");
    fireEvent.press(screen.getByText("Dinlenmeyi Atla"));
    expect(screen.getByText("SET 2 / 2")).toBeTruthy();
    expect(screen.queryByTestId("dumbbell-dash-panel")).toBeNull();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("uygulama arka plandan donunce gecen sure dogru yansir", async () => {
    await startAndCompleteFirstSet();
    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();

    // Arka planda zamanlayicilar calismaz: sistem saatini ilerletip yalnizca "active" olayini gonder.
    act(() => {
      jest.setSystemTime(Date.now() + 20_000);
      appStateListeners.forEach((listener) => listener("active"));
    });
    expect(remaining()).toBe("00:10");
  });

  it("antrenman tamamlama akisi eskisi gibi calisir (oyun acilip kapatilmis olsa da)", async () => {
    await startAndCompleteFirstSet();
    fireEvent.press(screen.getByText("Dinlenirken Oyna"));
    await flush();
    fireEvent.press(screen.getByLabelText("Oyunu kapat"));
    advance(REST_SEC * 1000);

    fireEvent.press(screen.getByText("Seti Tamamla"));
    await flush();
    await flush();
    await flush();

    expect(screen.getByText("ANTRENMAN TAMAMLANDI")).toBeTruthy();
    expect(logWorkoutSet).toHaveBeenCalledTimes(2);
    expect(completeWorkoutSession).toHaveBeenCalledWith(501, expect.objectContaining({ durationSeconds: expect.any(Number) }));
  });
});
