import { render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { WeeklyActivity } from "../components/WeeklyActivity";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

describe("WeeklyActivity", () => {
  // Pazartesi, Carsamba, Cuma antrenman gunu; Sali antrenman yapilmis olsa da dinlenme gunu.
  const restDays = [false, true, false, true, false, true, true];
  const days = [true, true, false, false, true, false, false];

  it("dinlenme gunlerini antrenman yapilsa bile mavi gostermez", () => {
    render(<WeeklyActivity days={days} restDays={restDays} />);
    expect(screen.getByTestId("weekly-rest-1")).toBeTruthy();
    expect(screen.queryByTestId("weekly-day-1")).toBeNull();
    expect(flat(screen.getByTestId("weekly-day-0").props.style).backgroundColor).toBe(mockThemeValue.colors.primary);
    expect(flat(screen.getByTestId("weekly-day-2").props.style).backgroundColor).not.toBe(mockThemeValue.colors.primary);
    expect(screen.getByText("Bu hafta 2 / 3 antrenman")).toBeTruthy();
    expect(screen.getByText("Dinlenme günü")).toBeTruthy();
  });

  it("program bilinmiyorsa eskisi gibi yapilan antrenmanlari sayar", () => {
    render(<WeeklyActivity days={days} />);
    expect(screen.queryByTestId("weekly-rest-1")).toBeNull();
    expect(screen.getByText("Bu hafta 3 antrenman")).toBeTruthy();
  });
});
