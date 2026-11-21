import { act, render, waitFor } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";

import { NetworkError } from "../../../services/api/client";
import * as stepsApi from "../../../services/api/steps";
import { toDateKey } from "../../calendar/dates";
import { StepCounterProvider, StepCounterValue, useStepCounter } from "../StepCounterContext";
import * as sensor from "../stepSensor";
import { StepState } from "../stepState";

// --- Mock'lar: yerel sensor, dosya deposu, API ve ag durumu ---------------------------------------------

let mockStored: string | null = null;
jest.mock("../stepStorage", () => ({
  loadStepState: jest.fn(async () => {
    const { parseStoredState } = jest.requireActual("../stepState");
    return parseStoredState(mockStored);
  }),
  saveStepState: jest.fn(async (state: unknown) => {
    mockStored = JSON.stringify(state);
  }),
  clearStepState: jest.fn(),
}));

let mockDeltaListener: ((steps: number, at: Date) => void) | null = null;
let mockHistory = true;
jest.mock("../stepSensor", () => ({
  SOURCE_KIND: "pedometer",
  coreMotionSource: { kind: "pedometer", stepsBetween: jest.fn() },
  supportsHistory: jest.fn(() => mockHistory),
  getSensorPermission: jest.fn(),
  readDayHourly: jest.fn(async () => new Array(24).fill(0)),
  watchStepDeltas: jest.fn((listener: (steps: number, at: Date) => void) => {
    mockDeltaListener = listener;
    return () => {
      mockDeltaListener = null;
    };
  }),
}));

jest.mock("../../../services/api/steps", () => ({
  syncSteps: jest.fn(),
  getStepSettings: jest.fn(),
  getStepDay: jest.fn(),
  getWeeklyStepSummary: jest.fn(),
}));

let mockNetworkListener: ((state: { isConnected?: boolean; isInternetReachable?: boolean }) => void) | null = null;
jest.mock("expo-network", () => ({
  addNetworkStateListener: jest.fn((listener: typeof mockNetworkListener) => {
    mockNetworkListener = listener;
    return { remove: () => undefined };
  }),
}));

jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ status: "signedIn", username: "ayse", sessionVersion: 0 }),
}));

const mockRequestAchievementCheck = jest.fn();
jest.mock("../../achievements/useAchievementCelebration", () => ({
  requestAchievementCheck: () => mockRequestAchievementCheck(),
}));

const api = stepsApi as jest.Mocked<typeof stepsApi>;
const sensorMock = sensor as jest.Mocked<typeof sensor>;

const SETTINGS: stepsApi.StepSettings = {
  dailyGoal: 10000, defaultDailyGoal: 10000, minDailyGoal: 1000, maxDailyGoal: 100000, strideLengthMeters: 0.75, caloriesPerStep: 0.04,
};

const emptyDay = (date: string): stepsApi.StepDay => ({
  date, totalSteps: 0, distanceMeters: 0, caloriesBurned: 0, dailyGoal: 10000, goalCompleted: false, completionPercent: 0, hasData: false, isVerified: false, hourlySteps: new Array(24).fill(0),
});

function acceptAll(request: stepsApi.StepSyncRequest): Promise<stepsApi.StepSyncResponse> {
  return Promise.resolve({
    settings: SETTINGS,
    days: request.days.map((d) => ({ ...emptyDay(d.date), totalSteps: d.hourlySteps.reduce((a, b) => a + b, 0), hasData: true, isVerified: true, status: "accepted" as const })),
  });
}

let appStateListener: ((state: AppStateStatus) => void) | null = null;

let latest: StepCounterValue | null = null;
function Probe() {
  latest = useStepCounter();
  return null;
}

async function mount() {
  const utils = await render(
    <StepCounterProvider>
      <Probe />
    </StepCounterProvider>,
  );
  await waitFor(() => expect(latest?.ready).toBe(true));
  return utils;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStored = null;
  mockDeltaListener = null;
  mockNetworkListener = null;
  mockHistory = false; // Android davranisi (canli sayac); iOS testinde degistirilir.
  latest = null;
  Object.defineProperty(AppState, "currentState", { value: "active", configurable: true });
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return { remove: () => undefined } as ReturnType<typeof AppState.addEventListener>;
  });
  sensorMock.getSensorPermission.mockResolvedValue({ status: "granted", canAskAgain: true });
  api.getStepDay.mockImplementation(async (date: string) => emptyDay(date));
  api.getStepSettings.mockResolvedValue(SETTINGS);
  api.syncSteps.mockImplementation(acceptAll);
});

const todayKey = () => toDateKey(new Date());

describe("StepCounterProvider", () => {
  it("1) ilk acilista izin istenmemisse 'undetermined' doner; izin verilince takip baslar", async () => {
    sensorMock.getSensorPermission.mockImplementation(async (request?: boolean) =>
      request ? { status: "granted", canAskAgain: true } : { status: "undetermined", canAskAgain: true });
    const utils = await mount();

    await waitFor(() => expect(latest?.status).toBe("undetermined"));
    expect(sensorMock.watchStepDeltas).not.toHaveBeenCalled();

    await act(async () => {
      await latest!.requestPermission();
    });

    expect(latest?.status).toBe("granted");
    expect(sensorMock.getSensorPermission).toHaveBeenLastCalledWith(true);
    expect(sensorMock.watchStepDeltas).toHaveBeenCalledTimes(1);
    await utils.unmount();
  });

  it("2) izin reddedilip tekrar sorulamiyorsa Ayarlar'a yonlendirilir; adim sayilmaz", async () => {
    sensorMock.getSensorPermission.mockResolvedValue({ status: "denied", canAskAgain: false });
    const utils = await mount();

    await waitFor(() => expect(latest?.status).toBe("denied"));
    expect(latest?.mustOpenSettings).toBe(true);
    expect(sensorMock.watchStepDeltas).not.toHaveBeenCalled();
    expect(latest?.todaySteps).toBe(0);
    await utils.unmount();
  });

  it("3) uygulama kapatilip acilinca bugunun adimlari korunur", async () => {
    let utils = await mount();
    await waitFor(() => expect(mockDeltaListener).not.toBeNull());
    await act(async () => {
      mockDeltaListener!(1200, new Date());
    });
    expect(latest?.todaySteps).toBe(1200);
    await utils.unmount(); // kapanirken bekleyen kayit diske yazilir

    latest = null;
    utils = await mount();
    expect(latest!.todaySteps).toBe(1200);
    await utils.unmount();
  });

  it("6-8) internet yokken adimlar cihazda kalir, internet gelince gonderilir; ayni veri tekrar gonderilmez", async () => {
    api.syncSteps.mockRejectedValue(new NetworkError());
    const utils = await mount();
    await waitFor(() => expect(mockDeltaListener).not.toBeNull());

    await act(async () => {
      mockDeltaListener!(800, new Date());
    });
    // Arka plana gecis senkronizasyonu tetikler; ag yok.
    await act(async () => {
      appStateListener!("background");
    });
    await waitFor(() => expect(api.syncSteps).toHaveBeenCalled());
    expect(latest?.todaySteps).toBe(800);
    expect(latest?.hasPendingSync).toBe(true);

    api.syncSteps.mockImplementation(acceptAll);
    api.syncSteps.mockClear();
    await act(async () => {
      mockNetworkListener!({ isConnected: true, isInternetReachable: true });
    });
    await waitFor(() => expect(api.syncSteps).toHaveBeenCalledTimes(1));
    const sent = api.syncSteps.mock.calls[0][0];
    expect(sent.days).toEqual([expect.objectContaining({ date: todayKey(), utcOffsetMinutes: -new Date().getTimezoneOffset() })]);
    expect(sent.days[0].hourlySteps.reduce((a, b) => a + b, 0)).toBe(800);
    await waitFor(() => expect(latest?.hasPendingSync).toBe(false));
    expect(mockRequestAchievementCheck).toHaveBeenCalled();

    // Degismeyen veri icin yeni istek atilmaz.
    await act(async () => {
      await latest!.syncNow();
    });
    expect(api.syncSteps).toHaveBeenCalledTimes(1);
    await utils.unmount();
  });

  it("9) hedef sunucudan gelir; eski surumden kalan yerel hedef yerine sunucu hedefi kullanilir", async () => {
    const stale: StepState = {
      version: 1, owner: null, synced: {}, lastSyncAt: null, days: {},
      settings: { ...SETTINGS, dailyGoal: 3000 },
    };
    mockStored = JSON.stringify({ ...stale, pendingGoal: 3000 });
    api.getStepSettings.mockResolvedValue({ ...SETTINGS, dailyGoal: 7500, goalSource: "auto" });
    const utils = await mount();

    await act(async () => {
      await latest!.syncNow();
    });

    expect(api.getStepSettings).toHaveBeenCalled();
    expect(latest?.dailyGoal).toBe(7500);
    expect(latest?.hasPendingSync).toBe(false);
    expect((latest as unknown as Record<string, unknown>).setDailyGoal).toBeUndefined();
    await utils.unmount();
  });

  it("uygulama yeniden kurulduysa bugunun adimlari sunucudan geri yuklenir", async () => {
    const hourly = new Array(24).fill(0);
    hourly[8] = 2500;
    api.getStepDay.mockImplementation(async (date: string) =>
      date === todayKey() ? { ...emptyDay(date), totalSteps: 2500, hasData: true, isVerified: true, hourlySteps: hourly } : emptyDay(date));
    const utils = await mount();

    await waitFor(() => expect(latest?.todaySteps).toBe(2500));
    // Sunucuda zaten olan veri tekrar gonderilmez.
    expect(api.syncSteps).not.toHaveBeenCalled();
    await utils.unmount();
  });

  it("iOS: adimlar CoreMotion gecmisinden okunur, canli olay yalnizca tetikleyicidir (cift sayim yok)", async () => {
    mockHistory = true;
    const hourly = new Array(24).fill(0);
    hourly[new Date().getHours()] = 640;
    sensorMock.readDayHourly.mockImplementation(async (_source, day: Date) =>
      toDateKey(day) === todayKey() ? hourly : new Array(24).fill(0));
    const utils = await mount();

    await waitFor(() => expect(latest?.todaySteps).toBe(640));
    await act(async () => {
      mockDeltaListener!(640, new Date());
    });
    expect(latest?.todaySteps).toBe(640);
    await utils.unmount();
  });

  it("Android: arka plana gecince canli abonelik kapanir, one gelince yeniden acilir", async () => {
    const utils = await mount();
    await waitFor(() => expect(mockDeltaListener).not.toBeNull());

    await act(async () => {
      appStateListener!("background");
    });
    expect(mockDeltaListener).toBeNull();

    await act(async () => {
      appStateListener!("active");
    });
    await waitFor(() => expect(mockDeltaListener).not.toBeNull());
    await utils.unmount();
  });

  it("baska bir kullanicinin cihazdaki verisi yuklenmez", async () => {
    const other: StepState = {
      version: 1, owner: "mehmet", synced: {}, settings: null, lastSyncAt: null,
      days: { [todayKey()]: { hourly: new Array(24).fill(100), offsetMinutes: 180 } },
    };
    mockStored = JSON.stringify(other);
    const utils = await mount();

    expect(latest?.todaySteps).toBe(0);
    await utils.unmount();
  });
});
