import { addPlan as repoAddPlan } from "../../../data/repository/planRepository";
import { getActiveDataSourceId } from "../../../data/repository/dataSourceRepository";
import type { Plan } from "../../types/plan.types";

export interface AddPlanInput {
  name: string;
  datasourceId?: string;
  courseIds?: number[];
}

export interface AddPlanResult {
  success: boolean;
  plan?: Plan;
  error?: string;
}

/**
 * Use case: Buat plan baru.
 *
 * Validasi:
 * - Nama plan tidak boleh kosong.
 */
export const addPlan = (input: AddPlanInput): AddPlanResult => {
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Nama plan tidak boleh kosong." };
  }

  const datasourceId = input.datasourceId ?? getActiveDataSourceId() ?? undefined;

  const plan = repoAddPlan({
    name,
    datasourceId,
    data: {
      choosed: input.courseIds ?? [],
      available: [],
      unavailable: [],
    },
  });

  if (!plan) {
    return { success: false, error: "Gagal menyimpan plan." };
  }

  return { success: true, plan };
};
