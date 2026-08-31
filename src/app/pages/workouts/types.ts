export type Difficulty = "Başlangıç" | "Orta" | "İleri";

export type Category =
  | "Kuvvet"
  | "Kardiyo"
  | "HIIT"
  | "Hareketlilik"
  | "Core"
  | "Üst Vücut"
  | "Alt Vücut";

export type MuscleGroup = "Tüm Vücut" | "Üst Vücut" | "Alt Vücut" | "Core";

export type Equipment =
  | "Ekipman yok"
  | "Dambıl"
  | "Halter"
  | "Makineler"
  | "Direnç bandı";

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
