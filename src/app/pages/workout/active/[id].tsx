import { useLocalSearchParams } from "expo-router";

import { ActiveWorkout } from "../ActiveWorkout";

export default function ActiveWorkoutRoute() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  return <ActiveWorkout workoutId={id} workoutTitle={title} />;
}
