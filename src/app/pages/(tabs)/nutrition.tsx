import { FitnessProfileGate } from "../../../shared/profile/FitnessProfileGate";
import { NutritionScreen } from "../nutrition/NutritionScreen";

export default function NutritionTab() {
  return (
    <FitnessProfileGate>
      <NutritionScreen />
    </FitnessProfileGate>
  );
}
