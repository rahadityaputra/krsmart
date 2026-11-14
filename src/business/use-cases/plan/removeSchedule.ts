import { removeCourse } from "./removeCourse";
import type { RemoveCourseInput, RemoveCourseResult } from "./removeCourse";

export type RemoveScheduleInput = RemoveCourseInput;
export type RemoveScheduleResult = RemoveCourseResult;

/**
 * Use case: Menghapus schedule (jadwal mata kuliah / course) dari plan.
 * Mendelegasikan ke removeCourse yang menangani validasi dan sinkronisasi PlanData.
 */
export const removeSchedule = (input: RemoveScheduleInput): RemoveScheduleResult => {
  return removeCourse(input);
};
