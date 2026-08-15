export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Category =
  | "Strength"
  | "Cardio"
  | "HIIT"
  | "Mobility"
  | "Core"
  | "Upper Body"
  | "Lower Body";

export type MuscleGroup = "Full Body" | "Upper Body" | "Lower Body" | "Core";

export type Equipment =
  | "No equipment"
  | "Dumbbells"
  | "Barbell"
  | "Machines"
  | "Resistance bands";

export type Workout = {
  id: string;
  title: string;
  tagline?: string;
  duration: number; // dakika
  difficulty: Difficulty;
  category: Category;
  muscleGroup: MuscleGroup;
  equipment: Equipment[];
  imageUrl: string;
  featured?: boolean;
};

export type DurationRange = "under20" | "20to40" | "40plus";

export type WorkoutFilters = {
  difficulty: Difficulty[];
  duration: DurationRange[];
  equipment: Equipment[];
  muscleGroup: MuscleGroup[];
};

export const EMPTY_FILTERS: WorkoutFilters = {
  difficulty: [],
  duration: [],
  equipment: [],
  muscleGroup: [],
};

export function hasActiveFilters(filters: WorkoutFilters): boolean {
  return (
    filters.difficulty.length > 0 ||
    filters.duration.length > 0 ||
    filters.equipment.length > 0 ||
    filters.muscleGroup.length > 0
  );
}
