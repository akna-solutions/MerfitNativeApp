import { useLocalSearchParams } from "expo-router";

import { ActiveWorkout } from "../ActiveWorkout";

export default function ActiveWorkoutRoute() {
  const { id, title, workoutPlanDayId } = useLocalSearchParams<{
    id: string;
    title?: string;
    workoutPlanDayId?: string;
  }>();

  return (
    <ActiveWorkout workoutId={id} workoutTitle={title} workoutPlanDayId={workoutPlanDayId} />
  );
}
