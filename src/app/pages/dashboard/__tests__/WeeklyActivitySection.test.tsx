import { fireEvent, render, screen } from "@testing-library/react-native";

import { CalendarDay } from "../../../../services/api/types";
import { makeDay } from "../../../../test/calendarFixtures";
import { mockThemeValue } from "../../../../test/mockTheme";
import { WeeklyActivitySection, calorieState, workoutState } from "../components/WeeklyActivitySection";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const keys = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];

function week(): Map<string, CalendarDay> {
  const map = new Map<string, CalendarDay>();
  keys.forEach((date) => map.set(date, makeDay({ date, isFuture: date > "2026-10-29", isToday: date === "2026-10-29" })));
  // Pazartesi: antrenman + kalori hedefi tamam; Sali: ogun var, hedef tutmadi.
  map.set(keys[0], makeDay({
    date: keys[0],
    workout: { completed: true, totalDurationSeconds: 1800, sessions: [] },
    nutrition: { ...makeDay().nutrition, logged: true, calorieRatio: 1, calorieGoalMet: true },
  }));
  map.set(keys[1], makeDay({ date: keys[1], nutrition: { ...makeDay().nutrition, logged: true, calorieRatio: 0.4 } }));
  return map;
}

describe("WeeklyActivitySection", () => {
  it("kalori satirini antrenmandan bagimsiz, gercek hedef kuralina gore gosterir", () => {
    const days = week();
    expect(workoutState(days.get(keys[0]))).toBe("done");
    expect(calorieState(days.get(keys[0]))).toBe("met");
    // Antrenman yapilmamis ama ogun girilmis gun: kalori "kismi", antrenman bos.
    expect(workoutState(days.get(keys[1]))).toBe("none");
    expect(calorieState(days.get(keys[1]))).toBe("partial");
    // Gelecek gun hicbir zaman tamamlanmis gorunmez.
    expect(calorieState(days.get(keys[5]))).toBe("future");
  });

  it("planli ama yapilmamis gecmis gunu ve dinlenme gununu ayirir", () => {
    expect(workoutState(makeDay({ isPlannedWorkoutDay: true }))).toBe("missed");
    expect(workoutState(makeDay({ isPlannedWorkoutDay: true, isToday: true }))).toBe("none");
    expect(workoutState(makeDay({ isPlannedWorkoutDay: false }))).toBe("rest");
  });

  it("bugunu vurgular, ozet sayilari yazar ve gune dokununca o tarihi bildirir", () => {
    const onDayPress = jest.fn();
    render(<WeeklyActivitySection weekKeys={keys} days={week()} loading={false} error={false} onRetry={jest.fn()} onDayPress={onDayPress} />);

    expect(screen.getByText("1 antrenman · 1 kalori hedefi")).toBeTruthy();
    expect(screen.getByTestId("weekly-day-2026-10-29").props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(screen.getByTestId("weekly-day-2026-10-27"));
    expect(onDayPress).toHaveBeenCalledWith("2026-10-27");
  });

  it("veri alinamazsa tekrar dene gosterir", () => {
    const onRetry = jest.fn();
    render(<WeeklyActivitySection weekKeys={keys} days={new Map()} loading={false} error onRetry={onRetry} onDayPress={jest.fn()} />);
    fireEvent.press(screen.getByText("Tekrar dene"));
    expect(onRetry).toHaveBeenCalled();
  });
});
