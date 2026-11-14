import {
  getAllViews,
  getViewById,
} from "../../../data/repository/viewRepository";
import { getPlanById } from "../../../data/repository/planRepository";
import type { View, ResolvedView } from "../../../data/repository/viewRepository";
import type { Plan } from "../../types/plan.types";

/**
 * Use case: Ambil semua view.
 */
export const getViews = (): View[] => {
  return getAllViews();
};

/**
 * Use case: Ambil satu view berdasarkan id.
 * Return null kalau tidak ditemukan.
 */
export const getView = (id: string): View | null => {
  return getViewById(id);
};

/**
 * Use case: Ambil view beserta data plan yang sudah di-resolve.
 *
 * Plan yang sudah dihapus otomatis tidak ikut (dilewati),
 * urutan sesuai planIds.
 */
export const getResolvedView = (id: string): ResolvedView | null => {
  const view = getViewById(id);
  if (!view) return null;

  const plans = view.planIds
    .map((planId) => getPlanById(planId))
    .filter((plan): plan is Plan => plan !== null);

  return { ...view, plans };
};
