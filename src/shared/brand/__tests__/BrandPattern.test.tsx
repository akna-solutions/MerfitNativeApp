import { render, screen } from "@testing-library/react-native";

import { BrandPattern } from "../BrandPattern";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text testID="pattern-icon">{name}</Text>;
  },
}));

describe("BrandPattern", () => {
  it("bolume gore ikon secer ve ekrani doldurur", async () => {
    await render(<BrandPattern variant="shop" />);
    const icons = screen.getAllByTestId("pattern-icon").map((n) => String(n.props.children));
    expect(icons.length).toBeGreaterThan(20);
    expect(icons.some((n) => n.includes("bag") || n.includes("cart"))).toBe(true);
  });

  it("her acilista ayni deseni uretir", async () => {
    const first = await render(<BrandPattern />);
    const a = screen.getAllByTestId("pattern-icon").map((n) => String(n.props.children));
    await first.unmount();
    await render(<BrandPattern />);
    const b = screen.getAllByTestId("pattern-icon").map((n) => String(n.props.children));
    expect(b).toEqual(a);
  });
});
