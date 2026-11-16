import {
  getPlanById,
  addPlan as repoAddPlan,
} from "../../../data/repository/planRepository";
import type { Plan } from "../../types/plan.types";

export interface DuplicatePlanResult {
  success: boolean;
  plan?: Plan;
  error?: string;
}

export const duplicatePlan = (id: string): DuplicatePlanResult => {
  const original = getPlanById(id);
  if (!original) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const newPlan = repoAddPlan({
    name: `${original.name} (copy)`,
    datasourceId: original.datasourceId,
    choosedCourses: original.choosedCourses ? [...original.choosedCourses] : [],
    data: original.data
      ? {
          choosed: [...original.data.choosed],
          available: [...original.data.available],
          unavailable: original.data.unavailable.map((u) => ({
            id: u.id,
            reason: [...u.reason],
          })),
        }
      : undefined,
  });

  if (!newPlan) {
    return { success: false, error: "Gagal menduplikasi plan." };
  }

  return { success: true, plan: newPlan };
};
