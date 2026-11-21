import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { StepWeeklySummary } from "../../../../services/api/steps";
import { toDateKey } from "../../../../shared/calendar/dates";
import type { StepCounterValue } from "../../../../shared/steps/StepCounterContext";
import { DEFAULT_STEP_SETTINGS } from "../../../../shared/steps/stepState";
import { mockThemeValue } from "../../../../test/mockTheme";
import { StepActivityCard } from "../../dashboard/components/StepActivityCard";
import { ActivityContent } from "../ActivityScreen";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../../../shared/motion/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("../../../../shared/motion/DumbbellSpinner", () => ({ DumbbellSpinner: () => null }));
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]),
    useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  };
});
jest.mock("../../../../shared/steps/StepCounterContext", () => ({
  EMPTY_HOURLY: new Array(24).fill(0),
  useStepCounter: jest.fn(),
}));

const settings = { ...DEFAULT_STEP_SETTINGS, strideLengthMeters: 0.7337, caloriesPerStep: 0.0379 };

function cardProps(overrides: Partial<Parameters<typeof StepActivityCard>[0]> = {}) {
  return {
    status: "granted" as const,
    ready: true,
    steps: 8450,
    goal: 10000,
    settings,
    mustOpenSettings: false,
    onPress: jest.fn(),
    onEnable: jest.fn(),
    onOpenSettings: jest.fn(),
    ...overrides,
  };
}

describe("StepActivityCard", () => {
  it("gercek degerlerden adim, yuzde, kalan, kalori ve mesafeyi gosterir", async () => {
    const props = cardProps();
    await render(<StepActivityCard {...props} />);

    expect(screen.getByText("8.450 / 10.000 adım")).toBeTruthy();
    expect(screen.getByText("%84,5 tamamlandı")).toBeTruthy();
    expect(screen.getByText("1.550 adım kaldı")).toBeTruthy();
    expect(screen.getByText("320 kcal")).toBeTruthy();
    expect(screen.getByText("6,2 km")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("step-activity-card"));
    expect(props.onPress).toHaveBeenCalled();
  });

  it("izin istenmediyse sahte deger yerine baslatma cagrisi gosterir", async () => {
    const props = cardProps({ status: "undetermined", steps: 0 });
    await render(<StepActivityCard {...props} />);

    expect(screen.queryByText("0")).toBeNull();
    await fireEvent.press(screen.getByText("Adım sayarı başlat"));
    expect(props.onEnable).toHaveBeenCalled();
  });

  it("izin kalici reddedildiyse Ayarlar'a yonlendirir", async () => {
    const props = cardProps({ status: "denied", mustOpenSettings: true });
    await render(<StepActivityCard {...props} />);

    await fireEvent.press(screen.getByText("Ayarları aç"));
    expect(props.onOpenSettings).toHaveBeenCalled();
  });

  it("sensor yoksa aciklama gosterir, eylem gostermez", async () => {
    await render(<StepActivityCard {...cardProps({ status: "unavailable" })} />);

    expect(screen.getByText("Adım sensörü bulunamadı")).toBeTruthy();
    expect(screen.queryByTestId("step-card-action")).toBeNull();
  });
});

describe("ActivityContent", () => {
  const todayKey = toDateKey(new Date());
  const hourly = new Array(24).fill(0);
  hourly[8] = 3000;
  hourly[9] = 1500;

  function counter(overrides: Partial<StepCounterValue> = {}): StepCounterValue {
    return {
      status: "granted",
      mustOpenSettings: false,
      ready: true,
      todayKey,
      todaySteps: 4500,
      dailyGoal: 10000,
      settings,
      days: { [todayKey]: { hourly, offsetMinutes: 180 } },
      backgroundHistorySupported: false,
      lastSyncAt: null,
      hasPendingSync: false,
      requestPermission: jest.fn(),
      openSettings: jest.fn(),
      syncNow: jest.fn(async () => undefined),
      ...overrides,
    };
  }

  const summary = (): StepWeeklySummary => ({
    startDate: todayKey, endDate: todayKey, days: [], totalSteps: 0, averageSteps: 0, totalDistanceMeters: 0, totalCaloriesBurned: 0,
    goalCompletedDays: 0, goalCompletionRate: 0, mostActiveDay: null, previousPeriodTotalSteps: 2000, changePercent: null,
  });

  it("bugunun ozetini, saatlik ve haftalik grafikleri ve Android sinir notunu gosterir", async () => {
    const value = counter();
    const loadSummary = jest.fn(async () => summary());
    await render(<ActivityContent counter={value} loadSummary={loadSummary} />);

    await waitFor(() => expect(loadSummary).toHaveBeenCalledWith(todayKey, expect.anything()));
    expect(value.syncNow).toHaveBeenCalled();
    expect(screen.getByTestId("activity-today-steps").props.children).toBe("4.500");
    expect(screen.getByText("%45 tamamlandı")).toBeTruthy();
    expect(screen.getByText("5.500 adım kaldı")).toBeTruthy();
    expect(screen.getByTestId("hourly-steps-chart")).toBeTruthy();
    expect(screen.getByTestId("weekly-steps-chart")).toBeTruthy();
    expect(screen.getByText("En hareketli saat 08:00 · 3.000 adım")).toBeTruthy();
    expect(screen.getByText("Hedef tamamlama")).toBeTruthy();
    expect(screen.getByTestId("activity-android-note")).toBeTruthy();
    // 4.500 / 2.000 onceki donem = +%125
    await waitFor(() => expect(screen.getByTestId("activity-compare")).toBeTruthy());
  });

  it("hedef duzenlenemez; sunucunun belirledigi hedef ve aciklamasi gosterilir", async () => {
    const value = counter({ settings: { ...settings, goalSource: "auto", goalReason: "Hedefin aktivite seviyene göre otomatik belirlendi." } });
    await render(<ActivityContent counter={value} loadSummary={async () => summary()} />);

    expect(screen.queryByTestId("activity-goal-button")).toBeNull();
    expect(screen.getByTestId("activity-goal-tile")).toBeTruthy();
    expect(screen.getByText("Hedefin aktivite seviyene göre otomatik belirlendi.")).toBeTruthy();
  });

  it("sunucuya ulasilamazsa yerel veriyle calistigini soyler", async () => {
    await render(<ActivityContent counter={counter({ hasPendingSync: true })} loadSummary={async () => Promise.reject(new Error("offline"))} />);

    expect(await screen.findByText("Geçmiş veriler alınamadı; şu an yalnızca bu cihazdaki adımlar gösteriliyor.")).toBeTruthy();
    expect(screen.getByText(/henüz sunucuya gönderilmedi/)).toBeTruthy();
  });
});
