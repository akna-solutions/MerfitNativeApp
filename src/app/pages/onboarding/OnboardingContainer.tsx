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
import { EquipmentStep } from "./steps/EquipmentStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { FrequencyStep } from "./steps/FrequencyStep";
import { GenderStep } from "./steps/GenderStep";
import { GoalStep } from "./steps/GoalStep";
import { HeightStep } from "./steps/HeightStep";
import { NameStep } from "./steps/NameStep";
import { WeightStep } from "./steps/WeightStep";
import { initialOnboardingData, OnboardingData } from "./types";

const TOTAL_STEPS = 11;

/**
 * EquipmentStep'te secilen slug'lari (orn. "dumbbells") GET /api/equipment'ten gelen
 * slug->id listesiyle eslestirir. "none" (ekipman yok) yerel bir secenektir, backend'de
 * karsiligi olmadigindan gonderilmez. Henuz listeye eslenmeyen (orn. servis cekilemediyse)
 * ogeler sessizce atlanir - EquipmentIds backend'de opsiyonel oldugundan register'i bloklamaz.
 */
function mapEquipmentSlugsToIds(
  slugs: OnboardingData["equipment"],
  equipmentList: EquipmentListItem[],
): number[] {
  if (equipmentList.length === 0) return [];

  const idBySlug = new Map(equipmentList.map((item) => [item.slug, item.id]));
  return slugs
    .filter((slug) => slug !== "none")
    .map((slug) => idBySlug.get(slug))
    .filter((id): id is number => id !== undefined);
}

/**
 * OnboardingData (RN state) -> RegisterRequest (backend DTO). Sayisal alanlar backend'de
 * decimal/int oldugundan bos string'ler yerine null gonderiyoruz.
 */
function toRegisterRequest(
  data: OnboardingData,
  equipmentList: EquipmentListItem[],
): RegisterRequest {
  const age = parseInt(data.age, 10);
  const heightCm = data.height ? parseFloat(data.height) : null;
  const heightFeet = data.heightFeet ? parseInt(data.heightFeet, 10) : null;
  const heightInches = data.heightInches
    ? parseInt(data.heightInches, 10)
    : null;
  const weight = data.weight ? parseFloat(data.weight) : null;

  return {
    name: data.name.trim(),
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
    equipmentIds: mapEquipmentSlugsToIds(data.equipment, equipmentList),
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

  // Ekipman listesini akisin basinda, arka planda cekiyoruz; boylece kullanici EquipmentStep'e
  // (adim 10) geldiginde ve daha onemlisi "Hesap oluştur"a bastiginda liste zaten hazir olur.
  // Cekme basarisiz olursa sessizce yutuyoruz - equipmentIds bos gider, register yine de calisir.
  useEffect(() => {
    let isMounted = true;
    getEquipmentList()
      .then((list) => {
        if (isMounted) setEquipmentList(list);
      })
      .catch((error) => {
        console.warn("Ekipman listesi alinamadi:", error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
      await register(toRegisterRequest(data, equipmentList));
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
    return <SuccessScreen name={data.name} onStart={handleStartTraining} />;
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
  const accountValid = emailValid && passwordValid && passwordsMatch;

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

    case 3:
      return (
        <OnboardingScreen
          step={3}
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

    case 4:
      return (
        <OnboardingScreen
          step={4}
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

    case 5:
      return (
        <OnboardingScreen
          step={5}
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

    case 6:
      return (
        <OnboardingScreen
          step={6}
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

    case 7:
      return (
        <OnboardingScreen
          step={7}
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

    case 8:
      return (
        <OnboardingScreen
          step={8}
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

    case 9:
      return (
        <OnboardingScreen
          step={9}
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

    case 10:
      return (
        <OnboardingScreen
          step={10}
          totalSteps={TOTAL_STEPS}
          title="Nerede antrenman yapıyorsun?"
          onBack={goBack}
          onContinue={goNext}
          continueDisabled={!data.trainingLocation}
        >
          <EquipmentStep
            location={data.trainingLocation}
            onLocationChange={(value) => update("trainingLocation", value)}
            equipment={data.equipment}
            onEquipmentChange={(value) => update("equipment", value)}
          />
        </OnboardingScreen>
      );

    case 11:
    default:
      return (
        <OnboardingScreen
          step={11}
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
