import { render, screen } from "@testing-library/react-native";

import { DumbbellSpinner } from "../DumbbellSpinner";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text testID="spinner-icon">{name}</Text>;
  },
}));

describe("DumbbellSpinner", () => {
  it("yukleniyor gostergesi olarak dumbell gosterir ve boyutu ayarlar", async () => {
    await render(<DumbbellSpinner size="large" color="#7C3AED" testID="spinner" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveProp("accessibilityRole", "progressbar");
    expect(spinner).toHaveStyle({ width: 40, height: 40 });
    expect(screen.getByTestId("spinner-icon")).toHaveTextContent("barbell");
  });
});
