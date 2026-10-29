import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { WaterTracker } from "../components/WaterTracker";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("WaterTracker", () => {
  it("250 ve 500 ml butonlariyla secilen miktari bildirir", async () => {
    const onAdd = jest.fn();
    await render(<WaterTracker consumedL={1} targetL={2.5} onAdd={onAdd} />);

    await fireEvent.press(screen.getByTestId("water-add-250"));
    await fireEvent.press(screen.getByTestId("water-add-500"));
    expect(onAdd).toHaveBeenNthCalledWith(1, 250);
    expect(onAdd).toHaveBeenNthCalledWith(2, 500);
  });

  it("istek surerken butonlar pasiftir", async () => {
    const onAdd = jest.fn();
    await render(<WaterTracker consumedL={0} targetL={2} onAdd={onAdd} busy />);

    await fireEvent.press(screen.getByTestId("water-add-250"));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
