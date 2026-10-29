import { getActivityCalendar } from "../../../services/api/progress";
import { CALENDAR_CACHE_TTL_MS, fetchCalendar, invalidateCalendarCache, peekCalendar } from "../calendarCache";

jest.mock("../../../services/api/progress", () => ({ getActivityCalendar: jest.fn() }));

const mocked = getActivityCalendar as jest.MockedFunction<typeof getActivityCalendar>;
const response = (from: string) => ({
  from, to: from, today: from, timeZone: "Europe/Istanbul", dailyCalorieTarget: null,
  calorieGoalLowerRatio: 0.9, calorieGoalUpperRatio: 1.1, days: [],
});

describe("calendarCache", () => {
  beforeEach(() => {
    invalidateCalendarCache();
    mocked.mockReset();
    jest.useRealTimers();
  });

  it("ayni aralik icin es zamanli cagrilar tek istek atar ve sonuc onbellege alinir", async () => {
    mocked.mockResolvedValue(response("2026-10-01"));
    const [a, b] = await Promise.all([fetchCalendar("2026-10-01", "2026-10-31"), fetchCalendar("2026-10-01", "2026-10-31")]);
    expect(a).toBe(b);
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(peekCalendar("2026-10-01", "2026-10-31")).toBe(a);
    await fetchCalendar("2026-10-01", "2026-10-31");
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it("force ve sure dolumu onbellegi atlar", async () => {
    mocked.mockResolvedValue(response("2026-10-01"));
    await fetchCalendar("2026-10-01", "2026-10-31");
    await fetchCalendar("2026-10-01", "2026-10-31", { force: true });
    expect(mocked).toHaveBeenCalledTimes(2);

    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now + CALENDAR_CACHE_TTL_MS + 1);
    expect(peekCalendar("2026-10-01", "2026-10-31")).toBeUndefined();
    (Date.now as jest.Mock).mockRestore();
  });

  it("iptal edilen ekran sonucu almaz ama paylasilan istek onbellege yazilir", async () => {
    mocked.mockResolvedValue(response("2026-09-01"));
    const controller = new AbortController();
    const pending = fetchCalendar("2026-09-01", "2026-09-30", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(peekCalendar("2026-09-01", "2026-09-30")).toBeDefined();
  });
});
