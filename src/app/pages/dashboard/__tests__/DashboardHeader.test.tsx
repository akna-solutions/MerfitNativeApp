import { fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { DashboardHeader } from "../components/DashboardHeader";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("DashboardHeader", () => {
  it("sag ustteki Ilerleme dugmesi Ilerleme ekranini acar; diger dugmeler de calisir", () => {
    const onProgress = jest.fn();
    const onNotifications = jest.fn();
    const onProfile = jest.fn();
    render(<DashboardHeader name="Reis" onProgressPress={onProgress} onNotificationsPress={onNotifications} onProfilePress={onProfile} />);

    fireEvent.press(screen.getByTestId("dashboard-progress-button"));
    expect(onProgress).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText("Bildirimler"));
    expect(onNotifications).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText("Profil"));
    expect(onProfile).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("İlerlemem")).toBeTruthy();
  });
});
