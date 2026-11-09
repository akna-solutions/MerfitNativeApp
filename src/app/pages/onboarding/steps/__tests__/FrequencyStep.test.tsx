import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../../test/mockTheme";
import { FrequencyStep } from "../FrequencyStep";

jest.mock("../../../../../shared/theme/ThemeContext", () => ({
  useTheme: () => mockThemeValue,
}));

describe("FrequencyStep", () => {
  it("gun sayisi sormaz; musait gunleri haftaya gore sirali gunceller", async () => {
    const onChange = jest.fn();
    await render(<FrequencyStep value={["Fri"]} onChange={onChange} />);
    expect(screen.queryByText(/Haftada 3 gün/)).toBeNull();
    await fireEvent.press(screen.getByText("Pazartesi"));
    expect(onChange).toHaveBeenCalledWith(["Mon", "Fri"]);
    await fireEvent.press(screen.getByText("Cuma"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("tek gun seciliyken en az 2 gun ister", async () => {
    await render(<FrequencyStep value={["Mon"]} onChange={jest.fn()} />);
    expect(screen.getByText("En az 2 gün seç.")).toBeTruthy();
  });
});
