import { FitnessProfileGate } from "../../../shared/profile/FitnessProfileGate";
import { WorkoutsScreen } from "../workouts/WorkoutsScreen";

export default function WorkoutsTab() {
  return (
    <FitnessProfileGate>
      <WorkoutsScreen />
    </FitnessProfileGate>
  );
}
