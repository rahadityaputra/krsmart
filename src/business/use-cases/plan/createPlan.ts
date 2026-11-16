import { addPlan as repoAddPlan } from "../../../data/repository/planRepository";
import type { Plan } from "../../types/plan.types";

export interface createPlanInput {
  name: string;
  datasourceId?: string;
  courseIds?: number[];
  courseCodes?: string[];
}

export interface createPlanResult {
  success: boolean;
  plan?: Plan;
  error?: string;
}

export const createPlan = (input: createPlanInput): createPlanResult => {
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Nama plan tidak boleh kosong." };
  }

  const datasourceId = input.datasourceId ?? undefined;

  const plan = repoAddPlan({
    name,
    datasourceId,
    choosedCourses: input.courseCodes,
    data: {
      choosed: input.courseIds ?? [],
      available: input.courseIds ?? [],
      unavailable: [],
    },
  });

  console.log(plan);

  if (!plan) {
    return { success: false, error: "Gagal menyimpan plan." };
  }

  return { success: true, plan };
};
