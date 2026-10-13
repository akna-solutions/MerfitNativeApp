import { describeTiers, nextTierFor } from "../rewards";

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

  it("tabloyu sirali ve kisa yazar", () => {
    expect(describeTiers(tiers)).toBe("10 skor → 1 · 20 → 2 · 30 → 3 · 50 → 5");
  });
});
