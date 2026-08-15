import { StatusBar } from "expo-status-bar";

import { OnboardingContainer } from "./OnboardingContainer";

export default function OnboardingScreenRoute() {
  return (
    <>
      <StatusBar style="light" />
      <OnboardingContainer />
    </>
  );
}
