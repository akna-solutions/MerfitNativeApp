import { activePillWidth, dragIndex, isOnPill, navStep, pillSpan, settleIndex } from "../navbarDrag";

describe("navbarDrag", () => {
  const SIZE = 52;
  const GAP = 6;
  const STEP = navStep(SIZE, GAP);

  it("genis hapi kalan alana gore boyutlandirir ve sinirlar", () => {
    // 343 - (3 x 52 + 4 x 6 + 52) = 111
    expect(activePillWidth(343, SIZE, GAP, 150)).toBe(111);
    expect(activePillWidth(1000, SIZE, GAP, 150)).toBe(150);
    expect(activePillWidth(100, SIZE, GAP, 150)).toBe(SIZE);
  });

  it("secili sekmenin hap araligini hesaplar", () => {
    expect(pillSpan(0, STEP, 111)).toEqual({ start: 0, end: 111 });
    expect(pillSpan(2, STEP, 111)).toEqual({ start: 116, end: 227 });
  });

  it("yalnizca hapin uzerindeki dokunmalari kabul eder", () => {
    expect(isOnPill(40, 0, STEP, 111)).toBe(true);
    expect(isOnPill(150, 0, STEP, 111)).toBe(false);
    expect(isOnPill(150, 2, STEP, 111)).toBe(true);
    expect(isOnPill(10, -1, STEP, 111)).toBe(false);
  });

  it("surukleme mesafesini en yakin sekmeye yuvarlar ve sinirlar", () => {
    expect(dragIndex(0, 28, STEP)).toBe(0);
    expect(dragIndex(0, 30, STEP)).toBe(1);
    expect(dragIndex(0, 116, STEP)).toBe(2);
    expect(dragIndex(1, 9999, STEP)).toBe(3);
    expect(dragIndex(2, -9999, STEP)).toBe(0);
    expect(dragIndex(2, 100, 0)).toBe(2);
  });

  it("hizli firlatmada hiz yonundeki sekmeye yerlesir", () => {
    expect(settleIndex(0, 20, 0, STEP)).toBe(0);
    expect(settleIndex(0, 20, 400, STEP)).toBe(1);
    expect(settleIndex(2, -10, -900, STEP)).toBe(1);
  });
});
