import { addView as repoAddView } from "../../../data/repository/viewRepository";
import { getPlanById } from "../../../data/repository/planRepository";
import type { View } from "../../../data/repository/viewRepository";

export interface CreateViewInput {
  name: string;
  planIds?: string[];
}

export interface CreateViewResult {
  success: boolean;
  view?: View;
  error?: string;
}

export const createView = (input: CreateViewInput): CreateViewResult => {
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Nama view tidak boleh kosong." };
  }

  const validPlanIds = (input.planIds ?? []).filter(
    (planId) => getPlanById(planId) !== null,
  );

  const view = repoAddView({ name, planIds: validPlanIds });
  if (!view) {
    return { success: false, error: "Gagal menyimpan view." };
  }

  return { success: true, view };
};
