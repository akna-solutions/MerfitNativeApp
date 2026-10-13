import { nextTierFor, sortTiers } from "../rewards";

const tiers = [
  { minScore: 30, points: 3 },
  { minScore: 10, points: 1 },
  { minScore: 50, points: 5 },
  { minScore: 20, points: 2 },
];

describe("odul tablosu gosterimi", () => {
  it("bir sonraki esigi bulur", () => {
    expect(nextTierFor(tiers, 0)).toEqual({ minScore: 10, points: 1 });
    expect(nextTierFor(tiers, 10)).toEqual({ minScore: 20, points: 2 });
    expect(nextTierFor(tiers, 49)).toEqual({ minScore: 50, points: 5 });
    expect(nextTierFor(tiers, 50)).toBeNull();
  });

  it("esikleri kucukten buyuge siralar", () => {
    expect(sortTiers(tiers).map((tier) => tier.minScore)).toEqual([10, 20, 30, 50]);
  });
});
