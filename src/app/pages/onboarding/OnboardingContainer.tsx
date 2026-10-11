import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ApiError,
  isApiError,
  NetworkError,
} from "../../../services/api/client";
import { getEquipmentList } from "../../../services/api/equipment";
import {
  EquipmentListItem,
  RegisterRequest,
} from "../../../services/api/types";
import { useAuth } from "../../../shared/auth/AuthContext";
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

/**
 * OnboardingData (RN state) -> RegisterRequest (backend DTO). Sayisal alanlar backend'de
 * decimal/int oldugundan bos string'ler yerine null gonderiyoruz.
 */
function toRegisterRequest(data: OnboardingData): RegisterRequest {
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
    email: data.email.trim(),
    password: data.password,
    confirmPassword: data.confirmPassword,
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
    // "none" yalnizca istemci secenegidir; backend'e yalnizca gercek Equipment.Id'leri gider.
    equipmentIds: data.equipment.filter((item): item is number => item !== "none"),
  };
}

export function OnboardingContainer() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentListItem[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentLoadStatus>("loading");
  const [equipmentAttempt, setEquipmentAttempt] = useState(0);

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

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await register(toRegisterRequest(data));
      setShowSuccess(true);
    } catch (error) {
      console.error("Kayıt hatası:", error);
      if (isApiError(error)) {
        const apiError = error as ApiError;
        setSubmitError(
          apiError.fieldErrors.length > 0
            ? apiError.fieldErrors[0]
            : apiError.message,
        );
      } else if (error instanceof NetworkError) {
        setSubmitError(
          "Sunucuya ulaşılamadı. İnternet bağlantınızı veya backend adresini kontrol edin.",
        );
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Hesap oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTraining = () => {
    router.replace("/pages/dashboard");
  };

  if (showSuccess) {
    return (
      <SuccessScreen
        name={`${data.name} ${data.lastName}`.trim()}
        onStart={handleStartTraining}
      />
    );
  }

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
  const accountValid = usernameValid && emailValid && passwordValid && passwordsMatch;

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
          description="Profilini kaydet ve kişiselleştirilmiş fitness yolculuğuna başla."
          onBack={goBack}
          onContinue={goNext}
          continueLabel="Hesap oluştur"
          continueDisabled={!accountValid || isSubmitting}
          continueLoading={isSubmitting}
        >
          <AccountStep
            username={data.username}
            onUsernameChange={(value) => update("username", value)}
            email={data.email}
            onEmailChange={(value) => update("email", value)}
            password={data.password}
            onPasswordChange={(value) => update("password", value)}
            confirmPassword={data.confirmPassword}
            onConfirmPasswordChange={(value) =>
              update("confirmPassword", value)
            }
            onGooglePress={() => {
              // TODO: mevcut authentication sistemi bağlandığında Google OAuth akışını burada tetikle.
            }}
            onLoginPress={() => router.push("/pages/login")}
            errorMessage={submitError}
          />
        </OnboardingScreen>
      );
  }
}
