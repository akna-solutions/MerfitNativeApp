import { aspectOf, BRAND_BLUE, MONOGRAM, WORDMARK } from "../brandMark";

describe("brandMark", () => {
  it("yazi logosu ve monogram gecerli vektor geometrisi icerir", () => {
    for (const shape of [WORDMARK, MONOGRAM]) {
      expect(shape.paths.length).toBeGreaterThan(0);
      shape.paths.forEach((d) => expect(d).toMatch(/^M[\d.]+ [\d.]+/));
      expect(shape.bar.width).toBeGreaterThan(0);
      expect(aspectOf(shape)).toBeGreaterThan(0);
    }
    // Yazi logosu yatay, monogram kareye yakin.
    expect(aspectOf(WORDMARK)).toBeLessThan(0.4);
    expect(aspectOf(MONOGRAM)).toBeGreaterThan(0.5);
  });

  it("vurgu rengi mavidir (mor degil)", () => {
    const r = parseInt(BRAND_BLUE.slice(1, 3), 16);
    const b = parseInt(BRAND_BLUE.slice(5, 7), 16);
    expect(b).toBeGreaterThan(r * 3);
  });
});
