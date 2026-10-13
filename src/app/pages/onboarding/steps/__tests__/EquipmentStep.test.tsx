import { render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../../test/mockTheme";
import { EquipmentStep } from "../EquipmentStep";

jest.mock("../../../../../shared/theme/ThemeContext", () => ({
  useTheme: () => mockThemeValue,
}));

const options = [
  { id: 1, name: "Dambıl", slug: "dumbbell" },
  { id: 2, name: "Barfiks barı", slug: "pull-up-bar" },
];

function renderStep(location: "gym" | "home" | "outdoor") {
  return render(
    <EquipmentStep
      location={location}
      onLocationChange={jest.fn()}
      options={options}
      status="ready"
      onRetry={jest.fn()}
      equipment={[]}
      onEquipmentChange={jest.fn()}
    />,
  );
}

describe("EquipmentStep", () => {
  it("spor salonunda ekipman sormaz, tum ekipmanlarin var sayildigini soyler", () => {
    renderStep("gym");
    expect(screen.getByText("Spor salonunda tüm ekipmanlara erişimin olduğunu varsayıyoruz.")).toBeTruthy();
    expect(screen.queryByText("Hangi ekipmanlara sahipsin?")).toBeNull();
    expect(screen.queryByText("Dambıl")).toBeNull();
  });

  it("evde ekipman secimini gosterir", () => {
    renderStep("home");
    expect(screen.getByText("Hangi ekipmanlara sahipsin?")).toBeTruthy();
    expect(screen.getByText("Dambıl")).toBeTruthy();
  });
});
