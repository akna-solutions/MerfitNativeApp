import { FitnessProfileGate } from "../../../shared/profile/FitnessProfileGate";
import { ProgressScreen } from "../progress/ProgressScreen";

export default function ProgressTab() {
  return (
    <FitnessProfileGate>
      <ProgressScreen />
    </FitnessProfileGate>
  );
}
