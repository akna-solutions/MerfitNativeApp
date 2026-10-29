import { makeDay } from "../../../test/calendarFixtures";
import { dayRingValues, hasAnyRecord } from "../dayRings";

describe("dayRingValues", () => {
  it("veri olmayan gunde hic halka cizmez", () => {
    expect(dayRingValues(makeDay())).toEqual({ workout: null, activity: null, nutrition: null });
    expect(dayRingValues(undefined)).toEqual({ workout: null, activity: null, nutrition: null });
    expect(hasAnyRecord(makeDay())).toBe(false);
  });

  it("gelecekteki gunde (hatali veri olsa bile) halka cizmez", () => {
    const day = makeDay({ isFuture: true, workout: { completed: true, totalDurationSeconds: 1800, sessions: [] } });
    expect(dayRingValues(day)).toEqual({ workout: null, activity: null, nutrition: null });
    expect(hasAnyRecord(day)).toBe(false);
  });

  it("beslenme halkasini hedef oranina gore doldurur, hedef tamamsa tam halka", () => {
    const partial = makeDay({ nutrition: { ...makeDay().nutrition, logged: true, calorieRatio: 0.5 } });
    expect(dayRingValues(partial).nutrition).toBe(0.5);
    const met = makeDay({ nutrition: { ...makeDay().nutrition, logged: true, calorieRatio: 0.95, calorieGoalMet: true } });
    expect(dayRingValues(met).nutrition).toBe(1);
    const over = makeDay({ nutrition: { ...makeDay().nutrition, logged: true, calorieRatio: 1.4 } });
    expect(dayRingValues(over).nutrition).toBe(1);
  });

  it("hedef yoksa ogun kaydi olsa bile beslenme halkasi cizilmez", () => {
    const day = makeDay({ nutrition: { ...makeDay().nutrition, logged: true, consumedCalories: 1800, calorieRatio: null } });
    expect(dayRingValues(day).nutrition).toBeNull();
    expect(hasAnyRecord(day)).toBe(true);
  });

  it("antrenman ve aktivite halkalari", () => {
    const day = makeDay({
      workout: { completed: true, totalDurationSeconds: 900, sessions: [] },
      activity: { caloriesBurned: 120, activeMinutes: 15 },
    });
    expect(dayRingValues(day)).toEqual({ workout: 1, activity: 0.5, nutrition: null });
  });
});
