import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "../../../../services/api/client";
import { setPendingGoogleSignup, getPendingGoogleSignup, clearPendingGoogleSignup } from "../../../../shared/auth/pendingGoogleSignup";
import { mockThemeValue } from "../../../../test/mockTheme";
import { OnboardingContainer } from "../OnboardingContainer";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  canDismiss: jest.fn(() => false),
  dismissAll: jest.fn(),
};
let mockParams: Record<string, string | undefined> = {};
const mockRegister = jest.fn();
const mockGoogleRegister = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockRequestGoogleIdToken = jest.fn();
const mockRefreshGoogleIdToken = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../../../../shared/auth/AuthContext", () => ({
  useAuth: () => ({ register: mockRegister, googleRegister: mockGoogleRegister, googleSignIn: mockGoogleSignIn }),
}));
jest.mock("../../../../shared/auth/googleSignIn", () => {
  const actual = jest.requireActual("../../../../shared/auth/googleSignIn");
  return {
    ...actual,
    requestGoogleIdToken: () => mockRequestGoogleIdToken(),
    refreshGoogleIdToken: () => mockRefreshGoogleIdToken(),
  };
});
jest.mock("../../../../shared/auth/useUsernameAvailability", () => ({
  useUsernameAvailability: () => ({ state: "available" }),
}));
jest.mock("../../../../services/api/equipment", () => ({ getEquipmentList: jest.fn(async () => []) }));

// Ilk 11 adim, gecerli bir deger secen taslaklarla degistirilir (bkz. test/onboardingStepStubs); testin konusu son adim.
jest.mock("../steps/NameStep", () => ({ NameStep: require("../../../../test/onboardingStepStubs").NameStep }));
jest.mock("../steps/LastNameStep", () => ({ LastNameStep: require("../../../../test/onboardingStepStubs").LastNameStep }));
jest.mock("../steps/GenderStep", () => ({ GenderStep: require("../../../../test/onboardingStepStubs").GenderStep }));
jest.mock("../steps/AgeStep", () => ({ AgeStep: require("../../../../test/onboardingStepStubs").AgeStep }));
jest.mock("../steps/HeightStep", () => ({ HeightStep: require("../../../../test/onboardingStepStubs").HeightStep }));
jest.mock("../steps/WeightStep", () => ({ WeightStep: require("../../../../test/onboardingStepStubs").WeightStep }));
jest.mock("../steps/GoalStep", () => ({ GoalStep: require("../../../../test/onboardingStepStubs").GoalStep }));
jest.mock("../steps/ActivityStep", () => ({ ActivityStep: require("../../../../test/onboardingStepStubs").ActivityStep }));
jest.mock("../steps/ExperienceStep", () => ({ ExperienceStep: require("../../../../test/onboardingStepStubs").ExperienceStep }));
jest.mock("../steps/FrequencyStep", () => ({ FrequencyStep: require("../../../../test/onboardingStepStubs").FrequencyStep }));
jest.mock("../steps/EquipmentStep", () => ({ EquipmentStep: require("../../../../test/onboardingStepStubs").EquipmentStep }));

// 12 adimli akis ilk testte (soguk baslangic) varsayilan 5 sn sinirini asabiliyor.
jest.setTimeout(20000);

const GOOGLE_SIGNUP = {
  idToken: "pending-token",
  profile: { email: "mert@gmail.com", firstName: "Mert", lastName: "Akpınar" },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  clearPendingGoogleSignup();
  mockRefreshGoogleIdToken.mockResolvedValue(null);
});

/** Ad/soyad Google'dan on doldurulmus olmali; diger adimlar taslaklarla dolar. */
async function goToAccountStep() {
  for (let step = 1; step < 12; step++) {
    await waitFor(() => expect(screen.getByText("Devam et")).toBeEnabled());
    fireEvent.press(screen.getByText("Devam et"));
  }
  await screen.findByText("MB FIT hesabını oluştur");
}

describe("Onboarding: Google ile kayıt", () => {
  it("girişten gelince adı Google'dan doldurur, son adımda yalnızca kullanıcı adı sorar ve Google ile kaydeder", async () => {
    setPendingGoogleSignup(GOOGLE_SIGNUP);
    mockParams = { google: "1" };
    mockRefreshGoogleIdToken.mockResolvedValue("fresh-token");
    mockGoogleRegister.mockResolvedValue({ emailConfirmed: true, isNewUser: true });

    render(<OnboardingContainer />);

    expect(screen.getByText("ad:Mert")).toBeTruthy();
    await goToAccountStep();

    expect(screen.getByText("Google hesabınla kayıt oluyorsun")).toBeTruthy();
    expect(screen.getByText("mert@gmail.com")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Şifre")).toBeNull();
    expect(screen.queryByPlaceholderText("E-posta")).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText("Kullanıcı adı"), "mert_g");
    await waitFor(() => expect(screen.getByText("Hesap oluştur")).toBeEnabled());
    fireEvent.press(screen.getByText("Hesap oluştur"));

    await screen.findByText("Antrenmana Başla");
    const request = mockGoogleRegister.mock.calls[0][0];
    expect(request).toMatchObject({
      idToken: "fresh-token",
      firstName: "Mert",
      lastName: "Akpınar",
      username: "mert_g",
      heightCm: 180,
      weight: 78,
      goal: "build_muscle",
      trainingLocation: "home",
      equipmentIds: [],
    });
    expect(request).not.toHaveProperty("email");
    expect(request).not.toHaveProperty("password");
    expect(mockRegister).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Antrenmana Başla"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/dashboard");
  });

  it("son adımda Google'a dokununca hesap yoksa Google moduna geçer; yeni token alınamazsa eldeki token kullanılır", async () => {
    setPendingGoogleSignup(GOOGLE_SIGNUP);
    mockParams = { google: "1" };
    render(<OnboardingContainer />);
    await goToAccountStep();
    // E-posta/sifre ile kayda don, sonra Google butonunu kullan.
    fireEvent.press(screen.getByText("E-posta ve şifreyle kayıt ol"));
    expect(getPendingGoogleSignup()).toBeNull();
    expect(screen.getByPlaceholderText("Şifre")).toBeTruthy();

    mockRequestGoogleIdToken.mockResolvedValue("picker-token");
    mockGoogleSignIn.mockResolvedValue({ registrationRequired: true, profile: { email: "ali@gmail.com" } });
    mockGoogleRegister.mockResolvedValue({ emailConfirmed: true, isNewUser: true });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Google ile devam et"));
    });

    expect(mockGoogleSignIn).toHaveBeenCalledWith("picker-token");
    expect(await screen.findByText("ali@gmail.com")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("Kullanıcı adı"), "ali_1");
    await waitFor(() => expect(screen.getByText("Hesap oluştur")).toBeEnabled());
    fireEvent.press(screen.getByText("Hesap oluştur"));

    await waitFor(() => expect(mockGoogleRegister).toHaveBeenCalled());
    expect(mockGoogleRegister.mock.calls[0][0].idToken).toBe("picker-token");
  });

  it("Google kaydında oturum doğrulanamazsa Google moduna son verir ve tekrar denemeyi söyler", async () => {
    setPendingGoogleSignup(GOOGLE_SIGNUP);
    mockParams = { google: "1" };
    mockGoogleRegister.mockRejectedValue(new ApiError(401, "Google ile giriş doğrulanamadı. Lütfen tekrar dene."));
    render(<OnboardingContainer />);
    await goToAccountStep();

    fireEvent.changeText(screen.getByPlaceholderText("Kullanıcı adı"), "mert_g");
    await waitFor(() => expect(screen.getByText("Hesap oluştur")).toBeEnabled());
    fireEvent.press(screen.getByText("Hesap oluştur"));

    expect(await screen.findByText("Google oturumunun süresi doldu. \"Google ile devam et\"e tekrar dokun.")).toBeTruthy();
    expect(screen.getByPlaceholderText("Şifre")).toBeTruthy();
    expect(getPendingGoogleSignup()).toBeNull();
  });

  it("Google e-postayı doğrulanmış saymadıysa kod ekranına geçer", async () => {
    setPendingGoogleSignup(GOOGLE_SIGNUP);
    mockParams = { google: "1" };
    mockGoogleRegister.mockResolvedValue({ emailConfirmed: false, isNewUser: true, verificationEmailSent: true });
    render(<OnboardingContainer />);
    await goToAccountStep();

    fireEvent.changeText(screen.getByPlaceholderText("Kullanıcı adı"), "mert_g");
    await waitFor(() => expect(screen.getByText("Hesap oluştur")).toBeEnabled());
    fireEvent.press(screen.getByText("Hesap oluştur"));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/pages/auth/verify-email",
        params: { code: "sent", from: "register", name: "Mert Akpınar" },
      }),
    );
  });

  it("google parametresi yoksa bekleyen Google kaydını kullanmaz", async () => {
    setPendingGoogleSignup(GOOGLE_SIGNUP);
    render(<OnboardingContainer />);
    expect(screen.getByText("ad:")).toBeTruthy();
  });
});
