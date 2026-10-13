import type { MyWorkoutPlanResponse } from "../../../services/api/types";
import { planRestDays } from "../planDays";

const plan = (days: string[]): MyWorkoutPlanResponse =>
  ({
    id: 1,
    name: "Plan",
    goal: null,
    startDate: "2026-10-01",
    endDate: null,
    days: days.map((dayOfWeek) => ({ dayOfWeek, workout: {}, exercises: [] })),
  }) as unknown as MyWorkoutPlanResponse;

describe("planRestDays", () => {
  it("programda olmayan gunleri Pazartesiden baslayarak dinlenme gunu sayar", () => {
    expect(planRestDays(plan(["Monday", "Wednesday", "Friday"]))).toEqual([false, true, false, true, false, true, true]);
  });

  it("program yoksa veya bossa dinlenme gunu bilinmez", () => {
    expect(planRestDays(null)).toBeNull();
    expect(planRestDays(plan([]))).toBeNull();
  });
});
