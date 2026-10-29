import { clampIndicatorX, indicatorXForIndex, nearestIndex, settleIndex } from "../navbarDrag";

describe("navbarDrag", () => {
  const W = 80;

  it("indeksten konuma ve geri donusumu tutarli cevirir", () => {
    for (let i = 0; i < 4; i++) expect(nearestIndex(indicatorXForIndex(i, W, 6), W, 4, 6)).toBe(i);
  });

  it("en yakin sekmeye yuvarlar (yarim genislik siniri dahil)", () => {
    expect(nearestIndex(0, W)).toBe(0);
    expect(nearestIndex(39, W)).toBe(0);
    expect(nearestIndex(41, W)).toBe(1);
    expect(nearestIndex(130, W)).toBe(2);
    expect(nearestIndex(239, W)).toBe(3);
  });

  it("sinirlarin disindaki konumlari kapsul icine sikistirir", () => {
    expect(clampIndicatorX(-50, W)).toBe(0);
    expect(clampIndicatorX(9999, W)).toBe(W * 3);
    expect(nearestIndex(-500, W)).toBe(0);
    expect(nearestIndex(9999, W)).toBe(3);
    expect(clampIndicatorX(-50, W, 4, 6)).toBe(6);
  });

  it("gecersiz genislikte 0 doner", () => {
    expect(nearestIndex(100, 0)).toBe(0);
  });

  it("hizli firlatmada hiz yonundeki sekmeye yerlesir", () => {
    expect(settleIndex(70, 0, W)).toBe(1);
    expect(settleIndex(60, 900, W)).toBe(2);
    expect(settleIndex(100, -900, W)).toBe(0);
  });
});
