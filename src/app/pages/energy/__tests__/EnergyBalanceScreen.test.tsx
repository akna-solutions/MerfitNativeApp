import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { makeEnergyDay, makeEnergyRange } from "../../../../test/energyFixtures";
import { mockThemeValue } from "../../../../test/mockTheme";
import { EnergyBalanceContent } from "../EnergyBalanceScreen";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../../../shared/motion/DumbbellSpinner", () => ({ DumbbellSpinner: () => null }));
jest.mock("../../../../shared/steps/StepCounterContext", () => ({ useStepCounter: jest.fn() }));
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]),
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), navigate: jest.fn() }),
  };
});

const TODAY = "2026-11-20";

function setup(overrides: { day?: ReturnType<typeof makeEnergyDay>; fail?: boolean } = {}) {
  const loadDay = jest.fn((date: string) =>
    overrides.fail ? Promise.reject(new Error("x")) : Promise.resolve({ ...(overrides.day ?? makeEnergyDay()), date }),
  );
  const loadRange = jest.fn(() => (overrides.fail ? Promise.reject(new Error("x")) : Promise.resolve(makeEnergyRange())));
  return { loadDay, loadRange };
}

describe("EnergyBalanceContent", () => {
  it("bugunun ozetini, harcama dagilimini, beslenme ve aktivite analizini gosterir", async () => {
    const { loadDay, loadRange } = setup({
      day: makeEnergyDay({ insights: [{ code: "workout_contribution", tone: "blue", text: "Antrenman yaptığın için enerji ihtiyacın yaklaşık 100 kcal arttı." }] }),
    });
    await render(<EnergyBalanceContent todayKey={TODAY} localTodaySteps={5000} caloriesPerStep={0.04} loadDay={loadDay} loadRange={loadRange} />);

    await waitFor(() => expect(screen.getByTestId("energy-day-summary")).toBeTruthy());
    expect(loadDay).toHaveBeenCalledWith(TODAY, expect.anything());
    expect(loadRange).toHaveBeenCalledWith("2026-11-14", TODAY, expect.anything());
    expect(screen.getByTestId("energy-net-balance").props.children).toBe("−100");
    expect(screen.getByText("Bazal metabolizma (şu ana kadar)")).toBeTruthy();
    expect(screen.getByText("Yürüyüş")).toBeTruthy();
    expect(screen.getByText("Günlük hareketlilik")).toBeTruthy();
    expect(screen.getByText("Antrenman")).toBeTruthy();
    expect(screen.getByText("Kahvaltı")).toBeTruthy();
    expect(screen.getByText("80 / 150 g")).toBeTruthy();
    expect(screen.getByText("5.000")).toBeTruthy();
    expect(screen.getByText("Antrenman yaptığın için enerji ihtiyacın yaklaşık 100 kcal arttı.")).toBeTruthy();
    expect(screen.getByTestId("energy-balance-chart")).toBeTruthy();
    expect(screen.getByTestId("energy-intake-expenditure-chart")).toBeTruthy();
    expect(screen.queryByTestId("energy-pending-steps")).toBeNull();
  });

  it("senkronize edilmemis adimlari tahmini olarak ekledigini belirtir", async () => {
    const { loadDay, loadRange } = setup();
    await render(<EnergyBalanceContent todayKey={TODAY} localTodaySteps={6000} caloriesPerStep={0.04} loadDay={loadDay} loadRange={loadRange} />);

    await waitFor(() => expect(screen.getByTestId("energy-pending-steps")).toBeTruthy());
    expect(screen.getByTestId("energy-net-balance").props.children).toBe("−140");
  });

  it("dun ve son 7 gun donemlerine gecer", async () => {
    const { loadDay, loadRange } = setup();
    await render(<EnergyBalanceContent todayKey={TODAY} localTodaySteps={0} caloriesPerStep={0.04} loadDay={loadDay} loadRange={loadRange} />);
    await waitFor(() => expect(screen.getByTestId("energy-day-summary")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("energy-period-yesterday"));
    await waitFor(() => expect(loadDay).toHaveBeenCalledWith("2026-11-19", expect.anything()));

    await fireEvent.press(screen.getByTestId("energy-period-week"));
    await waitFor(() => expect(screen.getByTestId("energy-range-summary")).toBeTruthy());
    expect(screen.getByTestId("energy-average-balance").props.children).toBe("−400");
    expect(screen.getByText("Kayıtlı 6 günde ortalama günlük 400 kcal açık.")).toBeTruthy();
    expect(screen.getAllByTestId("energy-week-row")).toHaveLength(1);
  });

  it("30 gun ve ozel aralik isteklerini dogru tarihlerle atar", async () => {
    const { loadDay, loadRange } = setup();
    await render(<EnergyBalanceContent todayKey={TODAY} localTodaySteps={0} caloriesPerStep={0.04} loadDay={loadDay} loadRange={loadRange} />);

    await fireEvent.press(screen.getByTestId("energy-period-month"));
    await waitFor(() => expect(loadRange).toHaveBeenCalledWith("2026-10-22", TODAY, expect.anything()));

    await fireEvent.press(screen.getByTestId("energy-period-custom"));
    await waitFor(() => expect(screen.getByTestId("energy-custom-range")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("energy-custom-from-prev"));
    await waitFor(() => expect(loadRange).toHaveBeenCalledWith("2026-11-13", TODAY, expect.anything()));
  });

  it("hata durumunda sahte deger gostermez", async () => {
    const { loadDay, loadRange } = setup({ fail: true });
    await render(<EnergyBalanceContent todayKey={TODAY} localTodaySteps={0} caloriesPerStep={0.04} loadDay={loadDay} loadRange={loadRange} />);

    await waitFor(() => expect(screen.getByTestId("energy-error")).toBeTruthy());
    expect(screen.queryByTestId("energy-day-summary")).toBeNull();
  });
});
