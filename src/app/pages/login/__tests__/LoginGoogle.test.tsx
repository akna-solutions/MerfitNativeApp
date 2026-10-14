import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { ApiError } from "../../../../services/api/client";
import { getPendingGoogleSignup, clearPendingGoogleSignup } from "../../../../shared/auth/pendingGoogleSignup";
import { GoogleSignInError } from "../../../../shared/auth/googleSignIn";
import { mockThemeValue } from "../../../../test/mockTheme";
import { LoginScreen } from "../components/LoginScreen";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  canDismiss: jest.fn(() => false),
  dismissAll: jest.fn(),
};
const mockGoogleSignIn = jest.fn();
const mockRequestGoogleIdToken = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../../../../shared/auth/AuthContext", () => ({
  useAuth: () => ({ login: jest.fn(), googleSignIn: mockGoogleSignIn }),
}));
jest.mock("../../../../shared/auth/googleSignIn", () => {
  const actual = jest.requireActual("../../../../shared/auth/googleSignIn");
  return { ...actual, requestGoogleIdToken: () => mockRequestGoogleIdToken() };
});

async function pressGoogle() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText("Google ile devam et"));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  clearPendingGoogleSignup();
  mockRequestGoogleIdToken.mockResolvedValue("id-token");
});

describe("Giriş ekranı: Google ile devam et", () => {
  it("hesap varsa oturum açar ve ana sayfaya geçer", async () => {
    mockGoogleSignIn.mockResolvedValue({ registrationRequired: false, auth: { emailConfirmed: true } });
    render(<LoginScreen />);

    await pressGoogle();

    expect(mockGoogleSignIn).toHaveBeenCalledWith("id-token");
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/dashboard");
  });

  it("e-postası doğrulanmamış hesapta kod ekranına geçer", async () => {
    mockGoogleSignIn.mockResolvedValue({ registrationRequired: false, auth: { emailConfirmed: false } });
    render(<LoginScreen />);

    await pressGoogle();

    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/pages/auth/verify-email", params: { code: "notSent" } });
  });

  it("hesap yoksa Google bilgilerini saklar ve onboarding'i Google moduyla açar", async () => {
    mockGoogleSignIn.mockResolvedValue({
      registrationRequired: true,
      profile: { email: "mert@gmail.com", firstName: "Mert", lastName: "Akpınar" },
    });
    render(<LoginScreen />);

    await pressGoogle();

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/pages/onboarding", params: { google: "1" } });
    expect(getPendingGoogleSignup()).toEqual({
      idToken: "id-token",
      profile: { email: "mert@gmail.com", firstName: "Mert", lastName: "Akpınar" },
    });
  });

  it("kullanıcı vazgeçerse hiçbir şey yapmaz", async () => {
    mockRequestGoogleIdToken.mockResolvedValue(null);
    render(<LoginScreen />);

    await pressGoogle();

    expect(mockGoogleSignIn).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("sunucu hatasını gösterir", async () => {
    mockGoogleSignIn.mockRejectedValue(new ApiError(409, "Bu e-posta adresiyle kayıtlı bir hesap var. E-posta ve şifrenle giriş yap."));
    render(<LoginScreen />);

    await pressGoogle();

    expect(screen.getByText("Bu e-posta adresiyle kayıtlı bir hesap var. E-posta ve şifrenle giriş yap.")).toBeTruthy();
  });

  it("Google yapılandırılmamışsa açık bir mesaj gösterir", async () => {
    mockRequestGoogleIdToken.mockRejectedValue(new GoogleSignInError("Google ile giriş şu anda kullanılamıyor."));
    render(<LoginScreen />);

    await pressGoogle();

    expect(screen.getByText("Google ile giriş şu anda kullanılamıyor.")).toBeTruthy();
    expect(mockGoogleSignIn).not.toHaveBeenCalled();
  });
});
