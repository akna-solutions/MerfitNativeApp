import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ActivityCalendarResponse, CalendarDay } from "../../../../../services/api/types";
import { fetchCalendar } from "../../../../../shared/calendar/calendarCache";
import { makeDay } from "../../../../../test/calendarFixtures";
import { mockThemeValue } from "../../../../../test/mockTheme";
import { CalendarSheet } from "../CalendarSheet";
import { EMPTY_DAY_TEXT } from "../DaySummary";

jest.mock("../../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock("../../../../../shared/calendar/calendarCache", () => ({
  fetchCalendar: jest.fn(),
  peekCalendar: () => undefined,
}));

const fetchMock = fetchCalendar as jest.Mock;

function monthResponse(from: string, to: string): ActivityCalendarResponse {
  const days: CalendarDay[] = [];
  for (let d = new Date(`${from}T12:00:00`); d <= new Date(`${to}T12:00:00`); d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push(makeDay({ date: key, isToday: key === "2026-10-29", isFuture: key > "2026-10-29" }));
  }
  const byKey = (key: string) => days.findIndex((day) => day.date === key);
  const i = byKey("2026-10-14");
  if (i >= 0) {
    days[i] = makeDay({
      date: "2026-10-14",
      workout: {
        completed: true,
        totalDurationSeconds: 2700,
        sessions: [{ id: 77, title: "Bacak", completedAt: "2026-10-14T09:00:00Z", durationSeconds: 2700, caloriesBurned: 300, exerciseCount: 5, setCount: 18 }],
      },
      nutrition: {
        logged: true, consumedCalories: 1950, protein: 140, carbs: 200, fat: 60, calorieRatio: 0.975, calorieGoalMet: true,
        meals: [{ type: "Kahvaltı", calories: 500, itemCount: 3 }],
      },
      activity: { caloriesBurned: 300, activeMinutes: 45 },
    });
  }
  return {
    from, to, today: "2026-10-29", timeZone: "Europe/Istanbul", dailyCalorieTarget: 2000,
    calorieGoalLowerRatio: 0.9, calorieGoalUpperRatio: 1.1, days,
  };
}

describe("CalendarSheet", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockImplementation((from: string, to: string) => Promise.resolve(monthResponse(from, to)));
    mockPush.mockReset();
  });

  it("odak gunuyle acilir, ayi tek istekte getirir ve gun ozetini gosterir", async () => {
    render(<CalendarSheet visible focusDate="2026-10-14" onClose={jest.fn()} />);

    expect(screen.getByTestId("calendar-month-title").props.children.join("")).toBe("Ekim 2026");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("2026-09-28", "2026-11-01", expect.anything()));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(await screen.findByText("Bacak")).toBeTruthy();
    expect(screen.getByText("140 g")).toBeTruthy();
    expect(screen.getByText("Hedef tamam ✓")).toBeTruthy();
    expect(screen.getByTestId("calendar-rings-2026-10-14-workout")).toBeTruthy();
    // Kaydi olmayan gunde halka yok.
    expect(screen.queryByTestId("calendar-rings-2026-10-13-workout")).toBeNull();
  });

  it("kaydi olmayan gun icin bos durum metnini, gelecek gun icin sahte veri gostermez", async () => {
    render(<CalendarSheet visible focusDate="2026-10-14" onClose={jest.fn()} />);
    await screen.findByText("Bacak");

    fireEvent.press(screen.getByTestId("calendar-day-2026-10-13"));
    expect(screen.getByText(EMPTY_DAY_TEXT)).toBeTruthy();

    fireEvent.press(screen.getByTestId("calendar-day-2026-10-31"));
    expect(screen.getByText("Bu gün henüz gelmedi.")).toBeTruthy();
  });

  it("onceki aya gecer, bugunun ayindan ileri gitmez", async () => {
    render(<CalendarSheet visible focusDate={null} onClose={jest.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByTestId("calendar-next").props.accessibilityState).toEqual({ disabled: true });

    await act(async () => {
      fireEvent.press(screen.getByTestId("calendar-prev"));
    });
    expect(screen.getByTestId("calendar-month-title").props.children.join("")).toBe("Eylül 2026");
    expect(fetchMock).toHaveBeenLastCalledWith("2026-08-31", "2026-10-04", expect.anything());
  });

  it("antrenmana dokununca gecmis detayina gider", async () => {
    const onClose = jest.fn();
    render(<CalendarSheet visible focusDate="2026-10-14" onClose={onClose} />);
    fireEvent.press(await screen.findByTestId("day-session-77"));
    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/pages/workout/history/[id]", params: { id: "77" } });
  });

  it("alttan acilan perde olarak acilir: ustte bosluk birakir, alt inset'i uygular", async () => {
    await render(<CalendarSheet visible focusDate="2026-10-14" onClose={jest.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Test ortaminda pencere 1334 px: perde 1334 - 47 (ust inset) - 24 = 1263 px.
    expect(screen.getByTestId("calendar-sheet")).toHaveStyle({ height: 1263, paddingBottom: 34 });
  });

  it("kapaliyken istek atmaz", () => {
    render(<CalendarSheet visible={false} focusDate={null} onClose={jest.fn()} />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
