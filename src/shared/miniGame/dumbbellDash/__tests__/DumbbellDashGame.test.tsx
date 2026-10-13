import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { DumbbellDashGame, type GameOverResult } from "../DumbbellDashGame";
import { TICK_MS, replay } from "../engine";

jest.mock("../../../theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));

const layout = { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 229 } } };

function renderGame(props: Partial<Parameters<typeof DumbbellDashGame>[0]> = {}) {
  const onGameOver = jest.fn<void, [GameOverResult]>();
  const onRunningChange = jest.fn<void, [boolean]>();
  const utils = render(
    <DumbbellDashGame seed={42} canStart onGameOver={onGameOver} onRunningChange={onRunningChange} {...props} />,
  );
  fireEvent(screen.getByTestId("dumbbell-dash-board"), "layout", layout);
  return { ...utils, onGameOver, onRunningChange, board: () => screen.getByTestId("dumbbell-dash-board") };
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("DumbbellDashGame", () => {
  let appStateListener: ((state: AppStateStatus) => void) | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    appStateListener = null;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      appStateListener = listener as (state: AppStateStatus) => void;
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("dokunmadan baslamaz; ilk dokunusla baslar ve dusunce oyun biter", () => {
    const { board, onGameOver, onRunningChange } = renderGame();
    advance(2_000);
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.getByText("Başlamak için dokun")).toBeTruthy();

    fireEvent(board(), "touchStart");
    expect(onRunningChange).toHaveBeenLastCalledWith(true);
    advance(5_000);

    expect(onGameOver).toHaveBeenCalledTimes(1);
    const result = onGameOver.mock.calls[0][0];
    expect(result.flapTicks).toEqual([0]);
    expect(result.score).toBe(0);
    // Istemcinin bildirdigi sonuc sunucudaki yeniden oynatmayla birebir ayni olmali.
    expect(replay(42, result.flapTicks)).toEqual({ valid: true, score: result.score, ticks: result.ticks });
    expect(onRunningChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByText("Oyun bitti")).toBeTruthy();
  });

  it("hizli art arda dokunuslar tek adimda tek ziplamaya indirgenir; sonuc yine dogrulanabilir", () => {
    const { board, onGameOver } = renderGame();
    fireEvent(board(), "touchStart");
    for (let i = 0; i < 40; i += 1) {
      fireEvent(board(), "touchStart");
      fireEvent(board(), "touchStart");
      fireEvent(board(), "touchStart");
      advance(TICK_MS * 3);
    }
    advance(10_000);

    const result = onGameOver.mock.calls[0][0];
    for (let i = 1; i < result.flapTicks.length; i += 1) {
      expect(result.flapTicks[i]).toBeGreaterThan(result.flapTicks[i - 1]);
    }
    expect(replay(42, result.flapTicks)).toEqual({ valid: true, score: result.score, ticks: result.ticks });
  });

  it("hazirlanirken (canStart=false) dokunus oyunu baslatmaz", () => {
    const { board, onRunningChange } = renderGame({ canStart: false });
    fireEvent(board(), "touchStart");
    advance(3_000);
    expect(onRunningChange).not.toHaveBeenCalled();
    expect(screen.getByText("Hazırlanıyor…")).toBeTruthy();
  });

  it("uygulama arka plana gecince duraklar, donuste dokunusla devam eder", () => {
    const { board, onGameOver } = renderGame();
    fireEvent(board(), "touchStart");
    advance(TICK_MS * 5);

    act(() => appStateListener?.("background"));
    advance(30_000);
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.getByText("Devam etmek için dokun")).toBeTruthy();

    act(() => appStateListener?.("active"));
    advance(5_000);
    expect(onGameOver).not.toHaveBeenCalled();

    fireEvent(board(), "touchStart");
    advance(5_000);
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it("dis duraklatma (suspended) oyunu durdurur ve devam ettirilmesine izin vermez", () => {
    const { board, onGameOver, rerender } = renderGame();
    fireEvent(board(), "touchStart");
    advance(TICK_MS * 3);

    rerender(<DumbbellDashGame seed={42} canStart suspended onGameOver={onGameOver} />);
    fireEvent(board(), "touchStart");
    advance(10_000);
    expect(onGameOver).not.toHaveBeenCalled();
  });

  it("pauseSignal degisince calisan oyun bir kez duraklar", () => {
    const { board, onGameOver, rerender } = renderGame({ pauseSignal: 0 });
    fireEvent(board(), "touchStart");
    advance(TICK_MS * 3);
    rerender(<DumbbellDashGame seed={42} canStart pauseSignal={1} pausedHint="Dinlenme bitti" onGameOver={onGameOver} />);
    advance(10_000);
    expect(onGameOver).not.toHaveBeenCalled();
    expect(screen.getByText("Dinlenme bitti")).toBeTruthy();
  });

  it("kapatildiginda (unmount) animasyon dongusu iptal edilir ve geri cagri yapilmaz", () => {
    const cancelSpy = jest.spyOn(globalThis, "cancelAnimationFrame");
    const { board, onGameOver, unmount } = renderGame();
    fireEvent(board(), "touchStart");
    advance(TICK_MS * 3);

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    advance(10_000);
    expect(onGameOver).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("oyun kapaliyken (baslamadan) hicbir zamanlayici/dongu calismaz", () => {
    renderGame();
    expect(jest.getTimerCount()).toBe(0);
  });
});
