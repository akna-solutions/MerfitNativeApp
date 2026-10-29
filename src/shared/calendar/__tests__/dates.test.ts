import { addDays, buildMonthGrid, formatLongDate, parseDateKey, shiftMonth, toDateKey, weekKeys } from "../dates";

describe("calendar dates", () => {
  it("haftayi Pazartesi baslatir", () => {
    // 29 Ekim 2026 Persembe.
    expect(weekKeys(new Date(2026, 9, 29, 9))).toEqual([
      "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01",
    ]);
    // Pazar gunu, onceki Pazartesiden baslayan haftaya aittir.
    expect(weekKeys(new Date(2026, 10, 1, 23))[0]).toBe("2026-10-26");
  });

  it("aylik izgarayi Pazartesi-Pazar tam haftalarla kurar", () => {
    const grid = buildMonthGrid(2026, 1); // Subat 2026: 1'i Pazar
    expect(grid.from).toBe("2026-01-26");
    expect(grid.to).toBe("2026-03-01");
    expect(grid.weeks.every((week) => week.length === 7)).toBe(true);
    expect(grid.weeks[0][6]).toEqual({ key: "2026-02-01", day: 1, inMonth: true });
    expect(grid.weeks[0][0].inMonth).toBe(false);
    // Sunucu sinirindan (62 gun) kisa kalir.
    const days = grid.weeks.length * 7;
    expect(days).toBeLessThanOrEqual(42);
  });

  it("gecersiz tarih anahtarlarini reddeder", () => {
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("bugun")).toBeNull();
    expect(parseDateKey(undefined)).toBeNull();
    expect(toDateKey(parseDateKey("2026-10-29")!)).toBe("2026-10-29");
  });

  it("ay ve gun kaydirmalari yil sinirini gecer", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(toDateKey(addDays(new Date(2026, 11, 31, 12), 1))).toBe("2027-01-01");
  });

  it("uzun tarihi Turkce yazar", () => {
    expect(formatLongDate("2026-10-29")).toBe("29 Ekim Perşembe");
  });
});
