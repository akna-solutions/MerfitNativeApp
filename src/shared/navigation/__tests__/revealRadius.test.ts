import { revealRadius } from "../revealRadius";

describe("revealRadius", () => {
  it("merkezden en uzak koseye olan mesafeyi verir", () => {
    // Sag alttaki buton: en uzak kose sol ust.
    expect(revealRadius({ x: 300, y: 600 }, 400, 700)).toBeCloseTo(Math.hypot(300, 600));
    expect(revealRadius({ x: 0, y: 0 }, 400, 700)).toBeCloseTo(Math.hypot(400, 700));
    expect(revealRadius({ x: 200, y: 350 }, 400, 700)).toBeCloseTo(Math.hypot(200, 350));
  });
});
