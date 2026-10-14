import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { DashboardShortcuts } from "../components/DashboardShortcuts";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("DashboardShortcuts", () => {
  const handlers = () => ({
    onMealPhotoPress: jest.fn(),
    onGamePress: jest.fn(),
    onAssistantPress: jest.fn(),
    onScorePress: jest.fn(),
  });

  it("dort kisayolu gosterir ve her biri kendi aksiyonunu cagirir", () => {
    const h = handlers();
    render(<DashboardShortcuts points={1250} {...h} />);

    fireEvent.press(screen.getByTestId("dashboard-shortcut-meal-photo"));
    fireEvent.press(screen.getByTestId("dashboard-shortcut-game"));
    fireEvent.press(screen.getByTestId("dashboard-shortcut-assistant"));
    fireEvent.press(screen.getByTestId("dashboard-shortcut-score"));

    expect(h.onMealPhotoPress).toHaveBeenCalledTimes(1);
    expect(h.onGamePress).toHaveBeenCalledTimes(1);
    expect(h.onAssistantPress).toHaveBeenCalledTimes(1);
    expect(h.onScorePress).toHaveBeenCalledTimes(1);
    expect(screen.getByText((1250).toLocaleString("tr-TR"))).toBeTruthy();
  });

  it("puan yoksa tire gosterir", () => {
    render(<DashboardShortcuts points={null} {...handlers()} />);
    expect(screen.getByText("—")).toBeTruthy();
  });
});
