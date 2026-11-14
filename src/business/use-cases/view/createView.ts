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

/**
 * Use case: Buat view baru.
 *
 * Validasi:
 * - Nama view tidak boleh kosong.
 * - Jika planIds diberikan, semua plan harus ada (yang tidak valid diabaikan).
 */
export const createView = (input: CreateViewInput): CreateViewResult => {
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Nama view tidak boleh kosong." };
  }

  // Filter planIds yang valid (ada di storage)
  const validPlanIds = (input.planIds ?? []).filter(
    (planId) => getPlanById(planId) !== null
  );

  const view = repoAddView({ name, planIds: validPlanIds });
  if (!view) {
    return { success: false, error: "Gagal menyimpan view." };
  }

  return { success: true, view };
};
