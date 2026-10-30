import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { goToDashboardAfterAuth } from "../../auth/navigation";
import { mockThemeValue } from "../../../test/mockTheme";
import { COMPLETE_FITNESS_PROFILE_ROUTE, FitnessProfileGate } from "../FitnessProfileGate";

const mockRouter = { push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), canDismiss: jest.fn(() => false), dismissAll: jest.fn() };
let mockProfileState: { isLoaded: boolean; profile: { fitnessProfileCompleted?: boolean } };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../ProfileContext", () => ({ useProfile: () => mockProfileState }));

beforeEach(() => {
  jest.clearAllMocks();
});

const renderGate = () =>
  render(
    <FitnessProfileGate>
      <Text>MB Fit ana sayfa</Text>
    </FitnessProfileGate>,
  );

describe("FitnessProfileGate", () => {
  it("fitness profili tamamsa ekranı gösterir", async () => {
    mockProfileState = { isLoaded: true, profile: { fitnessProfileCompleted: true } };
    await renderGate();

    expect(screen.getByText("MB Fit ana sayfa")).toBeTruthy();
    expect(screen.queryByTestId("fitness-profile-gate")).toBeNull();
  });

  it("profil yüklenmeden kilitlemez (ekran kendi yükleniyor durumunu gösterir)", async () => {
    mockProfileState = { isLoaded: false, profile: {} };
    await renderGate();

    expect(screen.getByText("MB Fit ana sayfa")).toBeTruthy();
  });

  it("yalnızca alışveriş hesabında profili tamamlamaya çağırır", async () => {
    mockProfileState = { isLoaded: true, profile: { fitnessProfileCompleted: false } };
    await renderGate();

    expect(screen.queryByText("MB Fit ana sayfa")).toBeNull();
    expect(screen.getByText("MB Fit'e hoş geldin")).toBeTruthy();

    await fireEvent.press(screen.getByText("Profilimi tamamla"));
    expect(mockRouter.push).toHaveBeenCalledWith(COMPLETE_FITNESS_PROFILE_ROUTE);

    await fireEvent.press(screen.getByText("MB Shop'a dön"));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/pages/store");
  });
});

describe("goToDashboardAfterAuth", () => {
  it("varsayılan olarak MB Fit ana sayfasına, yalnızca alışveriş hesabında MB Shop'a gider", () => {
    goToDashboardAfterAuth(mockRouter);
    expect(mockRouter.replace).toHaveBeenLastCalledWith("/pages/dashboard");

    goToDashboardAfterAuth(mockRouter, { shoppingOnly: true });
    expect(mockRouter.replace).toHaveBeenLastCalledWith("/pages/store");
  });
});
