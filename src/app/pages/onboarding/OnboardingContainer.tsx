import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import {
  ApiError,
  isApiError,
  NetworkError,
} from "../../../services/api/client";
import { getEquipmentList } from "../../../services/api/equipment";
import {
  EquipmentListItem,
  FitnessProfileRequest,
  GoogleRegisterRequest,
  RegisterRequest,
} from "../../../services/api/types";
import { useAuth } from "../../../shared/auth/AuthContext";
import {
  assessBodyFat,
  BodyMeasurementField,
  isLowBodyFatConfirmationError,
  parseDecimal,
  requiresLowBodyFatWarning,
  validateMeasurement,
} from "../../../shared/bodyComposition/bodyFat";
import { LowBodyFatWarningModal } from "../../../shared/bodyComposition/LowBodyFatWarningModal";
import { refreshGoogleIdToken } from "../../../shared/auth/googleSignIn";
import { goToDashboardAfterAuth, goToEmailVerificationAfterAuth } from "../../../shared/auth/navigation";
import {
  clearPendingGoogleSignup,
  getPendingGoogleSignup,
  PendingGoogleSignup,
} from "../../../shared/auth/pendingGoogleSignup";
import { googleErrorMessage, useGoogleSignIn } from "../../../shared/auth/useGoogleSignIn";
import { useUsernameAvailability } from "../../../shared/auth/useUsernameAvailability";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { SuccessScreen } from "./components/SuccessScreen";
import { AccountStep } from "./steps/AccountStep";
import { ActivityStep } from "./steps/ActivityStep";
import { AgeStep } from "./steps/AgeStep";
import { BodyCompositionStep, BodyCompositionValues } from "./steps/BodyCompositionStep";
import { EquipmentLoadStatus, EquipmentStep } from "./steps/EquipmentStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { FrequencyStep } from "./steps/FrequencyStep";
import { GenderStep } from "./steps/GenderStep";
import { GoalStep } from "./steps/GoalStep";
import { HeightStep } from "./steps/HeightStep";
import { LastNameStep } from "./steps/LastNameStep";
import { NameStep } from "./steps/NameStep";
import { PurposeStep } from "./steps/PurposeStep";
import { WeightStep } from "./steps/WeightStep";
import { initialOnboardingData, OnboardingData } from "./types";

type StepId =
  | "purpose"
  | "name"
  | "lastName"
  | "gender"
  | "age"
  | "height"
  | "weight"
  | "goal"
  | "bodyComposition"
  | "activity"
  | "experience"
  | "frequency"
  | "equipment"
  | "account";

/** MB Fit'in ihtiyac duydugu fitness adimlari; yalnizca alisveris icin kayitta atlanir, sonradan tamamlanir. */
const FITNESS_STEPS: StepId[] = [
  "gender", "age", "height", "weight", "goal", "bodyComposition", "activity", "experience", "frequency", "equipment",
];

/**
 * Akistaki adimlar: kayitta once amac (tam uygulama / sadece alisveris) sorulur; "Sadece alisveris" secilirse
 * yalnizca ad, soyad ve hesap bilgileri istenir. Profil tamamlama modunda (mode=fitness) yalnizca fitness adimlari.
 */
function stepsFor(completingProfile: boolean, purpose: OnboardingData["purpose"]): StepId[] {
  if (completingProfile) return FITNESS_STEPS;
  if (purpose === "shopping") return ["purpose", "name", "lastName", "account"];
  return ["purpose", "name", "lastName", ...FITNESS_STEPS, "account"];
}

// Bu alanlardan biri degisirse dusuk yag orani onayi gecersiz olur ve uyari yeniden degerlendirilir.
const BODY_FAT_INPUT_KEYS: (keyof OnboardingData)[] = [
  "goal", "gender", "age", "height", "heightUnit", "heightFeet", "heightInches", "bodyFat", "neck", "waist", "hip",
];

const MEASUREMENT_FIELDS: Record<keyof BodyCompositionValues, BodyMeasurementField> = {
  bodyFat: "bodyFat",
  neck: "neck",
  waist: "waist",
  hip: "hip",
};

function heightCmOf(data: OnboardingData): number | null {
  if (data.heightUnit === "cm") return parseDecimal(data.height);
  const feet = parseDecimal(data.heightFeet);
  if (feet === null) return null;
  return Math.round((feet * 30.48 + (parseDecimal(data.heightInches) ?? 0) * 2.54) * 10) / 10;
}

/** Onboarding verisinden yag orani degerlendirmesi (sunucudaki kayit akisiyla ayni kural). */
function bodyFatAssessmentOf(data: OnboardingData) {
  const age = parseInt(data.age, 10);
  return assessBodyFat({
    gender: data.gender,
    age: Number.isNaN(age) ? null : age,
    heightCm: heightCmOf(data),
    bodyFatPercentage: parseDecimal(data.bodyFat),
    neckCm: parseDecimal(data.neck),
    waistCm: parseDecimal(data.waist),
    hipCm: data.gender === "female" ? parseDecimal(data.hip) : null,
  });
}

function measurementErrors(data: OnboardingData) {
  const errors: Partial<Record<keyof BodyCompositionValues, string>> = {};
  (Object.keys(MEASUREMENT_FIELDS) as (keyof BodyCompositionValues)[]).forEach((key) => {
    const raw = data[key];
    if (!raw.trim()) return;
    const value = parseDecimal(raw);
    const error = value === null ? "Geçerli bir sayı gir." : validateMeasurement(MEASUREMENT_FIELDS[key], value);
    if (error) errors[key] = error;
  });
  return errors;
}

type LowBodyFatPrompt = { origin: "local" } | { origin: "server"; message: string };

type ProfileFields = Omit<RegisterRequest, "email" | "password" | "confirmPassword">;

/**
 * OnboardingData (RN state) -> kayit isteklerinin ortak onboarding alanlari (backend AccountProfileRequest).
 * Sayisal alanlar backend'de decimal/int oldugundan bos string'ler yerine null gonderiyoruz.
 */
function toProfileFields(data: OnboardingData, allEquipmentIds: number[]): ProfileFields {
  const age = parseInt(data.age, 10);
  const heightCm = data.height ? parseFloat(data.height) : null;
  const heightFeet = data.heightFeet ? parseInt(data.heightFeet, 10) : null;
  const heightInches = data.heightInches
    ? parseInt(data.heightInches, 10)
    : null;
  const weight = data.weight ? parseFloat(data.weight) : null;

  return {
    firstName: data.name.trim(),
    lastName: data.lastName.trim(),
    username: data.username.trim(),
    gender: data.gender,
    age: Number.isNaN(age) ? null : age,
    heightUnit: data.heightUnit,
    heightCm: data.heightUnit === "cm" ? heightCm : null,
    heightFeet: data.heightUnit === "ft_in" ? heightFeet : null,
    heightInches: data.heightUnit === "ft_in" ? heightInches : null,
    weightUnit: data.weightUnit,
    weight,
    goal: data.goal,
    bodyFatPercentage: parseDecimal(data.bodyFat),
    neckCm: parseDecimal(data.neck),
    waistCm: parseDecimal(data.waist),
    hipCm: data.gender === "female" ? parseDecimal(data.hip) : null,
    confirmLowBodyFatWarning: data.confirmLowBodyFatWarning ? true : null,
    activityLevel: data.activityLevel,
    trainingExperience: data.trainingExperience,
    trainingDays: data.trainingDays,
    trainingLocation: data.trainingLocation,
    // Spor salonunda tum ekipmanlar var sayilir (ekipman secimi sorulmaz).
    // "none" yalnizca istemci secenegidir; backend'e yalnizca gercek Equipment.Id'leri gider.
    equipmentIds:
      data.trainingLocation === "gym"
        ? allEquipmentIds
        : data.equipment.filter((item): item is number => item !== "none"),
  };
}

/** Yalnizca alisveris icin kayit: fitness alanlari gonderilmez (backend shoppingOnly ile yok sayar). */
function toShoppingProfileFields(data: OnboardingData): ProfileFields {
  return {
    firstName: data.name.trim(),
    lastName: data.lastName.trim(),
    username: data.username.trim(),
    heightUnit: "cm",
    weightUnit: "kg",
    shoppingOnly: true,
  };
}

function toAccountFields(data: OnboardingData, allEquipmentIds: number[]): ProfileFields {
  return data.purpose === "shopping" ? toShoppingProfileFields(data) : toProfileFields(data, allEquipmentIds);
}

/** OnboardingData -> POST /api/profile/fitness (alisveris hesabinin fitness profilini tamamlama). */
function toFitnessProfileRequest(data: OnboardingData, allEquipmentIds: number[]): FitnessProfileRequest {
  const { firstName: _firstName, lastName: _lastName, username: _username, shoppingOnly: _shoppingOnly, ...fitness } =
    toProfileFields(data, allEquipmentIds);
  return fitness;
}

/** OnboardingData -> RegisterRequest (e-posta/sifre ile kayit). */
function toRegisterRequest(data: OnboardingData, allEquipmentIds: number[]): RegisterRequest {
  return {
    ...toAccountFields(data, allEquipmentIds),
    email: data.email.trim(),
    password: data.password,
    confirmPassword: data.confirmPassword,
  };
}

/** Google profilindeki ad/soyad ile onboarding'in ilk adimlarini on doldurur (kullanici degistirebilir). */
function initialDataFor(googleSignup: PendingGoogleSignup | null): OnboardingData {
  if (!googleSignup) return initialOnboardingData;
  return {
    ...initialOnboardingData,
    name: googleSignup.profile.firstName?.trim() ?? "",
    lastName: googleSignup.profile.lastName?.trim() ?? "",
    email: googleSignup.profile.email,
  };
}

function registrationErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const apiError = error as ApiError;
    return apiError.fieldErrors.length > 0 ? apiError.fieldErrors[0] : apiError.message;
  }
  if (error instanceof NetworkError) {
    return "Sunucuya ulaşılamadı. İnternet bağlantınızı veya backend adresini kontrol edin.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Hesap oluşturulamadı. Lütfen tekrar deneyin.";
}

export function OnboardingContainer() {
  const router = useRouter();
  const params = useLocalSearchParams<{ google?: string; mode?: string }>();
  const { register, googleRegister } = useAuth();
  const { profile, completeFitnessProfile, reload: reloadProfile } = useProfile();
  const { colors } = useTheme();
  // mode=fitness: yalnizca alisveris icin kayit olmus kullanici MB Fit'i actiginda fitness adimlarini tamamlar.
  const completingProfile = params.mode === "fitness";
  const google = useGoogleSignIn();
  // Giris ekraninda "Google ile devam et" denenip hesap bulunamadiysa onboarding Google moduyla acilir
  // (google=1): ad/soyad on doldurulur, son adimda e-posta/sifre yerine yalnizca kullanici adi sorulur.
  const [googleSignup, setGoogleSignup] = useState<PendingGoogleSignup | null>(() =>
    params.google === "1" ? getPendingGoogleSignup() : null,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>(() => initialDataFor(googleSignup));
  const steps = stepsFor(completingProfile, data.purpose);
  const stepId = steps[Math.min(stepIndex, steps.length - 1)];
  const stepNumber = stepIndex + 1;
  const totalSteps = steps.length;
  const shoppingOnly = !completingProfile && data.purpose === "shopping";
  // Google ile yeni hesap acildiginda (e-posta Google tarafindan dogrulanmis) kod ekrani yerine "Hazirsin" gosterilir.
  const [completedName, setCompletedName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentListItem[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentLoadStatus>("loading");
  const [equipmentAttempt, setEquipmentAttempt] = useState(0);
  const [lowBodyFatPrompt, setLowBodyFatPrompt] = useState<LowBodyFatPrompt | null>(null);
  const usernameAvailability = useUsernameAvailability(data.username);

  // Ekipman listesini akisin basinda cekiyoruz; EquipmentStep secenekleri bu listeden uretir
  // (sabit kodlanmis slug'lar yok). Basarisiz olursa kullanici adimda tekrar deneyebilir.
  useEffect(() => {
    let isMounted = true;
    setEquipmentStatus("loading");
    getEquipmentList()
      .then((list) => {
        if (!isMounted) return;
        setEquipmentList(list);
        setEquipmentStatus("ready");
      })
      .catch((error) => {
        console.warn("Ekipman listesi alinamadi:", error);
        if (isMounted) setEquipmentStatus("error");
      });
    return () => {
      isMounted = false;
    };
  }, [equipmentAttempt]);

  const update = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K],
  ) =>
    setData((prev) => ({
      ...prev,
      [key]: value,
      confirmLowBodyFatWarning:
        BODY_FAT_INPUT_KEYS.includes(key) && prev[key] !== value ? false : prev.confirmLowBodyFatWarning,
    }));

  const goToStep = (id: StepId) => setStepIndex(Math.max(steps.indexOf(id), 0));
  const goToStepAfter = (id: StepId) => setStepIndex(steps.indexOf(id) + 1);

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      void submit();
    }
  };

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setSubmitError(null);
    setStepIndex(stepIndex - 1);
  };

  const submit = (submitData: OnboardingData = data) =>
    completingProfile ? handleCompleteProfile(submitData) : handleCreateAccount(submitData);

  // Profil tamamlama bittiginde (veya zaten tamamsa) MB Fit'e geri donulur; FitnessProfileGate artik icerigi gosterir.
  const leaveProfileCompletion = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/pages/dashboard");
  };

  const handleCompleteProfile = async (submitData: OnboardingData) => {
    if (isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await completeFitnessProfile(toFitnessProfileRequest(submitData, equipmentList.map((item) => item.id)));
      setCompletedName(profile.firstName);
    } catch (error) {
      if (isLowBodyFatConfirmationError(error)) {
        setLowBodyFatPrompt({ origin: "server", message: (error as ApiError).message });
        return;
      }
      if (isApiError(error) && error.status === 409) {
        // Profil bu arada (baska cihazda) tamamlanmis: guncel profil yuklenir ve MB Fit'e donulur.
        reloadProfile();
        leaveProfileCompletion();
        return;
      }
      console.error("Profil tamamlama hatası:", error);
      setSubmitError(registrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (submitData: OnboardingData = data) => {
    if (isSubmitting) return;
    if (googleSignup) {
      await handleCreateGoogleAccount(googleSignup, submitData);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await register(toRegisterRequest(submitData, equipmentList.map((item) => item.id)));
      // E-posta dogrulanmadan uygulamaya gecilmez: kayittan sonra dogrudan kod ekranina gidilir;
      // kod dogrulaninca "Hazırsın" ekrani gosterilir.
      goToEmailVerificationAfterAuth(router, {
        codeState: result.verificationEmailSent === false ? "failed" : "sent",
        fromRegistration: true,
        name: `${data.name} ${data.lastName}`.trim(),
        shoppingOnly: submitData.purpose === "shopping",
      });
    } catch (error) {
      if (isLowBodyFatConfirmationError(error)) {
        // Sunucu (son olcumlerle) uyari gerektiriyor: kullanici acikca secim yapana kadar kayit yapilmaz.
        setLowBodyFatPrompt({ origin: "server", message: (error as ApiError).message });
        return;
      }
      console.error("Kayıt hatası:", error);
      setSubmitError(registrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGoogleAccount = async (signup: PendingGoogleSignup, submitData: OnboardingData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // ID token ~1 saat gecerli; onboarding uzun surduyse sessizce yenisi alinir.
      const idToken = (await refreshGoogleIdToken()) ?? signup.idToken;
      const request: GoogleRegisterRequest = {
        ...toAccountFields(submitData, equipmentList.map((item) => item.id)),
        idToken,
      };
      const result = await googleRegister(request);
      const name = `${data.name} ${data.lastName}`.trim();
      if (result.emailConfirmed === false) {
        // Google e-postayi dogrulanmis saymadiysa (nadir) e-posta/sifre kaydindaki gibi kod istenir.
        goToEmailVerificationAfterAuth(router, {
          codeState: result.verificationEmailSent === false ? "failed" : "sent",
          fromRegistration: true,
          name,
          shoppingOnly: submitData.purpose === "shopping",
        });
      } else if (result.isNewUser) {
        setCompletedName(name);
      } else {
        // Bu Google hesabi bu arada baska bir yoldan kaydolmus: dogrudan uygulamaya gecilir.
        goToDashboardAfterAuth(router, { shoppingOnly: result.fitnessProfileCompleted === false });
      }
    } catch (error) {
      if (isLowBodyFatConfirmationError(error)) {
        setLowBodyFatPrompt({ origin: "server", message: (error as ApiError).message });
        return;
      }
      console.error("Google ile kayıt hatası:", error);
      if (isApiError(error) && error.status === 401) {
        // Google kimligi dogrulanamadi (suresi dolmus olabilir): Google butonu tekrar gorunsun.
        clearPendingGoogleSignup();
        setGoogleSignup(null);
        setSubmitError("Google oturumunun süresi doldu. \"Google ile devam et\"e tekrar dokun.");
      } else {
        setSubmitError(isApiError(error) || error instanceof NetworkError ? registrationErrorMessage(error) : googleErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGooglePress = async () => {
    setSubmitError(null);
    const outcome = await google.start();
    if (outcome.type === "registrationRequired") {
      // Hesap yok: bu adim Google moduna gecer, kullanici adini secip "Hesap olustur"a dokunur.
      setGoogleSignup({ idToken: outcome.idToken, profile: outcome.profile });
    }
  };

  const handleUseOtherMethod = () => {
    clearPendingGoogleSignup();
    setGoogleSignup(null);
    setSubmitError(null);
  };

  const age = parseInt(data.age, 10);
  const ageValid = !Number.isNaN(age) && age >= 13 && age <= 100;
  const heightValid =
    data.heightUnit === "cm"
      ? data.height.length > 0
      : data.heightFeet.length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
  const passwordValid = data.password.length >= 6;
  const passwordsMatch = data.password === data.confirmPassword;
  // Backend RegisterRequest.Username validasyonuyla (3-30 karakter, a-zA-Z0-9_) birebir ayni kural.
  const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(data.username.trim());
  // Kullanici adi alinmissa veya kontrol suruyorsa devam edilmez; kontrol yapilamadiysa ("unknown")
  // kayit sirasinda sunucu yine kontrol eder.
  const usernameUsable =
    usernameAvailability.state !== "unavailable" && usernameAvailability.state !== "checking";
  const accountValid = googleSignup
    ? usernameValid && usernameUsable
    : usernameValid && usernameUsable && emailValid && passwordValid && passwordsMatch;

  const bodyFatAssessment = bodyFatAssessmentOf(data);
  const bodyCompositionErrors = measurementErrors(data);

  const continueFromBodyComposition = () => {
    if (requiresLowBodyFatWarning(data.goal, bodyFatAssessment) && !data.confirmLowBodyFatWarning) {
      setLowBodyFatPrompt({ origin: "local" });
      return;
    }
    goNext();
  };

  const skipBodyComposition = () => {
    setData((prev) => ({ ...prev, bodyFat: "", neck: "", waist: "", hip: "", confirmLowBodyFatWarning: false }));
    goToStepAfter("bodyComposition");
  };

  // "Hedefimi yeniden degerlendirecegim": hicbir sey kaydedilmez, kullanici hedef adimina doner.
  const reconsiderGoal = () => {
    setLowBodyFatPrompt(null);
    setSubmitError(null);
    goToStep("goal");
  };

  // "Uyariyi anladim, devam et": acik onay kaydedilir; sunucu istediyse kayit onayla tekrar gonderilir.
  const confirmLowBodyFatWarning = () => {
    const prompt = lowBodyFatPrompt;
    const confirmed = { ...data, confirmLowBodyFatWarning: true };
    setData(confirmed);
    setLowBodyFatPrompt(null);
    if (prompt?.origin === "server") {
      void submit(confirmed);
    } else {
      goToStepAfter("bodyComposition");
    }
  };

  if (completedName !== null) {
    return (
      <SuccessScreen
        name={completedName}
        variant={shoppingOnly ? "shopping" : "fitness"}
        onStart={completingProfile ? leaveProfileCompletion : () => goToDashboardAfterAuth(router, { shoppingOnly })}
      />
    );
  }

  return (
    <>
      {renderStep()}
      <LowBodyFatWarningModal
        visible={lowBodyFatPrompt !== null}
        message={lowBodyFatPrompt?.origin === "server" ? lowBodyFatPrompt.message : null}
        onReconsider={reconsiderGoal}
        onConfirm={confirmLowBodyFatWarning}
        confirming={isSubmitting}
      />
    </>
  );

  function renderStep() {
    switch (stepId) {
      case "purpose":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="MB FIT'i nasıl kullanacaksın?"
            description="Sadece alışveriş yapacaksan boy, kilo gibi bilgileri sormayız; MB Fit'i istediğin zaman açıp tamamlayabilirsin."
            onBack={goBack}
            onContinue={goNext}
          >
            <PurposeStep value={data.purpose} onChange={(value) => update("purpose", value)} />
          </OnboardingScreen>
        );

      case "name":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Adın nedir?"
            description="Adını, MB FIT deneyimini kişiselleştirmek için kullanacağız."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.name.trim()}
          >
            <NameStep
              value={data.name}
              onChange={(value) => update("name", value)}
            />
          </OnboardingScreen>
        );

      case "lastName":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Soyadın nedir?"
            description="Soyadını, profilini tamamlamak için kullanacağız."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.lastName.trim()}
          >
            <LastNameStep
              value={data.lastName}
              onChange={(value) => update("lastName", value)}
            />
          </OnboardingScreen>
        );

      case "gender":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Cinsiyetin nedir?"
            description="Bu, fitness önerilerini kişiselleştirmemize yardımcı olur."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.gender}
          >
            <GenderStep
              value={data.gender}
              onChange={(value) => update("gender", value)}
            />
          </OnboardingScreen>
        );

      case "age":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Kaç yaşındasın?"
            description="Yaşın, antrenman ve beslenme önerilerini kişiselleştirmemize yardımcı olur."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!ageValid}
          >
            <AgeStep
              value={data.age}
              onChange={(value) => update("age", value)}
            />
          </OnboardingScreen>
        );

      case "height":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Boyun kaç?"
            description="Boyunu, fitness metriklerini hesaplamak için kullanacağız."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!heightValid}
          >
            <HeightStep
              unit={data.heightUnit}
              onUnitChange={(value) => update("heightUnit", value)}
              cmValue={data.height}
              onCmChange={(value) => update("height", value)}
              feetValue={data.heightFeet}
              onFeetChange={(value) => update("heightFeet", value)}
              inchesValue={data.heightInches}
              onInchesChange={(value) => update("heightInches", value)}
            />
          </OnboardingScreen>
        );

      case "weight":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Şu anki kilon nedir?"
            description="Bu, hedeflerini kişiselleştirmemize ve ilerlemeni takip etmemize yardımcı olur."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.weight}
          >
            <WeightStep
              unit={data.weightUnit}
              onUnitChange={(value) => update("weightUnit", value)}
              value={data.weight}
              onChange={(value) => update("weight", value)}
            />
          </OnboardingScreen>
        );

      case "goal":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Ana hedefin nedir?"
            description="MB FIT'in odaklanmasını istediğin hedefi seç."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.goal}
          >
            <GoalStep
              value={data.goal}
              onChange={(value) => update("goal", value)}
            />
          </OnboardingScreen>
        );

      case "bodyComposition":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Vücut ölçülerin (isteğe bağlı)"
            description="Yağ oranını bilmek hedefini ve beslenme planını güvenle ayarlamamıza yardımcı olur."
            onBack={goBack}
            onContinue={continueFromBodyComposition}
            onSkip={skipBodyComposition}
            continueDisabled={Object.keys(bodyCompositionErrors).length > 0}
          >
            <BodyCompositionStep
              gender={data.gender}
              values={{ bodyFat: data.bodyFat, neck: data.neck, waist: data.waist, hip: data.hip }}
              onChange={(key, value) => update(key, value)}
              errors={bodyCompositionErrors}
              assessment={bodyFatAssessment}
            />
          </OnboardingScreen>
        );

      case "activity":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Ne kadar aktifsin?"
            description="Mevcut aktivite seviyeni bize anlat."
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.activityLevel}
          >
            <ActivityStep
              value={data.activityLevel}
              onChange={(value) => update("activityLevel", value)}
            />
          </OnboardingScreen>
        );

      case "experience":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Antrenman tecrüben nedir?"
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.trainingExperience}
          >
            <ExperienceStep
              value={data.trainingExperience}
              onChange={(value) => update("trainingExperience", value)}
            />
          </OnboardingScreen>
        );

      case "frequency":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Ne sıklıkla antrenman yapmak istiyorsun?"
            onBack={goBack}
            onContinue={goNext}
            continueDisabled={!data.trainingDays}
          >
            <FrequencyStep
              value={data.trainingDays}
              onChange={(value) => update("trainingDays", value)}
            />
          </OnboardingScreen>
        );

      case "equipment":
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="Nerede antrenman yapıyorsun?"
            onBack={goBack}
            onContinue={goNext}
            continueLabel={completingProfile ? "Profili tamamla" : undefined}
            continueLoading={completingProfile && isSubmitting}
            continueDisabled={
              (completingProfile && isSubmitting) ||
              !data.trainingLocation ||
              equipmentStatus === "loading" ||
              // Spor salonunda tum ekipman ID'leri gonderilir; liste gelmeden devam edilemez.
              (data.trainingLocation === "gym" && equipmentStatus !== "ready") ||
              // Liste alinamadiysa gercek secim yapilamaz; yalnizca "Ekipman yok" ile devam edilebilir.
              (equipmentStatus === "error" && !data.equipment.includes("none"))
            }
          >
            <EquipmentStep
              location={data.trainingLocation}
              onLocationChange={(value) => update("trainingLocation", value)}
              options={equipmentList}
              status={equipmentStatus}
              onRetry={() => setEquipmentAttempt((n) => n + 1)}
              equipment={data.equipment}
              onEquipmentChange={(value) => update("equipment", value)}
            />
            {completingProfile && submitError ? (
              <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">
                {submitError}
              </Text>
            ) : null}
          </OnboardingScreen>
        );

      case "account":
      default:
        return (
          <OnboardingScreen
            step={stepNumber}
            totalSteps={totalSteps}
            title="MB FIT hesabını oluştur"
            description={
              googleSignup
                ? "Son olarak bir kullanıcı adı seç."
                : shoppingOnly
                  ? "Hesabını oluştur ve MB Shop'ta alışverişe başla."
                  : "Profilini kaydet ve kişiselleştirilmiş fitness yolculuğuna başla."
            }
            onBack={goBack}
            onContinue={goNext}
            continueLabel="Hesap oluştur"
            continueDisabled={!accountValid || isSubmitting || google.isLoading}
            continueLoading={isSubmitting}
          >
            <AccountStep
              username={data.username}
              onUsernameChange={(value) => update("username", value)}
              usernameAvailability={usernameAvailability}
              email={data.email}
              onEmailChange={(value) => update("email", value)}
              password={data.password}
              onPasswordChange={(value) => update("password", value)}
              confirmPassword={data.confirmPassword}
              onConfirmPasswordChange={(value) =>
                update("confirmPassword", value)
              }
              onGooglePress={handleGooglePress}
              googleLoading={google.isLoading}
              googleEmail={googleSignup?.profile.email || null}
              onUseOtherMethod={handleUseOtherMethod}
              onLoginPress={() => router.push("/pages/login")}
              errorMessage={submitError ?? google.errorMessage}
            />
          </OnboardingScreen>
        );
    }
  }
}

const styles = StyleSheet.create({
  error: { marginTop: 12, fontSize: 13, fontWeight: "600" },
});
