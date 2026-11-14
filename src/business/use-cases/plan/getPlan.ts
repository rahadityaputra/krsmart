import {
  getAllPlans,
  getPlanById,
} from "../../../data/repository/planRepository";
import type { Plan } from "../../types/plan.types";

/**
 * Use case: Ambil semua plan.
 */
export const getPlans = (): Plan[] => {
  return getAllPlans();
};

/**
 * Use case: Ambil satu plan berdasarkan id.
 * Return null kalau tidak ditemukan.
 */
export const getPlan = (id: string): Plan | null => {
  return getPlanById(id);
};
