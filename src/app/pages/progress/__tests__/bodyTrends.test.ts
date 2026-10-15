import { describeBodyTrend } from "../bodyTrends";

const point = (isoDate: string, value: number, isEstimated = false) => ({ date: isoDate, isoDate, value, isEstimated });

describe("describeBodyTrend", () => {
  it("needs at least two measurements", () => {
    expect(describeBodyTrend("w", "Bel değişimi", [point("2026-10-01", 84)], "cm")).toBeNull();
  });

  it("shows the change from the first to the last measurement", () => {
    expect(describeBodyTrend("w", "Bel değişimi", [point("2026-10-10", 82), point("2026-09-01", 86)], "cm")).toEqual({
      id: "w",
      label: "Bel değişimi",
      value: "86 cm → 82 cm (−4)",
    });
  });

  it("labels estimated body fat", () => {
    const row = describeBodyTrend("bf", "Yağ oranı değişimi", [point("2026-09-01", 18.2, true), point("2026-10-01", 16.9, true)], "%");
    expect(row).toEqual({ id: "bf", label: "Yağ oranı değişimi (tahmini)", value: "%18.2 → %16.9 (−1.3)" });
  });
});
