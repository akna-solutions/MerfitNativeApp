import { render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../../test/mockTheme";
import { UsernameAvailability } from "../../../../../shared/auth/useUsernameAvailability";
import { AccountStep } from "../AccountStep";

jest.mock("../../../../../shared/theme/ThemeContext", () => ({
  useTheme: () => mockThemeValue,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));

function renderStep(usernameAvailability: UsernameAvailability) {
  return render(
    <AccountStep
      username="mert"
      onUsernameChange={jest.fn()}
      usernameAvailability={usernameAvailability}
      email=""
      onEmailChange={jest.fn()}
      password=""
      onPasswordChange={jest.fn()}
      confirmPassword=""
      onConfirmPasswordChange={jest.fn()}
      onGooglePress={jest.fn()}
      onLoginPress={jest.fn()}
    />,
  );
}

describe("AccountStep kullanıcı adı kontrolü", () => {
  it("kontrol sürerken bilgi verir", () => {
    renderStep({ state: "checking" });
    expect(screen.getByText("Kontrol ediliyor…")).toBeTruthy();
  });

  it("uygunsa onaylar", () => {
    renderStep({ state: "available" });
    expect(screen.getByText("Kullanıcı adı uygun")).toBeTruthy();
  });

  it("alınmışsa sunucunun mesajını gösterir", () => {
    renderStep({ state: "unavailable", message: "Bu kullanıcı adı zaten kullanılıyor." });
    expect(screen.getByText("Bu kullanıcı adı zaten kullanılıyor.")).toBeTruthy();
  });

  it("kontrol yapılamadıysa bir şey göstermez", () => {
    renderStep({ state: "unknown" });
    expect(screen.queryByText("Kullanıcı adı uygun")).toBeNull();
    expect(screen.queryByText("Kontrol ediliyor…")).toBeNull();
  });
});
