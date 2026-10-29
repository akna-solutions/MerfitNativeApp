import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { getWeightReminder, logWeight, snoozeWeightReminder } from "../../../services/api/progress";
import { mockThemeValue } from "../../../test/mockTheme";
import { WEIGHT_REMINDER_DELAY_MS, resetWeightReminderSession, useWeightReminder } from "../useWeightReminder";
import { WeightReminderModal } from "../WeightReminderModal";

jest.mock("../../theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return { useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]) };
});
const mockProfile = { profile: { unitSystem: "metric" }, isLoaded: true };
jest.mock("../../profile/ProfileContext", () => ({ useProfile: () => mockProfile }));
jest.mock("../../../services/api/progress", () => ({
  getWeightReminder: jest.fn(),
  logWeight: jest.fn(),
  snoozeWeightReminder: jest.fn(),
}));

const getMock = getWeightReminder as jest.Mock;
const logMock = logWeight as jest.Mock;
const snoozeMock = snoozeWeightReminder as jest.Mock;

const due = {
  shouldPrompt: true,
  intervalDays: 2,
  lastLoggedDate: "2026-10-26",
  lastWeightKg: 80,
  snoozedUntil: null,
  unitSystem: "metric",
};

function Host({ blocked = false }: { blocked?: boolean }) {
  const controller = useWeightReminder({ blocked });
  return <WeightReminderModal controller={controller} />;
}

describe("useWeightReminder", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetWeightReminderSession();
    getMock.mockReset().mockResolvedValue(due);
    logMock.mockReset().mockResolvedValue({ date: "2026-10-29", weightKg: 79.4 });
    snoozeMock.mockReset().mockResolvedValue({ ...due, shouldPrompt: false });
    mockProfile.profile.unitSystem = "metric";
  });
  afterEach(() => jest.useRealTimers());

  it("kisa beklemeden sonra sorar ve kaydedince kapanir", async () => {
    render(<Host />);
    expect(getMock).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS);
    });
    expect(await screen.findByTestId("weight-reminder-modal")).toBeTruthy();
    expect(screen.getByTestId("weight-reminder-input").props.value).toBe("80");

    fireEvent.changeText(screen.getByTestId("weight-reminder-input"), "79,4");
    await act(async () => {
      fireEvent.press(screen.getByTestId("weight-reminder-save"));
    });
    expect(logMock).toHaveBeenCalledWith({ weightKg: 79.4 });
    await waitFor(() => expect(screen.queryByTestId("weight-reminder-modal")).toBeNull());
  });

  it("ayni oturumda ikinci kez sormaz", async () => {
    const first = render(<Host />);
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS);
    });
    first.unmount();
    render(<Host />);
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS * 2);
    });
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("baska bir pencere acikken sormaz", async () => {
    render(<Host blocked />);
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS * 2);
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it("erteleme ve kapatma sunucuya yazilir", async () => {
    render(<Host />);
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS);
    });
    await screen.findByTestId("weight-reminder-modal");
    fireEvent.press(screen.getByTestId("weight-reminder-dismiss"));
    expect(snoozeMock).toHaveBeenCalledWith("dismiss");
    await waitFor(() => expect(screen.queryByTestId("weight-reminder-modal")).toBeNull());
  });

  it("imperial tercihte lb gosterir ve kg olarak kaydeder", async () => {
    mockProfile.profile.unitSystem = "imperial";
    render(<Host />);
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS);
    });
    await screen.findByTestId("weight-reminder-modal");
    expect(screen.getByTestId("weight-reminder-input").props.value).toBe("176,4");
    fireEvent.changeText(screen.getByTestId("weight-reminder-input"), "176");
    await act(async () => {
      fireEvent.press(screen.getByTestId("weight-reminder-save"));
    });
    expect(logMock).toHaveBeenCalledWith({ weightKg: 79.8 });
  });

  it("gerek yoksa pencere acilmaz", async () => {
    getMock.mockResolvedValue({ ...due, shouldPrompt: false });
    render(<Host />);
    await act(async () => {
      jest.advanceTimersByTime(WEIGHT_REMINDER_DELAY_MS);
    });
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("weight-reminder-modal")).toBeNull();
  });
});
