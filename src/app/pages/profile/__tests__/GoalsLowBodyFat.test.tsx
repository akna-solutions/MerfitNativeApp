import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import {
  LOW_BODY_FAT_CONTINUE_LABEL,
  LOW_BODY_FAT_RECONSIDER_LABEL,
  LOW_BODY_FAT_WARNING_MESSAGE,
} from "../../../../shared/bodyComposition/bodyFat";
import { mockThemeValue } from "../../../../test/mockTheme";
import GoalsRoute from "../goals";

const mockChangeGoal = jest.fn();
let mockGoal = "MAINTAIN_WEIGHT";

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../../../../shared/profile/ProfileContext", () => ({
  useProfile: () => ({ profile: { goal: mockGoal }, changeGoal: mockChangeGoal }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGoal = "MAINTAIN_WEIGHT";
});

describe("Profil hedefleri", () => {
  it("yalnızca üç hedefi gösterir ve eski hedefi Kas Geliştirme olarak seçili gösterir", () => {
    render(<GoalsRoute />);
    expect(screen.getByText("Kas Geliştirme")).toBeTruthy();
    expect(screen.getByText("Güçlenme")).toBeTruthy();
    expect(screen.getByText("Yağ Kaybı")).toBeTruthy();
    expect(screen.queryByText("Kiloyu Korumak")).toBeNull();
    fireEvent.press(screen.getByText("Kas Geliştirme"));
    expect(mockChangeGoal).not.toHaveBeenCalled();
  });

  it("sunucu onay isterse uyarır; yeniden değerlendirmede hedefi kaydetmez", async () => {
    mockChangeGoal.mockResolvedValueOnce({ status: "confirmationRequired", message: LOW_BODY_FAT_WARNING_MESSAGE });
    render(<GoalsRoute />);
    fireEvent.press(screen.getByText("Yağ Kaybı"));

    expect(await screen.findByText(LOW_BODY_FAT_WARNING_MESSAGE)).toBeTruthy();
    fireEvent.press(screen.getByText(LOW_BODY_FAT_RECONSIDER_LABEL));
    await waitFor(() => expect(screen.queryByText(LOW_BODY_FAT_WARNING_MESSAGE)).toBeNull());
    expect(mockChangeGoal).toHaveBeenCalledTimes(1);
    expect(mockChangeGoal).toHaveBeenCalledWith("LOSE_WEIGHT", { confirmLowBodyFatWarning: false });
  });

  it("uyarı onaylanırsa hedefi açık onayla tekrar gönderir", async () => {
    mockChangeGoal
      .mockResolvedValueOnce({ status: "confirmationRequired", message: LOW_BODY_FAT_WARNING_MESSAGE })
      .mockResolvedValueOnce({ status: "saved" });
    render(<GoalsRoute />);
    fireEvent.press(screen.getByText("Yağ Kaybı"));
    fireEvent.press(await screen.findByText(LOW_BODY_FAT_CONTINUE_LABEL));

    await waitFor(() => expect(mockChangeGoal).toHaveBeenCalledTimes(2));
    expect(mockChangeGoal).toHaveBeenLastCalledWith("LOSE_WEIGHT", { confirmLowBodyFatWarning: true });
  });
});
