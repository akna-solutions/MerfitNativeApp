import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ApiError,
  isApiError,
  NetworkError,
} from "../../../services/api/client";
import { getEquipmentList } from "../../../services/api/equipment";
import {
  EquipmentListItem,
  GoogleRegisterRequest,
  RegisterRequest,
} from "../../../services/api/types";
import { useAuth } from "../../../shared/auth/AuthContext";
import { refreshGoogleIdToken } from "../../../shared/auth/googleSignIn";
import { goToDashboardAfterAuth, goToEmailVerificationAfterAuth } from "../../../shared/auth/navigation";
import {
  clearPendingGoogleSignup,
  getPendingGoogleSignup,
  PendingGoogleSignup,
} from "../../../shared/auth/pendingGoogleSignup";
import { googleErrorMessage, useGoogleSignIn } from "../../../shared/auth/useGoogleSignIn";
import { useUsernameAvailability } from "../../../shared/auth/useUsernameAvailability";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { SuccessScreen } from "./components/SuccessScreen";
import { AccountStep } from "./steps/AccountStep";
import { ActivityStep } from "./steps/ActivityStep";
import { AgeStep } from "./steps/AgeStep";
import { EquipmentLoadStatus, EquipmentStep } from "./steps/EquipmentStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { FrequencyStep } from "./steps/FrequencyStep";
import { GenderStep } from "./steps/GenderStep";
import { GoalStep } from "./steps/GoalStep";
import { HeightStep } from "./steps/HeightStep";
import { LastNameStep } from "./steps/LastNameStep";
import { NameStep } from "./steps/NameStep";
import { WeightStep } from "./steps/WeightStep";
import { initialOnboardingData, OnboardingData } from "./types";

const TOTAL_STEPS = 12;

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

/** OnboardingData -> RegisterRequest (e-posta/sifre ile kayit). */
function toRegisterRequest(data: OnboardingData, allEquipmentIds: number[]): RegisterRequest {
  return {
    ...toProfileFields(data, allEquipmentIds),
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
  const params = useLocalSearchParams<{ google?: string }>();
  const { register, googleRegister } = useAuth();
  const google = useGoogleSignIn();
  // Giris ekraninda "Google ile devam et" denenip hesap bulunamadiysa onboarding Google moduyla acilir
  // (google=1): ad/soyad on doldurulur, son adimda e-posta/sifre yerine yalnizca kullanici adi sorulur.
  const [googleSignup, setGoogleSignup] = useState<PendingGoogleSignup | null>(() =>
    params.google === "1" ? getPendingGoogleSignup() : null,
  );
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(() => initialDataFor(googleSignup));
  // Google ile yeni hesap acildiginda (e-posta Google tarafindan dogrulanmis) kod ekrani yerine "Hazirsin" gosterilir.
  const [completedName, setCompletedName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentListItem[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentLoadStatus>("loading");
  const [equipmentAttempt, setEquipmentAttempt] = useState(0);
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
  ) => setData((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleCreateAccount();
    }
  };

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setSubmitError(null);
    setStep(step - 1);
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) return;
    if (googleSignup) {
      await handleCreateGoogleAccount(googleSignup);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await register(toRegisterRequest(data, equipmentList.map((item) => item.id)));
      // E-posta dogrulanmadan uygulamaya gecilmez: kayittan sonra dogrudan kod ekranina gidilir;
      // kod dogrulaninca "Hazırsın" ekrani gosterilir.
      goToEmailVerificationAfterAuth(router, {
        codeState: result.verificationEmailSent === false ? "failed" : "sent",
        fromRegistration: true,
        name: `${data.name} ${data.lastName}`.trim(),
      });
    } catch (error) {
      console.error("Kayıt hatası:", error);
      setSubmitError(registrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGoogleAccount = async (signup: PendingGoogleSignup) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // ID token ~1 saat gecerli; onboarding uzun surduyse sessizce yenisi alinir.
      const idToken = (await refreshGoogleIdToken()) ?? signup.idToken;
      const request: GoogleRegisterRequest = {
        ...toProfileFields(data, equipmentList.map((item) => item.id)),
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
        });
      } else if (result.isNewUser) {
        setCompletedName(name);
      } else {
        // Bu Google hesabi bu arada baska bir yoldan kaydolmus: dogrudan uygulamaya gecilir.
        goToDashboardAfterAuth(router);
      }
    } catch (error) {
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

  if (completedName !== null) {
    return <SuccessScreen name={completedName} onStart={() => goToDashboardAfterAuth(router)} />;
  }

  switch (step) {
    case 1:
      return (
        <OnboardingScreen
          step={1}
          totalSteps={TOTAL_STEPS}
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

    case 2:
      return (
        <OnboardingScreen
          step={2}
          totalSteps={TOTAL_STEPS}
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

    case 3:
      return (
        <OnboardingScreen
          step={3}
          totalSteps={TOTAL_STEPS}
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

    case 4:
      return (
        <OnboardingScreen
          step={4}
          totalSteps={TOTAL_STEPS}
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

    case 5:
      return (
        <OnboardingScreen
          step={5}
          totalSteps={TOTAL_STEPS}
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

    case 6:
      return (
        <OnboardingScreen
          step={6}
          totalSteps={TOTAL_STEPS}
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

    case 7:
      return (
        <OnboardingScreen
          step={7}
          totalSteps={TOTAL_STEPS}
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

    case 8:
      return (
        <OnboardingScreen
          step={8}
          totalSteps={TOTAL_STEPS}
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

    case 9:
      return (
        <OnboardingScreen
          step={9}
          totalSteps={TOTAL_STEPS}
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

    case 10:
      return (
        <OnboardingScreen
          step={10}
          totalSteps={TOTAL_STEPS}
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

    case 11:
      return (
        <OnboardingScreen
          step={11}
          totalSteps={TOTAL_STEPS}
          title="Nerede antrenman yapıyorsun?"
          onBack={goBack}
          onContinue={goNext}
          continueDisabled={
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
        </OnboardingScreen>
      );

    case 12:
    default:
      return (
        <OnboardingScreen
          step={12}
          totalSteps={TOTAL_STEPS}
          title="MB FIT hesabını oluştur"
          description={
            googleSignup
              ? "Son olarak bir kullanıcı adı seç."
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
