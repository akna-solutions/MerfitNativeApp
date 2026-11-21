import { makeEnergyDay } from "../../../test/energyFixtures";
import { mockThemeValue } from "../../../test/mockTheme";
import {
  balanceLabel,
  breakdownItems,
  clampCustomRange,
  formatSignedKcal,
  periodRange,
  toneColor,
  withLiveSteps,
} from "../energy";

describe("energy helpers", () => {
  it("dengeyi isaretli ve Turkce bicimler", () => {
    expect(formatSignedKcal(-350)).toBe("−350 kcal");
    expect(formatSignedKcal(1250)).toBe("+1.250 kcal");
    expect(formatSignedKcal(0)).toBe("0 kcal");
    expect(formatSignedKcal(null)).toBe("—");
    expect(balanceLabel(-350)).toBe("Kalori açığı");
    expect(balanceLabel(400)).toBe("Kalori fazlası");
    expect(balanceLabel(20)).toBe("Kalori dengesi");
  });

  it("renkleri tema ile eslestirir, mor kullanmaz", () => {
    const colors = mockThemeValue.colors;
    expect(toneColor("blue", colors)).toBe(colors.primary);
    expect(toneColor("red", colors)).toBe(colors.danger);
    expect(toneColor("green", colors)).toBe("#22C55E");
    expect(toneColor("orange", colors)).toBe("#F59E0B");
  });

  it("senkronize edilmemis adimlari bugune ekler, gecmis gune dokunmaz", () => {
    const today = makeEnergyDay();
    const live = withLiveSteps(today, 6000, 0.04);
    expect(live.pendingSteps).toBe(1000);
    expect(live.expenditureCalories).toBe(1340);
    expect(live.balance).toBe(-140);
    expect(live.expenditure.dailyMovement).toBe(110);
    expect(live.activity.steps).toBe(6000);

    // Yerel sayac geride kaldiysa (orn. baska cihaz) sunucu degeri korunur.
    expect(withLiveSteps(today, 3000, 0.04).expenditureCalories).toBe(1300);
    const past = makeEnergyDay({ isToday: false });
    expect(withLiveSteps(past, 9000, 0.04).expenditureCalories).toBe(1300);
    // Harcama hesaplanamiyorsa (profil eksik) uydurma deger uretmez.
    expect(withLiveSteps(makeEnergyDay({ expenditureCalories: null, balance: null }), 9000, 0.04).balance).toBeNull();
  });

  it("donem araliklarini yerel gune gore hesaplar", () => {
    expect(periodRange("today", "2026-11-20")).toEqual({ from: "2026-11-20", to: "2026-11-20" });
    expect(periodRange("yesterday", "2026-03-01")).toEqual({ from: "2026-02-28", to: "2026-02-28" });
    expect(periodRange("week", "2026-11-20")).toEqual({ from: "2026-11-14", to: "2026-11-20" });
    expect(periodRange("month", "2026-11-20")).toEqual({ from: "2026-10-22", to: "2026-11-20" });
  });

  it("ozel araligi bugun, sira ve 92 gun sinirina gore duzeltir", () => {
    expect(clampCustomRange("2026-11-10", "2026-11-25", "2026-11-20")).toEqual({ from: "2026-11-10", to: "2026-11-20" });
    expect(clampCustomRange("2026-11-19", "2026-11-12", "2026-11-20")).toEqual({ from: "2026-11-12", to: "2026-11-12" });
    expect(clampCustomRange("2026-01-01", "2026-11-20", "2026-11-20").from).toBe("2026-08-21");
  });

  it("harcama kalemleri toplam harcamaya esittir", () => {
    const day = makeEnergyDay();
    expect(breakdownItems(day).reduce((s, i) => s + i.value, 0)).toBe(day.expenditureCalories);
  });
});
