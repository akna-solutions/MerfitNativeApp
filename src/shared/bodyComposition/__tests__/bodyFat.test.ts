import { ApiError } from "../../../services/api/client";
import { normalizeFitnessGoal } from "../../../services/api/types";
import {
  assessBodyFat,
  estimateUsNavy,
  isLowBodyFatConfirmationError,
  LOW_BODY_FAT_CONFIRMATION_CODE,
  parseDecimal,
  requiresLowBodyFatWarning,
  validateMeasurement,
} from "../bodyFat";

// Beklenen degerler sunucudaki BodyFatAssessmentTests ile ayni; iki taraf ayni sonucu vermeli.
describe("estimateUsNavy", () => {
  it.each([
    [178, 38, 86, 17.2],
    [180, 40, 74, 4.6],
  ])("male %p cm, neck %p, waist %p -> %p", (height, neck, waist, expected) => {
    expect(estimateUsNavy("male", height, neck, waist, null)).toBe(expected);
  });

  it.each([
    [165, 33, 72, 98, 26.9],
    [168, 34, 64, 88, 16.0],
  ])("female %p cm -> %p", (height, neck, waist, hip, expected) => {
    expect(estimateUsNavy("female", height, neck, waist, hip)).toBe(expected);
  });

  it("returns null when a required input is missing or invalid", () => {
    expect(estimateUsNavy("male", null, 38, 86, null)).toBeNull();
    expect(estimateUsNavy("male", 178, null, 86, null)).toBeNull();
    expect(estimateUsNavy("female", 165, 33, 72, null)).toBeNull();
    expect(estimateUsNavy(null, 178, 38, 86, 95)).toBeNull();
    expect(estimateUsNavy("male", 178, 40, 40, null)).toBeNull();
  });
});

describe("assessBodyFat", () => {
  it.each([
    ["male", 25, 7.9, "low"],
    ["male", 25, 8, "healthy"],
    ["male", 25, 20.5, "high"],
    ["male", 45, 10, "low"],
    ["male", 65, 12, "low"],
    ["female", 30, 20, "low"],
    ["female", 30, 25, "healthy"],
    ["female", 50, 22, "low"],
  ] as const)("%s age %p with %p%% is %s", (gender, age, bodyFat, expected) => {
    expect(assessBodyFat({ gender, age, heightCm: 175, bodyFatPercentage: bodyFat }).category).toBe(expected);
  });

  it("prefers the entered value over the estimate", () => {
    const result = assessBodyFat({ gender: "male", age: 30, heightCm: 180, bodyFatPercentage: 15, neckCm: 40, waistCm: 74 });
    expect(result).toMatchObject({ percentage: 15, source: "measured", category: "healthy" });
  });

  it("uses the Navy estimate and its margin when no value is entered", () => {
    const result = assessBodyFat({ gender: "male", age: 30, heightCm: 180, neckCm: 40, waistCm: 74 });
    expect(result).toMatchObject({ percentage: 4.6, source: "estimated", marginOfError: 3.5, category: "low" });
  });

  it("produces no result without enough data", () => {
    expect(assessBodyFat({ gender: "male", age: 30, heightCm: 180 }).category).toBe("unknown");
    expect(assessBodyFat({ gender: null, age: 30, heightCm: 180, bodyFatPercentage: 5 }).category).toBe("unknown");
    expect(assessBodyFat({ gender: "male", age: null, heightCm: 180, bodyFatPercentage: 5 }).category).toBe("unknown");
    expect(assessBodyFat({ gender: "male", age: 16, heightCm: 180, bodyFatPercentage: 5 }).category).toBe("unknown");
  });
});

describe("low body fat warning", () => {
  const low = assessBodyFat({ gender: "male", age: 30, heightCm: 180, bodyFatPercentage: 6 });

  it("is required only for fat loss with a low reading", () => {
    expect(requiresLowBodyFatWarning("lose_weight", low)).toBe(true);
    expect(requiresLowBodyFatWarning("build_muscle", low)).toBe(false);
    expect(requiresLowBodyFatWarning("get_stronger", low)).toBe(false);
    expect(requiresLowBodyFatWarning("lose_weight", assessBodyFat({ gender: "male", age: 30, heightCm: 180 }))).toBe(false);
  });

  it("recognizes the server's confirmation response", () => {
    expect(isLowBodyFatConfirmationError(new ApiError(409, "uyari", [LOW_BODY_FAT_CONFIRMATION_CODE]))).toBe(true);
    expect(isLowBodyFatConfirmationError(new ApiError(409, "baska", ["OTHER"]))).toBe(false);
    expect(isLowBodyFatConfirmationError(new ApiError(400, "uyari", [LOW_BODY_FAT_CONFIRMATION_CODE]))).toBe(false);
  });
});

describe("helpers", () => {
  it("validates ranges and parses comma decimals", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal("")).toBeNull();
    expect(validateMeasurement("neck", null)).toBeNull();
    expect(validateMeasurement("neck", 15)).toMatch(/Boyun/);
    expect(validateMeasurement("bodyFat", 1)).toMatch(/%2-75/);
    expect(validateMeasurement("waist", 85)).toBeNull();
  });

  it("maps legacy goals to build muscle", () => {
    expect(normalizeFitnessGoal("maintain_weight")).toBe("build_muscle");
    expect(normalizeFitnessGoal("improve_endurance")).toBe("build_muscle");
    expect(normalizeFitnessGoal("lose_weight")).toBe("lose_weight");
    expect(normalizeFitnessGoal(null)).toBeNull();
  });
});
