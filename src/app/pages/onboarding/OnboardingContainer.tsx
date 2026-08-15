import { useRouter } from "expo-router";
import { useState } from "react";

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

export function OnboardingContainer() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);

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
    setStep(step - 1);
  };

  const handleCreateAccount = () => {
    // TODO: gerçek authentication / backend entegrasyonu bağlandığında
    // burada data (OnboardingData) profili API'ye gönderilecek.
    setShowSuccess(true);
  };

  const handleStartTraining = () => {
    // TODO: dashboard/home route'u eklendiğinde buraya yönlendir.
    router.replace("/pages/welcome");
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
          title="What's your name?"
          description="We'll use your name to personalize your MERFIT experience."
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
          title="What's your gender?"
          description="This helps us personalize your fitness recommendations."
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
          title="How old are you?"
          description="Your age helps us personalize your training and nutrition recommendations."
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
          title="How tall are you?"
          description="We'll use your height to help calculate your fitness metrics."
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
          title="What's your current weight?"
          description="This helps us personalize your goals and track your progress."
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
          title="What's your main goal?"
          description="Choose the goal you want MERFIT to focus on."
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
          title="How active are you?"
          description="Tell us about your current activity level."
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
          title="What's your training experience?"
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
          title="How often do you want to train?"
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
          title="Where do you train?"
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
          title="Create your MERFIT account"
          description="Save your profile and start your personalized fitness journey."
          onBack={goBack}
          onContinue={goNext}
          continueLabel="Create account"
          continueDisabled={!accountValid}
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
          />
        </OnboardingScreen>
      );
  }
}
