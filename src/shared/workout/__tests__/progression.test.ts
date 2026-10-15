import { formatRepRange, initialWeight } from "../progression";

describe("progression helpers", () => {
  it("formats rep ranges", () => {
    expect(formatRepRange(8, 12)).toBe("8-12");
    expect(formatRepRange(10, null)).toBe("10");
    expect(formatRepRange(10, 10)).toBe("10");
  });

  it("starts from the suggested weight, then the last weight", () => {
    expect(initialWeight({ suggestedWeightKg: 62.5 }, [{ weight: 60 }])).toBe("62.5");
    expect(initialWeight(null, [{ weight: null }, { weight: 60 }])).toBe("60");
    expect(initialWeight({ suggestedWeightKg: null }, [])).toBe("");
  });
});
