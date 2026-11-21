import { render, screen } from "@testing-library/react-native";

import { DumbbellSpinner } from "../DumbbellSpinner";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text testID="spinner-icon">{name}</Text>;
  },
}));

describe("DumbbellSpinner", () => {
  it("kucuk boyutta donen dumbell gosterir ve boyutu ayarlar", async () => {
    await render(<DumbbellSpinner size={30} color="#3E7BFA" testID="spinner" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveProp("accessibilityRole", "progressbar");
    expect(spinner).toHaveStyle({ width: 34, height: 34 });
    expect(screen.getByTestId("spinner-icon")).toHaveTextContent("barbell");
  });

  it("buyuk boyutta markali yukleniyor gostergesini gosterir", async () => {
    await render(<DumbbellSpinner size="large" color="#3E7BFA" testID="spinner" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveProp("accessibilityRole", "progressbar");
    expect(spinner).toHaveProp("accessibilityLabel", "Yükleniyor");
    expect(screen.queryByTestId("spinner-icon")).toBeNull();
  });
});
