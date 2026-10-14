import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { shouldDismissSheet } from "../../../../shared/sheet/useDragToClose";
import { EditMealItemModal } from "../components/EditMealItemModal";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return { SafeAreaView: View };
});

const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
jest.mock("../../../../services/api/nutrition", () => ({
  getMealItem: (...args: unknown[]) => mockGet(...args),
  updateMealItem: (...args: unknown[]) => mockUpdate(...args),
  deleteMealItem: (...args: unknown[]) => mockDelete(...args),
}));

const rice = {
  id: 100,
  type: "Öğle Yemeği",
  name: "Pirinç",
  calories: 195,
  quantity: 1.5,
  amount: 150,
  food: { id: 1, name: "Pirinç", brand: null, servingSize: 100, servingUnit: "g", calories: 130, protein: 3, carbs: 28, fat: 0.3, imageUrl: null },
};

describe("EditMealItemModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(rice);
  });

  it("mevcut gramaji gosterir ve yeni miktari kaydeder", async () => {
    mockUpdate.mockResolvedValue({ id: 100, type: "Öğle Yemeği", name: "Pirinç", calories: 260 });
    const onUpdated = jest.fn();
    render(<EditMealItemModal mealId="100" onUpdated={onUpdated} onDeleted={jest.fn()} onClose={jest.fn()} />);

    const input = await screen.findByDisplayValue("150");
    expect(screen.getByText("Kaydet · 195 kcal")).toBeTruthy();

    fireEvent.changeText(input, "200");
    fireEvent.press(screen.getByText("Kaydet · 260 kcal"));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith({ id: "100", type: "Öğle Yemeği", name: "Pirinç", calories: 260 }));
    expect(mockUpdate).toHaveBeenCalledWith(100, { amount: 200 });
  });

  it("onaydan sonra kaydi siler", async () => {
    mockDelete.mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });
    const onDeleted = jest.fn();
    render(<EditMealItemModal mealId="100" onUpdated={jest.fn()} onDeleted={onDeleted} onClose={jest.fn()} />);

    fireEvent.press(await screen.findByTestId("edit-meal-delete"));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("100"));
    expect(mockDelete).toHaveBeenCalledWith(100);
    alertSpy.mockRestore();
  });

  it("geri baglantisi gostermez", async () => {
    render(<EditMealItemModal mealId="100" onUpdated={jest.fn()} onDeleted={jest.fn()} onClose={jest.fn()} />);
    await screen.findByDisplayValue("150");
    expect(screen.queryByText("Geri")).toBeNull();
  });

  it("yeterince ya da hizli asagi cekilince kapanmaya karar verir", () => {
    expect(shouldDismissSheet(120, 0)).toBe(true);
    expect(shouldDismissSheet(30, 1.2)).toBe(true);
    expect(shouldDismissSheet(30, 0.2)).toBe(false);
    expect(shouldDismissSheet(-200, 0)).toBe(false);
  });
});
