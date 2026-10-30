import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "../../../../services/api/client";
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
const mockCompleteFitnessProfile = jest.fn();
const mockReloadProfile = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../../../../shared/auth/AuthContext", () => ({
  useAuth: () => ({ register: mockRegister, googleRegister: jest.fn(), googleSignIn: jest.fn() }),
}));
jest.mock("../../../../shared/auth/googleSignIn", () => ({
  ...jest.requireActual("../../../../shared/auth/googleSignIn"),
  requestGoogleIdToken: jest.fn(),
  refreshGoogleIdToken: jest.fn(async () => null),
}));
jest.mock("../../../../shared/profile/ProfileContext", () => ({
  useProfile: () => ({
    profile: { firstName: "Ayşe" },
    completeFitnessProfile: mockCompleteFitnessProfile,
    reload: mockReloadProfile,
  }),
}));
jest.mock("../../../../shared/auth/useUsernameAvailability", () => ({
  useUsernameAvailability: () => ({ state: "available" }),
}));
jest.mock("../../../../services/api/equipment", () => ({ getEquipmentList: jest.fn(async () => [{ id: 4, name: "Dambıl" }]) }));

jest.mock("../steps/NameStep", () => ({ NameStep: require("../../../../test/onboardingStepStubs").FilledNameStep }));
jest.mock("../steps/LastNameStep", () => ({ LastNameStep: require("../../../../test/onboardingStepStubs").FilledLastNameStep }));
jest.mock("../steps/GenderStep", () => ({ GenderStep: require("../../../../test/onboardingStepStubs").GenderStep }));
jest.mock("../steps/AgeStep", () => ({ AgeStep: require("../../../../test/onboardingStepStubs").AgeStep }));
jest.mock("../steps/HeightStep", () => ({ HeightStep: require("../../../../test/onboardingStepStubs").HeightStep }));
jest.mock("../steps/WeightStep", () => ({ WeightStep: require("../../../../test/onboardingStepStubs").WeightStep }));
jest.mock("../steps/GoalStep", () => ({ GoalStep: require("../../../../test/onboardingStepStubs").GoalStep }));
jest.mock("../steps/BodyCompositionStep", () => ({ BodyCompositionStep: require("../../../../test/onboardingStepStubs").BodyCompositionStep }));
jest.mock("../steps/ActivityStep", () => ({ ActivityStep: require("../../../../test/onboardingStepStubs").ActivityStep }));
jest.mock("../steps/ExperienceStep", () => ({ ExperienceStep: require("../../../../test/onboardingStepStubs").ExperienceStep }));
jest.mock("../steps/FrequencyStep", () => ({ FrequencyStep: require("../../../../test/onboardingStepStubs").FrequencyStep }));
jest.mock("../steps/EquipmentStep", () => ({ EquipmentStep: require("../../../../test/onboardingStepStubs").EquipmentStep }));

jest.setTimeout(20000);

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockRegister.mockResolvedValue({ verificationEmailSent: true });
  mockCompleteFitnessProfile.mockResolvedValue(undefined);
});

async function pressContinue(times: number) {
  for (let i = 0; i < times; i++) {
    await waitFor(() => expect(screen.getByText("Devam et")).toBeEnabled());
    await fireEvent.press(screen.getByText("Devam et"));
  }
}

async function fillAccountAndSubmit() {
  await screen.findByText("MB FIT hesabını oluştur");
  await fireEvent.changeText(screen.getByPlaceholderText("Kullanıcı adı"), "ayse_1");
  await fireEvent.changeText(screen.getByPlaceholderText("E-posta"), "ayse@example.com");
  await fireEvent.changeText(screen.getByPlaceholderText("Şifre"), "123456");
  await fireEvent.changeText(screen.getByPlaceholderText("Şifreyi onayla"), "123456");
  await waitFor(() => expect(screen.getByText("Hesap oluştur")).toBeEnabled());
  await fireEvent.press(screen.getByText("Hesap oluştur"));
}

describe("Onboarding: sadece alışveriş için kayıt", () => {
  it("ilk adımda kayıt amacını sorar; varsayılan tam uygulamadır", async () => {
    await render(<OnboardingContainer />);

    expect(screen.getByText("MB FIT'i nasıl kullanacaksın?")).toBeTruthy();
    expect(screen.getByText("MB Fit + MB Shop")).toBeTruthy();
    expect(screen.getByText("Sadece alışveriş")).toBeTruthy();
    expect(screen.getByText("Devam et")).toBeEnabled();
  });

  it("sadece alışveriş seçilirse boy/kilo sormadan ad, soyad ve hesap bilgileriyle kaydeder", async () => {
    await render(<OnboardingContainer />);

    await fireEvent.press(screen.getByText("Sadece alışveriş"));
    await pressContinue(3); // amac, ad, soyad -> hesap adimi
    expect(screen.getByText("Hesabını oluştur ve MB Shop'ta alışverişe başla.")).toBeTruthy();
    await fillAccountAndSubmit();

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    const request = mockRegister.mock.calls[0][0];
    expect(request).toMatchObject({
      firstName: "Ayşe",
      lastName: "Yılmaz",
      username: "ayse_1",
      email: "ayse@example.com",
      password: "123456",
      shoppingOnly: true,
    });
    expect(request.heightCm).toBeUndefined();
    expect(request.weight).toBeUndefined();
    expect(request.goal).toBeUndefined();
    expect(request.equipmentIds).toBeUndefined();
    // Kod dogrulaninca "Alisverise basla" ile MB Shop acilir (shop=1).
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/pages/auth/verify-email",
        params: { code: "sent", from: "register", name: "Ayşe Yılmaz", shop: "1" },
      }),
    );
  });

  it("tam uygulama seçilirse fitness adımları sorulur ve shoppingOnly gönderilmez", async () => {
    await render(<OnboardingContainer />);

    await pressContinue(13); // amac + 12 adim
    await fillAccountAndSubmit();

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    const request = mockRegister.mock.calls[0][0];
    expect(request.shoppingOnly).toBeUndefined();
    expect(request).toMatchObject({ heightCm: 180, weight: 78, goal: "build_muscle", gender: "male" });
  });

  it("geri dönüp tam uygulamayı seçince adımlar yeniden eklenir", async () => {
    await render(<OnboardingContainer />);

    await fireEvent.press(screen.getByText("Sadece alışveriş"));
    await pressContinue(1);
    await fireEvent.press(screen.getByText("←"));
    await fireEvent.press(screen.getByText("MB Fit + MB Shop"));
    await pressContinue(3);

    expect(await screen.findByText("Cinsiyetin nedir?")).toBeTruthy();
  });
});

describe("Onboarding: fitness profilini sonradan tamamlama (mode=fitness)", () => {
  beforeEach(() => {
    mockParams = { mode: "fitness" };
  });

  it("yalnızca fitness adımlarını sorar ve profili tamamlar", async () => {
    await render(<OnboardingContainer />);

    // Ad/soyad ve hesap adimlari yok: dogrudan cinsiyetle baslar.
    expect(screen.getByText("Cinsiyetin nedir?")).toBeTruthy();
    await pressContinue(9);
    await screen.findByText("Nerede antrenman yapıyorsun?");
    await waitFor(() => expect(screen.getByText("Profili tamamla")).toBeEnabled());
    await fireEvent.press(screen.getByText("Profili tamamla"));

    await waitFor(() => expect(mockCompleteFitnessProfile).toHaveBeenCalledTimes(1));
    const request = mockCompleteFitnessProfile.mock.calls[0][0];
    expect(request).toMatchObject({
      gender: "male",
      age: 25,
      heightUnit: "cm",
      heightCm: 180,
      weight: 78,
      goal: "build_muscle",
      activityLevel: "moderate",
      trainingExperience: "beginner",
      trainingDays: 3,
      trainingLocation: "home",
      equipmentIds: [],
    });
    expect(request).not.toHaveProperty("firstName");
    expect(request).not.toHaveProperty("username");
    expect(request).not.toHaveProperty("email");
    expect(request).not.toHaveProperty("shoppingOnly");
    expect(mockRegister).not.toHaveBeenCalled();

    expect(await screen.findByText("Hazırsın, Ayşe.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Antrenmana Başla"));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("profil başka yerde tamamlanmışsa (409) profili yeniler ve MB Fit'e döner", async () => {
    mockCompleteFitnessProfile.mockRejectedValueOnce(new ApiError(409, "Fitness profilin zaten tamamlanmış."));
    await render(<OnboardingContainer />);

    await pressContinue(9);
    await waitFor(() => expect(screen.getByText("Profili tamamla")).toBeEnabled());
    await fireEvent.press(screen.getByText("Profili tamamla"));

    await waitFor(() => expect(mockReloadProfile).toHaveBeenCalled());
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("sunucu hatasını son adımda gösterir", async () => {
    mockCompleteFitnessProfile.mockRejectedValueOnce(new ApiError(400, "Kilo alani zorunludur."));
    await render(<OnboardingContainer />);

    await pressContinue(9);
    await waitFor(() => expect(screen.getByText("Profili tamamla")).toBeEnabled());
    await fireEvent.press(screen.getByText("Profili tamamla"));

    expect(await screen.findByText("Kilo alani zorunludur.")).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
