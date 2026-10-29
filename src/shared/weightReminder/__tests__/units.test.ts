import { fromKg, parseWeightToKg } from "../units";

describe("weight units", () => {
  it("metrik girisi virgul veya noktayla okur", () => {
    expect(parseWeightToKg("78,5", "metric")).toBe(78.5);
    expect(parseWeightToKg("78.54", "metric")).toBe(78.5);
  });

  it("imperial girisi kg'a cevirir", () => {
    expect(parseWeightToKg("176", "imperial")).toBe(79.8);
    expect(fromKg(79.8, "imperial")).toBe(175.9);
  });

  it("gecersiz ve aralik disi degerleri reddeder", () => {
    expect(parseWeightToKg("", "metric")).toBeNull();
    expect(parseWeightToKg("abc", "metric")).toBeNull();
    expect(parseWeightToKg("10", "metric")).toBeNull();
    expect(parseWeightToKg("401", "metric")).toBeNull();
    expect(parseWeightToKg("40", "imperial")).toBeNull(); // 18 kg
  });
});
