import { FitnessProfileGate } from "../../../shared/profile/FitnessProfileGate";
import { DashboardScreen } from "../dashboard/DashboardScreen";

export default function DashboardTab() {
  return (
    <FitnessProfileGate>
      <DashboardScreen />
    </FitnessProfileGate>
  );
}
