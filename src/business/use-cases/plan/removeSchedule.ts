import {
  removeSubjectFromPlan,
  getPlanById,
} from "../../../data/repository/planRepository";
import { getSubjectsOfDataSource } from "../../../data/repository/dataSourceRepository";
import { calculatePlanData } from "./addSchedule";
import type { Plan } from "../../types/plan.types";

export interface RemoveScheduleInput {
  planId: string;
  scheduleId: number;
}

export interface RemoveScheduleResult {
  success: boolean;
  plan?: Plan;
  error?: string;
}

export const removeSchedule = (
  input: RemoveScheduleInput
): RemoveScheduleResult => {
  const { planId, scheduleId } = input;

  const plan = getPlanById(planId);
  if (!plan) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const currentChoosed = plan.data?.choosed ?? [];
  if (!currentChoosed.includes(scheduleId)) {
    return { success: false, error: "Jadwal tidak ada di plan ini." };
  }

  const allSchedules = plan.datasourceId
    ? getSubjectsOfDataSource(plan.datasourceId)
    : [];
  const scheduleToRemove = allSchedules.find((s) => s.id === scheduleId);

  const nextChoosed = currentChoosed.filter((id) => id !== scheduleId);
  const updatedPlanData =
    allSchedules.length > 0
      ? calculatePlanData(allSchedules, nextChoosed)
      : undefined;

  const updated = removeSubjectFromPlan(
    planId,
    scheduleId,
    scheduleToRemove?.course.code,
    updatedPlanData
  );

  if (!updated) {
    return { success: false, error: "Gagal menyimpan perubahan plan." };
  }

  return { success: true, plan: updated };
};