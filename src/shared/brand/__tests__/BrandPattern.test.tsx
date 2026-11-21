import { render, screen } from "@testing-library/react-native";

import { BrandPattern } from "../BrandPattern";
import { PATTERN_GLYPHS } from "../patternGlyphs";

describe("BrandPattern", () => {
  it("her bolum icin 8 elle cizilmis ikon tanimlar ve bolumler farklidir", () => {
    expect(PATTERN_GLYPHS.fit).toHaveLength(8);
    expect(PATTERN_GLYPHS.shop).toHaveLength(8);
    PATTERN_GLYPHS.shop.forEach((glyph) => expect(PATTERN_GLYPHS.fit).not.toContain(glyph));
  });

  it("bolume gore desen cizer", async () => {
    await render(<BrandPattern variant="shop" />);
    expect(screen.getByTestId("brand-pattern-shop")).toBeTruthy();
  });
});
