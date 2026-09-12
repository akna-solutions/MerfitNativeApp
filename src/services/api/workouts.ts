import { apiRequest } from "./client";
import { PagedResult, WorkoutDetail, WorkoutListItem, WorkoutListQuery } from "./types";

/** GET /api/workouts - filtrelenmis/sayfalanmis antrenman listesi. */
export async function getWorkouts(query: WorkoutListQuery = {}): Promise<PagedResult<WorkoutListItem>> {
  return apiRequest<PagedResult<WorkoutListItem>>("/api/workouts", {
    query: {
      search: query.search,
      difficulty: query.difficulty,
      duration: query.duration,
      equipment: query.equipment,
      muscleGroup: query.muscleGroup,
      categorySlug: query.categorySlug,
      personalized: query.personalized,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

/** GET /api/workouts/{id} - egzersiz listesiyle birlikte antrenman detayi. */
export async function getWorkoutDetail(id: number): Promise<WorkoutDetail> {
  return apiRequest<WorkoutDetail>(`/api/workouts/${id}`);
}
