import { addCourse } from "./addCourse";
import type { AddCourseInput, AddCourseResult } from "./addCourse";

export type AddScheduleInput = AddCourseInput;
export type AddScheduleResult = AddCourseResult;

/**
 * Use case: Menambahkan schedule (jadwal mata kuliah / course) ke dalam plan.
 * Mendelegasikan ke addCourse yang menangani validasi, cek bentrok, dan kalkulasi PlanData.
 */
export const addSchedule = (input: AddScheduleInput): AddScheduleResult => {
  return addCourse(input);
};
