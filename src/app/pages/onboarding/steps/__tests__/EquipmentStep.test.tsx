import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../../test/mockTheme";
import { EquipmentStep } from "../EquipmentStep";

jest.mock("../../../../../shared/theme/ThemeContext", () => ({
  useTheme: () => mockThemeValue,
}));

function renderStep(location: "gym" | "home" | "outdoor", onHasEquipmentChange = jest.fn()) {
  return render(
    <EquipmentStep
      location={location}
      onLocationChange={jest.fn()}
      hasEquipment={null}
      onHasEquipmentChange={onHasEquipmentChange}
    />,
  );
}

describe("EquipmentStep", () => {
  it("spor salonunda ekipman sormaz, tum ekipmanlarin var sayildigini soyler", async () => {
    await renderStep("gym");
    expect(screen.getByText("Spor salonunda tüm ekipmanlara erişimin olduğunu varsayıyoruz.")).toBeTruthy();
    expect(screen.queryByText("Ekipmanın var mı?")).toBeNull();
  });

  it("evde yalnizca ekipmanli / ekipmansiz secimi sunar", async () => {
    const onChange = jest.fn();
    await renderStep("home", onChange);
    expect(screen.getByText("Ekipmanın var mı?")).toBeTruthy();
    await fireEvent.press(screen.getByText("Ekipmansız"));
    expect(onChange).toHaveBeenCalledWith(false);
    await fireEvent.press(screen.getByText("Ekipmanlı"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
