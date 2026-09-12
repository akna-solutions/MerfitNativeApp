export type Difficulty = "Başlangıç" | "Orta" | "İleri";

// Category/MuscleGroup/Equipment artik backend'deki WorkoutCategory/MuscleGroup/Equipment
// tablolarindan (serbest metin) geldigi icin sabit union yerine string olarak tanimlandi.
// UI tarafindaki sabit secenek listeleri (bkz. WorkoutCategories, WorkoutFilterModal)
// gercek veri backend'deki isimlerle birebir eslesecek sekilde kalmali.
export type Category = string;

export type MuscleGroup = string;

export type Equipment = string;

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
