import {
  addSteps,
  emptyStepState,
  estimateFromSteps,
  goalProgress,
  hourlySignature,
  markSynced,
  mergeDay,
  parseStoredState,
  pendingSyncDays,
  pruneDays,
  totalSteps,
} from "../stepState";
import { formatKcal, formatKm, formatPercent, formatSteps } from "../format";
import { buildWeekStats } from "../weekStats";
import { DEFAULT_STEP_SETTINGS } from "../stepState";

const hours = (values: Record<number, number>) => Array.from({ length: 24 }, (_, h) => values[h] ?? 0);

describe("stepState", () => {
  it("canli artislari olayin yerel gun ve saat kovasina ekler", () => {
    let state = emptyStepState("ali");
    state = addSteps(state, new Date(2026, 10, 20, 9, 15), 120);
    state = addSteps(state, new Date(2026, 10, 20, 9, 50), 30);
    state = addSteps(state, new Date(2026, 10, 20, 14, 5), 400);

    expect(state.days["2026-11-20"].hourly[9]).toBe(150);
    expect(state.days["2026-11-20"].hourly[14]).toBe(400);
    expect(totalSteps(state.days["2026-11-20"].hourly)).toBe(550);
  });

  it("gece yarisindan sonra yeni gun bos baslar, onceki gun korunur", () => {
    let state = addSteps(emptyStepState(null), new Date(2026, 10, 20, 23, 58), 500);
    state = addSteps(state, new Date(2026, 10, 21, 0, 2), 40);

    expect(totalSteps(state.days["2026-11-20"].hourly)).toBe(500);
    expect(totalSteps(state.days["2026-11-21"].hourly)).toBe(40);
  });

  it("ayni gunun tekrar birlestirilmesi adimlari iki kez saymaz ve azaltmaz", () => {
    let state = mergeDay(emptyStepState(null), "2026-11-20", hours({ 9: 3000, 10: 2000 }), 180);
    const once = state;
    state = mergeDay(state, "2026-11-20", hours({ 9: 3000, 10: 2000 }), 180);
    expect(state).toBe(once);

    state = mergeDay(state, "2026-11-20", hours({ 9: 1000, 11: 500 }), 180);
    expect(state.days["2026-11-20"].hourly.slice(9, 12)).toEqual([3000, 2000, 500]);
    expect(totalSteps(state.days["2026-11-20"].hourly)).toBe(5500);
  });

  it("yalnizca sunucunun kabul ettiginden farkli gunleri gonderir; gonderilen imzayi isaretler", () => {
    const today = new Date(2026, 10, 20, 12);
    let state = mergeDay(emptyStepState(null), "2026-11-20", hours({ 9: 100 }), 180);
    state = mergeDay(state, "2026-11-19", hours({ 9: 200 }), 180);
    const sent = pendingSyncDays(state, today);
    expect(sent.map((d) => d.date)).toEqual(["2026-11-19", "2026-11-20"]);

    // Istek surerken yeni adim geldi: gonderilen veri isaretlenir, yeni adim bir sonraki senkronizasyonda gider.
    state = addSteps(state, new Date(2026, 10, 20, 12, 1), 50);
    state = markSynced(
      state,
      sent,
      sent.map((d) => ({ ...d, status: "accepted" as const, totalSteps: 0, distanceMeters: 0, caloriesBurned: 0, dailyGoal: 10000, goalCompleted: false, completionPercent: 0, hasData: true, isVerified: true })),
      Date.now(),
    );
    const next = pendingSyncDays(state, today);
    expect(next.map((d) => d.date)).toEqual(["2026-11-20"]);
    expect(next[0].hourlySteps[12]).toBe(50);
    expect(state.synced["2026-11-19"]).toBe(hourlySignature(hours({ 9: 200 })));
  });

  it("8 gunden eski veriyi atar", () => {
    let state = mergeDay(emptyStepState(null), "2026-11-10", hours({ 9: 100 }), 180);
    state = mergeDay(state, "2026-11-13", hours({ 9: 100 }), 180);
    state = pruneDays(state, new Date(2026, 10, 20, 12));
    expect(Object.keys(state.days)).toEqual(["2026-11-13"]);
  });

  it("bozuk ya da eski surum kaydi yuklemez", () => {
    expect(parseStoredState("{bozuk")).toBeNull();
    expect(parseStoredState(JSON.stringify({ version: 99, days: {} }))).toBeNull();
    const ok = parseStoredState(JSON.stringify({ version: 1, owner: "ali", days: { "2026-11-20": { hourly: [1, -5, "x"], offsetMinutes: 180 } }, synced: {} }));
    expect(ok?.days["2026-11-20"].hourly.slice(0, 3)).toEqual([1, 0, 0]);
    expect(ok?.days["2026-11-20"].hourly).toHaveLength(24);
  });

  it("hedef ilerlemesi, kalan adim ve tahminler", () => {
    expect(goalProgress(8450, 10000)).toEqual({ percent: 84.5, ratio: 0.845, remaining: 1550, completed: false });
    expect(goalProgress(12000, 10000).completed).toBe(true);
    expect(goalProgress(12000, 10000).remaining).toBe(0);
    const estimate = estimateFromSteps(10000, { ...DEFAULT_STEP_SETTINGS, strideLengthMeters: 0.75, caloriesPerStep: 0.03 });
    expect(estimate.distanceKm).toBeCloseTo(7.5);
    expect(estimate.calories).toBe(300);
  });

  it("Turkce bicimler", () => {
    expect(formatSteps(8450)).toBe("8.450");
    expect(formatPercent(84.5)).toBe("%84,5");
    expect(formatKm(6.2)).toBe("6,2 km");
    expect(formatKcal(320)).toBe("320 kcal");
  });
});

describe("buildWeekStats", () => {
  const server = {
    startDate: "2026-11-14",
    endDate: "2026-11-20",
    days: [
      { date: "2026-11-19", totalSteps: 12000, distanceMeters: 9000, caloriesBurned: 340, dailyGoal: 10000, goalCompleted: true, completionPercent: 120, hasData: true, isVerified: true },
      { date: "2026-11-20", totalSteps: 3000, distanceMeters: 2250, caloriesBurned: 85, dailyGoal: 10000, goalCompleted: false, completionPercent: 30, hasData: true, isVerified: true },
    ],
    totalSteps: 15000, averageSteps: 2143, totalDistanceMeters: 11250, totalCaloriesBurned: 425,
    goalCompletedDays: 1, goalCompletionRate: 14.3, mostActiveDay: null, previousPeriodTotalSteps: 10000, changePercent: 50,
  };

  it("her gun icin yerel ve sunucu verisinden buyuk olani alir (cift sayim yok)", () => {
    const local = { "2026-11-20": { hourly: hours({ 9: 4000 }), offsetMinutes: 180 }, "2026-11-19": { hourly: hours({ 9: 100 }), offsetMinutes: 180 } };

    const week = buildWeekStats("2026-11-20", local, server, 10000, DEFAULT_STEP_SETTINGS);

    expect(week.days.map((d) => d.steps)).toEqual([0, 0, 0, 0, 0, 12000, 4000]);
    expect(week.totalSteps).toBe(16000);
    expect(week.averageSteps).toBe(2286);
    expect(week.mostActiveDay?.date).toBe("2026-11-19");
    expect(week.goalCompletedDays).toBe(1);
    expect(week.goalCompletionRate).toBe(14.3);
    expect(week.changePercent).toBe(60);
  });

  it("sunucuya ulasilamazsa yerel veriyle calisir, karsilastirma gostermez", () => {
    const local = { "2026-11-20": { hourly: hours({ 9: 4000 }), offsetMinutes: 180 } };
    const week = buildWeekStats("2026-11-20", local, null, 5000, DEFAULT_STEP_SETTINGS);
    expect(week.totalSteps).toBe(4000);
    expect(week.days[6].goalCompleted).toBe(false);
    expect(week.changePercent).toBeNull();
  });

  it("bugunun hedefi guncel hedeftir; hedef dusurulunce bugun tamamlanmis sayilir", () => {
    const week = buildWeekStats("2026-11-20", {}, server, 2500, DEFAULT_STEP_SETTINGS);
    expect(week.days[6]).toMatchObject({ steps: 3000, goal: 2500, goalCompleted: true });
    expect(week.days[5].goal).toBe(10000);
  });
});
