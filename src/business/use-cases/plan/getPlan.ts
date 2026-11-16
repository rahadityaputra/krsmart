import {
  getAllPlans,
  getPlanById,
} from "../../../data/repository/planRepository";
import type { Plan } from "../../types/plan.types";

export const getPlans = (): Plan[] => {
  return getAllPlans();
};

export const getPlan = (id: string): Plan | null => {
  return getPlanById(id);
};
