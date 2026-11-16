import { removePlan } from "../../../data/repository/planRepository";

export interface DeletePlanResult {
  success: boolean;
  error?: string;
}

export const deletePlan = (id: string): DeletePlanResult => {
  if (!id.trim()) {
    return { success: false, error: "ID plan tidak boleh kosong." };
  }

  const removed = removePlan(id);
  if (!removed) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  return { success: true };
};
