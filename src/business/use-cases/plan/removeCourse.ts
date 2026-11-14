import {
  removeSubjectFromPlan,
  getPlanById,
} from "../../../data/repository/planRepository";
import {
  getSubjectsOfDataSource,
  getActiveDataSourceId,
} from "../../../data/repository/dataSourceRepository";
import { calculatePlanData } from "./addCourse";
import type { Plan } from "../../types/plan.types";

export interface RemoveCourseInput {
  planId: string;
  courseId: number;
}

export interface RemoveCourseResult {
  success: boolean;
  plan?: Plan;
  error?: string;
}

/**
 * Use case: Hapus mata kuliah (course) dari plan.
 *
 * Validasi dan alur:
 * - Plan harus ada.
 * - Course harus ada di dalam `plan.data.choosed`.
 * - Hapus courseId dari choosed, update `plan.choosedCourses`, dan hitung ulang PlanData.
 */
export const removeCourse = (input: RemoveCourseInput): RemoveCourseResult => {
  const { planId, courseId } = input;

  const plan = getPlanById(planId);
  if (!plan) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const currentChoosed = plan.data?.choosed ?? [];
  if (!currentChoosed.includes(courseId)) {
    return { success: false, error: "Mata kuliah tidak ada di plan ini." };
  }

  const dsId = plan.datasourceId ?? getActiveDataSourceId();
  const allCourses = dsId ? getSubjectsOfDataSource(dsId) : [];
  const courseToRemove = allCourses.find((c) => c.id === courseId);

  const nextChoosed = currentChoosed.filter((id) => id !== courseId);
  const updatedPlanData = allCourses.length > 0 ? calculatePlanData(allCourses, nextChoosed) : undefined;

  const updated = removeSubjectFromPlan(
    planId,
    courseId,
    courseToRemove?.code,
    updatedPlanData
  );

  if (!updated) {
    return { success: false, error: "Gagal menyimpan perubahan plan." };
  }

  return { success: true, plan: updated };
};
