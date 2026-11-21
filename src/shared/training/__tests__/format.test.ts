import { focusLabel, formatPercent, formatPrescription, formatSets, programSubtitle } from "../format";
import { activeWorkoutParams } from "../../workout/planDays";
import { initialWeight, nextSetNumber } from "../../workout/progression";

describe("training format helpers", () => {
  it("formats a prescription with RIR and rest", () => {
    expect(formatPrescription({ sets: 3, repsMin: 8, repsMax: 12, durationSeconds: null, targetRir: 2, restSeconds: 90 })).toBe(
      "3 × 8-12 · RIR 2 · 90 sn dinlenme",
    );
    expect(formatPrescription({ sets: 3, repsMin: null, repsMax: null, durationSeconds: 45, targetRir: null, restSeconds: 120 })).toBe(
      "3 × 45 sn · 2 dk dinlenme",
    );
    expect(formatPrescription({ sets: 2, repsMin: 10, repsMax: 10, durationSeconds: null, targetRir: 4, restSeconds: null })).toBe(
      "2 × 10 · RIR 4+",
    );
  });

  it("formats half sets and percentages", () => {
    expect(formatSets(7.5)).toBe("7,5");
    expect(formatSets(12)).toBe("12");
    expect(formatPercent(3.24)).toBe("+3,2%");
    expect(formatPercent(-5)).toBe("-5%");
    expect(formatPercent(null)).toBeNull();
  });

  it("builds the program subtitle", () => {
    expect(programSubtitle({ splitLabel: "Üst / Alt (4 gün)", focus: "Hypertrophy", currentWeek: 6, blockWeeks: 4, isDeload: false })).toBe(
      "Üst / Alt (4 gün) · Kas gelişimi · Hafta 4/4",
    );
    expect(focusLabel("Nope")).toBeNull();
  });
});

describe("engine plan days", () => {
  it("starts engine days with only the plan day id", () => {
    expect(activeWorkoutParams({ id: null, title: "Üst Vücut A" }, 42)).toEqual({
      id: "day-42",
      title: "Üst Vücut A",
      workoutPlanDayId: "42",
    });
    expect(activeWorkoutParams({ id: null, title: "X" }, undefined)).toBeNull();
    expect(activeWorkoutParams({ id: 7, title: "Push" }, undefined)).toEqual({ id: "7", title: "Push", workoutPlanDayId: undefined });
  });

  it("does not prefill an unconfirmed weight increase", () => {
    expect(initialWeight({ suggestedWeightKg: 62.5, previousWeightKg: 60, isConfident: false }, [])).toBe("60");
    expect(initialWeight({ suggestedWeightKg: 62.5, previousWeightKg: 60, isConfident: true }, [])).toBe("62.5");
  });

  it("numbers warmup sets without counting them as work sets", () => {
    expect(nextSetNumber(0, 0)).toBe(1);
    expect(nextSetNumber(0, 2)).toBe(3);
    expect(nextSetNumber(2, 1)).toBe(4);
  });
});
