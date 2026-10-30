import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "../../../../services/api/client";
import {
  LOW_BODY_FAT_CONFIRMATION_CODE,
  LOW_BODY_FAT_CONTINUE_LABEL,
  LOW_BODY_FAT_RECONSIDER_LABEL,
  LOW_BODY_FAT_WARNING_MESSAGE,
} from "../../../../shared/bodyComposition/bodyFat";
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
const mockRegister = jest.fn();
let mockGoal = "lose_weight";

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
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
  useProfile: () => ({ profile: { firstName: "Ayşe" }, completeFitnessProfile: jest.fn(), reload: jest.fn() }),
}));
jest.mock("../../../../shared/auth/useUsernameAvailability", () => ({
  useUsernameAvailability: () => ({ state: "available" }),
}));
jest.mock("../../../../services/api/equipment", () => ({ getEquipmentList: jest.fn(async () => []) }));

// Olcum adimi gercek bilesenle calisir; digerleri gecerli deger secen taslaklardir (erkek, 25 yas, 180 cm).
jest.mock("../steps/NameStep", () => ({ NameStep: require("../../../../test/onboardingStepStubs").FilledNameStep }));
jest.mock("../steps/LastNameStep", () => ({ LastNameStep: require("../../../../test/onboardingStepStubs").FilledLastNameStep }));
jest.mock("../steps/GenderStep", () => ({ GenderStep: require("../../../../test/onboardingStepStubs").GenderStep }));
jest.mock("../steps/AgeStep", () => ({ AgeStep: require("../../../../test/onboardingStepStubs").AgeStep }));
jest.mock("../steps/HeightStep", () => ({ HeightStep: require("../../../../test/onboardingStepStubs").HeightStep }));
jest.mock("../steps/WeightStep", () => ({ WeightStep: require("../../../../test/onboardingStepStubs").WeightStep }));
jest.mock("../steps/GoalStep", () => ({
  GoalStep: (props: { value: string | null; onChange: (v: string) => void }) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    require("react").useEffect(() => { if (!props.value) props.onChange(mockGoal); }, []);
    return null;
  },
}));
jest.mock("../steps/ActivityStep", () => ({ ActivityStep: require("../../../../test/onboardingStepStubs").ActivityStep }));
jest.mock("../steps/ExperienceStep", () => ({ ExperienceStep: require("../../../../test/onboardingStepStubs").ExperienceStep }));
jest.mock("../steps/FrequencyStep", () => ({ FrequencyStep: require("../../../../test/onboardingStepStubs").FrequencyStep }));
jest.mock("../steps/EquipmentStep", () => ({ EquipmentStep: require("../../../../test/onboardingStepStubs").EquipmentStep }));

jest.setTimeout(20000);

beforeEach(() => {
  jest.clearAllMocks();
  mockGoal = "lose_weight";
  mockRegister.mockResolvedValue({ verificationEmailSent: true });
});

async function pressContinue(times: number) {
  for (let i = 0; i < times; i++) {
    await waitFor(() => expect(screen.getByText("Devam et")).toBeEnabled());
    await fireEvent.press(screen.getByText("Devam et"));
  }
}

async function goToBodyCompositionStep() {
  await pressContinue(8); // amac + ad, soyad, cinsiyet, yas, boy, kilo, hedef
  await screen.findByText("Vücut ölçülerin (isteğe bağlı)");
}

async function finishAndSubmit() {
  await pressContinue(4);
  await screen.findByText("MB FIT hesabını oluştur");
  await fireEvent.changeText(screen.getByPlaceholderText("Kullanıcı adı"), "ayse_1");
  await fireEvent.changeText(screen.getByPlaceholderText("E-posta"), "ayse@example.com");
  await fireEvent.changeText(screen.getByPlaceholderText("Şifre"), "123456");
  await fireEvent.changeText(screen.getByPlaceholderText("Şifreyi onayla"), "123456");
  await waitFor(() => expect(screen.getByText("Hesap oluştur")).toBeEnabled());
  await fireEvent.press(screen.getByText("Hesap oluştur"));
}

describe("Onboarding: düşük yağ oranı uyarısı", () => {
  it("Yağ Kaybı seçilip yağ oranı düşükse uyarır; yeniden değerlendirme hedef adımına döner", async () => {
    await render(<OnboardingContainer />);
    await goToBodyCompositionStep();
    await fireEvent.changeText(screen.getByLabelText("Vücut yağ oranı (%)"), "6");
    await fireEvent.press(screen.getByText("Devam et"));

    expect(await screen.findByText(LOW_BODY_FAT_WARNING_MESSAGE)).toBeTruthy();
    await fireEvent.press(screen.getByText(LOW_BODY_FAT_RECONSIDER_LABEL));

    expect(await screen.findByText("Ana hedefin nedir?")).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("uyarı onaylanırsa devam eder ve kayıt açık onayla gönderilir", async () => {
    await render(<OnboardingContainer />);
    await goToBodyCompositionStep();
    // Navy tahmini: 180 cm, boyun 40, bel 74 -> %4.6 (25 yaş erkek için düşük aralık).
    await fireEvent.changeText(screen.getByLabelText("Boyun çevresi (cm)"), "40");
    await fireEvent.changeText(screen.getByLabelText("Bel çevresi (cm, göbek hizası)"), "74");
    expect(screen.getByText(/Tahmini yağ oranın: %4.6/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Devam et"));

    await fireEvent.press(await screen.findByText(LOW_BODY_FAT_CONTINUE_LABEL));
    expect(await screen.findByText("Ne kadar aktifsin?")).toBeTruthy();

    await finishAndSubmit();
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister.mock.calls[0][0]).toMatchObject({
      goal: "lose_weight",
      neckCm: 40,
      waistCm: 74,
      bodyFatPercentage: null,
      confirmLowBodyFatWarning: true,
    });
  });

  it("Kas Geliştirme hedefinde veya ölçüm yoksa uyarı göstermez", async () => {
    mockGoal = "build_muscle";
    await render(<OnboardingContainer />);
    await goToBodyCompositionStep();
    await fireEvent.changeText(screen.getByLabelText("Vücut yağ oranı (%)"), "6");
    await fireEvent.press(screen.getByText("Devam et"));
    expect(await screen.findByText("Ne kadar aktifsin?")).toBeTruthy();
    expect(screen.queryByText(LOW_BODY_FAT_WARNING_MESSAGE)).toBeNull();
  });

  it("aralık dışı ölçümde hata gösterir", async () => {
    await render(<OnboardingContainer />);
    await goToBodyCompositionStep();
    await fireEvent.changeText(screen.getByLabelText("Boyun çevresi (cm)"), "5");
    expect(screen.getByText("Boyun çevresi 20-80 cm arasında olmalıdır.")).toBeTruthy();

  });

  it("sunucu onay isterse uyarıyı gösterir ve onayla tekrar gönderir", async () => {
    mockRegister
      .mockRejectedValueOnce(new ApiError(409, LOW_BODY_FAT_WARNING_MESSAGE, [LOW_BODY_FAT_CONFIRMATION_CODE]))
      .mockResolvedValueOnce({ verificationEmailSent: true });
    await render(<OnboardingContainer />);
    await goToBodyCompositionStep();
    await fireEvent.press(screen.getByText("Şimdilik atla"));
    await screen.findByText("Ne kadar aktifsin?");

    await finishAndSubmit();
    await fireEvent.press(await screen.findByText(LOW_BODY_FAT_CONTINUE_LABEL));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(2));
    expect(mockRegister.mock.calls[0][0].confirmLowBodyFatWarning).toBeNull();
    expect(mockRegister.mock.calls[1][0].confirmLowBodyFatWarning).toBe(true);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
  });
});
