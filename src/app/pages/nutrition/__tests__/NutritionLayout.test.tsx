import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { MacroOverview } from "../components/MacroOverview";
import { MealsSection } from "../components/MealsSection";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const macros = {
  protein: { consumed: 40, target: 120 },
  carbs: { consumed: 100, target: 250 },
  fats: { consumed: 20, target: 70 },
};

describe("MacroOverview", () => {
  it("kalan kaloriyi ve makrolari tek yatay kaydirmada kartlar olarak gosterir", async () => {
    await render(<MacroOverview macros={macros} consumedCalories={600} dailyCalories={2000} />);

    expect(screen.getByTestId("macro-carousel").props.horizontal).toBe(true);
    expect(screen.getByText("1,400")).toBeTruthy();
    expect(screen.getByText("kalan kcal")).toBeTruthy();
    for (const label of ["Protein", "Karbonhidrat", "Yağ"]) expect(screen.getByText(label)).toBeTruthy();
  });
});

describe("MealsSection", () => {
  const meals = [
    { id: "1", type: "Kahvaltı" as const, name: "Yulaf", calories: 300 },
    { id: "2", type: "Kahvaltı" as const, name: "Yumurta", calories: 150 },
  ];

  it("ogun kartlari kapali baslar, ozet gosterir ve dokununca acilir", async () => {
    const onSelectMeal = jest.fn();
    await render(<MealsSection meals={meals} onAddMeal={jest.fn()} onSelectMeal={onSelectMeal} />);

    expect(screen.getByText("2 kayıt · 450 kcal")).toBeTruthy();
    expect(screen.queryByText("Yulaf")).toBeNull();

    await fireEvent.press(screen.getByTestId("meal-group-toggle-Kahvaltı"));
    await fireEvent.press(screen.getByText("Yulaf"));
    expect(onSelectMeal).toHaveBeenCalledWith(meals[0]);

    await fireEvent.press(screen.getByTestId("meal-group-toggle-Kahvaltı"));
    expect(screen.queryByText("Yulaf")).toBeNull();
  });

  it("bos ogunde ekle butonu acilinca gorunur ve ogun turunu bildirir", async () => {
    const onAddMeal = jest.fn();
    await render(<MealsSection meals={[]} onAddMeal={onAddMeal} onSelectMeal={jest.fn()} />);

    await fireEvent.press(screen.getByTestId("meal-group-toggle-Akşam Yemeği"));
    await fireEvent.press(screen.getByText("Öğün ekle"));
    expect(onAddMeal).toHaveBeenCalledWith("Akşam Yemeği");
  });
});
